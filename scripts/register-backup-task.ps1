<#
.SYNOPSIS
    backup-db.ps1 을 윈도우 작업 스케줄러에 매일 실행으로 등록한다. (관리자 PowerShell 에서 1회)

.DESCRIPTION
    매일 지정 시각에 DB 백업을 자동 실행. Docker Desktop 이 실행 중일 때만 성공하므로
    사용자가 로그인해 Docker Desktop 이 떠 있는 시간대(홈서버는 보통 상시 로그인)로 잡는다.
    로그인 여부와 무관하게 트리거되도록 S4U 로 등록하되, Docker 가 없으면 스크립트가
    실패를 로그에 남기고 종료한다(안전).

.PARAMETER Time
    매일 실행 시각 HH:mm (기본 04:30 — 데이터 수집이 한가한 새벽).

.EXAMPLE
    # 관리자 PowerShell
    powershell -ExecutionPolicy Bypass -File .\register-backup-task.ps1
.EXAMPLE
    .\register-backup-task.ps1 -Time 03:00 -BackupDir "$env:USERPROFILE\OneDrive\jipyo-backups"
#>
param(
    [string]$Time = '04:30',
    [string]$TaskName = 'JipyoDbBackup',
    [string]$BackupDir = '',
    [int]$KeepDays = 14
)

$ErrorActionPreference = 'Stop'
$script = Join-Path $PSScriptRoot 'backup-db.ps1'
if (-not (Test-Path $script)) { throw "backup-db.ps1 을 찾을 수 없습니다: $script" }

# backup-db.ps1 에 넘길 인자 구성 (BackupDir 지정 시 오프사이트 폴더 사용)
$scriptArgs = "-NoProfile -ExecutionPolicy Bypass -File `"$script`" -KeepDays $KeepDays"
if ($BackupDir) { $scriptArgs += " -BackupDir `"$BackupDir`"" }

$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $scriptArgs
$trigger = New-ScheduledTaskTrigger -Daily -At $Time
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 30) `
    -MultipleInstances IgnoreNew
# 로그인하지 않아도 실행(S4U) + 최고 권한
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType S4U -RunLevel Highest

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger `
    -Settings $settings -Principal $principal -Force | Out-Null

Write-Host "등록 완료: 작업 '$TaskName' — 매일 $Time 실행" -ForegroundColor Green
Write-Host "지금 한 번 테스트: Start-ScheduledTask -TaskName $TaskName" -ForegroundColor Cyan
Write-Host "결과 로그: (BackupDir)\backup.log"
