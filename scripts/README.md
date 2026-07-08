# 운영 스크립트

## DB 백업 (자동)

가이드·게시글·경제소식 요약 등 **관리자가 직접 쓴 콘텐츠는 DB 볼륨에만** 존재하므로
정기 백업이 필수다. (git 시드에는 초기 가이드 8편만 있고, 이후 편집분은 DB 에만 있음)

백업은 **docker-compose 의 `backup` 서비스가 자동으로** 수행한다 — 별도 등록/스케줄러 불필요.
`docker compose up -d` 하면 매일 `BACKUP_HOUR`(기본 04시 KST)에 압축 백업이 만들어진다.

| 파일 | 용도 |
|---|---|
| `backup-loop.sh` | 백업 컨테이너가 실행하는 루프 (매일 pg_dump·정리·로깅) |
| `restore-db.ps1` | 백업 파일로 복구 (⚠ 기존 데이터 덮어씀) |
| `backup-db.ps1` | 필요 시 **수동 1회** 백업 (스케줄과 무관) |

### 설정 (`.env`)

```env
# 오프사이트 보관: OneDrive/Google Drive 동기화 폴더로 지정 (디스크 고장 대비)
BACKUP_DIR=C:/Users/<사용자>/OneDrive/jipyo-backups
BACKUP_HOUR=4          # 매일 백업 시각(KST). 기본 4
BACKUP_KEEP_DAYS=14    # 보관 일수. 기본 14
```
지정하지 않으면 프로젝트 루트 `./backups` 에 저장된다.

### 확인 / 운영

```powershell
docker compose up -d backup                 # 백업 서비스 기동
docker compose logs -f backup               # 동작 로그
Get-Content .\backups\backup.log -Tail 10   # 백업 이력 (OK/FAIL)
docker compose ls                           # 상태 확인

# 즉시 1회 백업 테스트가 필요하면
docker compose run --rm -e RUN_ON_START=true backup   # 시작 시 1회 백업 후 루프
#   또는 수동 PS: powershell -File .\scripts\backup-db.ps1
```

### 복구 (⚠ 기존 데이터 덮어씀)

```powershell
docker compose stop backend
.\scripts\restore-db.ps1 -File .\backups\jipyo_2026-07-06_040000.dump
docker compose start backend
```

### 주의
- 백업 파일은 custom format(`pg_dump -Fc`, 압축). 복구는 `pg_restore`(= restore-db.ps1)로 한다.
- `BACKUP_DIR` 를 동기화 폴더로 두지 않으면 **같은 디스크**라 디스크 사망 시 함께 유실됨 — 오프사이트 권장.
- 백업 컨테이너는 postgres 가 healthy 여야 붙는다. `PGPASSWORD` 는 `DB_PASSWORD` 로 주입된다.
