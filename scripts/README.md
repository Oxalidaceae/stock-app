# 운영 스크립트

윈도우 홈서버(Docker Desktop)용 PowerShell 스크립트.

## DB 백업 자동화

가이드·게시글·경제소식 요약 등 **관리자가 직접 쓴 콘텐츠는 DB 볼륨에만** 존재하므로
정기 백업이 필수다. (git 시드에는 초기 8편만 있고, 이후 편집분은 DB 에만 있음)

| 스크립트 | 용도 |
|---|---|
| `backup-db.ps1` | pg_dump(압축) → 호스트 복사 → 오래된 백업 정리. 수동/스케줄 공용 |
| `register-backup-task.ps1` | 위 스크립트를 작업 스케줄러에 매일 실행 등록 (관리자 PS 1회) |
| `restore-db.ps1` | 백업 파일로 복구 (⚠ 기존 데이터 덮어씀) |

### 설치 (서버에서 1회)

```powershell
# 저장소 폴더에서. 오프사이트 보관을 위해 BackupDir 를 OneDrive/Drive 동기화 폴더로 권장.
powershell -ExecutionPolicy Bypass -File .\scripts\register-backup-task.ps1 `
  -BackupDir "$env:USERPROFILE\OneDrive\jipyo-backups" -Time 04:30

# 바로 한 번 테스트
Start-ScheduledTask -TaskName JipyoDbBackup
Get-Content "$env:USERPROFILE\OneDrive\jipyo-backups\backup.log" -Tail 5
```

### 복구

```powershell
docker compose stop backend
.\scripts\restore-db.ps1 -File "$env:USERPROFILE\OneDrive\jipyo-backups\jipyo_2026-07-06_043000.dump"
docker compose start backend
```

### 주의
- Docker Desktop 이 실행 중(로그인 세션)일 때만 백업이 성공한다. 실패 시 `backup.log` 에 `FAIL` 기록.
- `BackupDir` 를 OneDrive/Google Drive 동기화 폴더로 두면 디스크 고장에도 대비된다(오프사이트).
- 로컬 폴더(`scripts\backups\`)만 쓰면 **같은 디스크**라 디스크 사망 시 함께 유실됨 — 오프사이트 권장.
