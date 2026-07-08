<#
.SYNOPSIS
    backup-db.ps1 이 만든 백업(.dump)으로 DB 를 복구한다.

.DESCRIPTION
    ⚠ 대상 DB 의 기존 데이터를 백업 시점으로 덮어쓴다(--clean). 재해 복구용.
    복구 중 잠금 충돌을 피하려고 backend 를 먼저 멈추길 권장한다.

.PARAMETER File
    복구할 백업 파일 경로 (custom format .dump).

.EXAMPLE
    # (권장) 백엔드 정지 후 복구
    docker compose stop backend
    .\restore-db.ps1 -File .\backups\jipyo_2026-07-06_043000.dump
    docker compose start backend
#>
param(
    [Parameter(Mandatory = $true)][string]$File,
    [string]$Container = 'stockapp-postgres',
    [string]$DbUser = 'stockapp',
    [string]$DbName = 'stockapp'
)

$ErrorActionPreference = 'Stop'
if (-not (Test-Path $File)) { throw "백업 파일을 찾을 수 없습니다: $File" }

Write-Host "경고: '$DbName' 의 기존 데이터를 이 백업으로 덮어씁니다." -ForegroundColor Yellow
Write-Host "  파일: $File"
Write-Host "  복구 전 'docker compose stop backend' 로 백엔드를 멈추는 것을 권장합니다." -ForegroundColor Yellow
if ((Read-Host "계속하려면 yes 입력") -ne 'yes') { Write-Host '취소됨'; exit 1 }

$tmp = '/tmp/jipyo_restore.dump'
docker cp $File "${Container}:${tmp}"
if ($LASTEXITCODE -ne 0) { throw "docker cp 실패" }

# --clean --if-exists: 기존 객체 삭제 후 복구, --no-owner: 소유자 구문 무시
docker exec $Container pg_restore -U $DbUser -d $DbName --clean --if-exists --no-owner $tmp
$restoreExit = $LASTEXITCODE
docker exec $Container rm -f $tmp | Out-Null

if ($restoreExit -ne 0) {
    Write-Host "pg_restore 가 경고/오류와 함께 종료됨 (exit $restoreExit). 로그를 확인하세요." -ForegroundColor Yellow
    Write-Host "(존재하지 않는 객체 DROP 경고는 정상일 수 있습니다.)"
} else {
    Write-Host "복구 완료." -ForegroundColor Green
}
Write-Host "백엔드 재시작: docker compose start backend  (또는 restart backend)"
