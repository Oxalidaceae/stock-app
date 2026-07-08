<#
.SYNOPSIS
    Jipyo PostgreSQL 자동 백업 (Windows + Docker Desktop)

.DESCRIPTION
    stockapp-postgres 컨테이너에서 pg_dump(custom format = 압축)로 덤프한 뒤
    호스트로 복사하고, 보관 기간이 지난 오래된 백업을 정리한다.

    PowerShell 의 리다이렉션(>)은 기본 UTF-16 으로 써서 SQL 덤프를 손상시키므로,
    컨테이너 내부에 바이너리 덤프를 만든 뒤 `docker cp` 로 가져오는 방식을 쓴다.
    custom format(-Fc)이라 복구는 pg_restore(= restore-db.ps1)로 한다.

.PARAMETER BackupDir
    백업 저장 폴더. 기본값은 이 스크립트 옆의 backups\.
    ★ OneDrive/Google Drive 동기화 폴더로 지정하면 자동으로 오프사이트(클라우드) 백업이 된다.
      예) -BackupDir "$env:USERPROFILE\OneDrive\jipyo-backups"

.PARAMETER KeepDays
    이 일수보다 오래된 백업 파일 삭제 (기본 14일).

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\backup-db.ps1
.EXAMPLE
    .\backup-db.ps1 -BackupDir "$env:USERPROFILE\OneDrive\jipyo-backups" -KeepDays 30
#>
param(
    [string]$BackupDir = (Join-Path $PSScriptRoot 'backups'),
    [int]$KeepDays = 14,
    [string]$Container = 'stockapp-postgres',
    [string]$DbUser = 'stockapp',
    [string]$DbName = 'stockapp'
)

$ErrorActionPreference = 'Stop'
$stamp = Get-Date -Format 'yyyy-MM-dd_HHmmss'
$logFile = Join-Path $BackupDir 'backup.log'
$tmpInContainer = '/tmp/jipyo_backup.dump'
$outFile = Join-Path $BackupDir "jipyo_$stamp.dump"

function Write-Log($msg) {
    $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  $msg"
    Write-Host $line
    try { Add-Content -Path $logFile -Value $line -Encoding UTF8 } catch { }
}

try {
    New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

    # 1) 컨테이너 실행 확인 (Docker Desktop 이 떠 있어야 함 = 로그인 세션 필요)
    $running = docker inspect -f '{{.State.Running}}' $Container 2>$null
    if ($running -ne 'true') { throw "컨테이너 '$Container' 가 실행 중이 아닙니다. Docker Desktop 이 켜져 있는지 확인하세요." }

    # 2) 컨테이너 내부에서 덤프 (custom format = 압축)
    docker exec $Container pg_dump -U $DbUser -Fc -f $tmpInContainer $DbName
    if ($LASTEXITCODE -ne 0) { throw "pg_dump 실패 (exit $LASTEXITCODE)" }

    # 3) 덤프 유효성 검증 (TOC 를 읽을 수 있어야 정상 파일)
    docker exec $Container pg_restore -l $tmpInContainer | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "덤프 검증(pg_restore -l) 실패 — 손상된 덤프" }

    # 4) 호스트로 복사 후 컨테이너 임시파일 제거
    docker cp "${Container}:${tmpInContainer}" $outFile
    if ($LASTEXITCODE -ne 0) { throw "docker cp 실패 (exit $LASTEXITCODE)" }
    docker exec $Container rm -f $tmpInContainer | Out-Null

    # 5) 크기 sanity 체크
    $sizeKB = [math]::Round((Get-Item $outFile).Length / 1KB, 1)
    if ($sizeKB -lt 1) { throw "백업 파일이 비정상적으로 작습니다 ($sizeKB KB)" }
    Write-Log "OK  백업 성공: $($outFile) ($sizeKB KB)"

    # 6) 오래된 백업 정리
    $cutoff = (Get-Date).AddDays(-$KeepDays)
    Get-ChildItem $BackupDir -Filter 'jipyo_*.dump' |
        Where-Object { $_.LastWriteTime -lt $cutoff } |
        ForEach-Object { Remove-Item $_.FullName -Force; Write-Log "정리  오래된 백업 삭제: $($_.Name)" }

    exit 0
}
catch {
    Write-Log "FAIL 백업 실패: $($_.Exception.Message)"
    docker exec $Container rm -f $tmpInContainer 2>$null | Out-Null
    exit 1
}
