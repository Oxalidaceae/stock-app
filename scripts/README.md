# 운영 스크립트

## DB 백업 (자동)

가이드·게시글·경제소식 요약 등 **관리자가 직접 쓴 콘텐츠는 DB 볼륨에만** 존재하므로
정기 백업이 필수다. (git 시드에는 초기 가이드 8편만 있고, 이후 편집분은 DB 에만 있음)

백업은 **docker-compose 의 `backup` 서비스가 자동으로** 수행한다 — 별도 등록/스케줄러 불필요.
`docker compose up -d` 하면 매일 `BACKUP_HOUR`(기본 04시 KST)에 압축 백업이 만들어진다.

| 파일 | 용도 | OS |
|---|---|---|
| `backup-loop.sh` | 백업 컨테이너가 실행하는 루프 (매일 pg_dump·정리·로깅) | 공통 (컨테이너 내부) |
| `restore-db.sh` | 백업 파일로 복구 (⚠ 기존 데이터 덮어씀) | Linux |
| `backup-db.sh` | 필요 시 **수동 1회** 백업 (스케줄과 무관) | Linux |
| `restore-db.ps1` | 위와 동일 | Windows |
| `backup-db.ps1` | 위와 동일 | Windows |

`.sh` / `.ps1` 는 같은 일을 하는 짝이다. 운영 서버 OS 에 맞는 쪽을 쓰면 된다.

### 설정 (`.env`)

```env
# 오프사이트 보관: 클라우드 동기화 폴더로 지정 (디스크 고장 대비)
#   윈도우: BACKUP_DIR=C:/Users/<사용자>/OneDrive/jipyo-backups
#   리눅스: BACKUP_DIR=/home/<사용자>/jipyo-backups
BACKUP_DIR=/home/<사용자>/jipyo-backups
BACKUP_HOUR=4          # 매일 백업 시각(KST). 기본 4
BACKUP_KEEP_DAYS=14    # 보관 일수. 기본 14
```
지정하지 않으면 프로젝트 루트 `./backups` 에 저장된다.

### 확인 / 운영

```bash
docker compose up -d backup            # 백업 서비스 기동
docker compose logs -f backup          # 동작 로그
tail -n 10 ./backups/backup.log        # 백업 이력 (OK/FAIL)
docker compose ps                      # 상태 확인

# 즉시 1회 백업이 필요하면
./scripts/backup-db.sh
```

### 복구 (⚠ 기존 데이터 덮어씀)

```bash
docker compose stop backend collector-daemon
./scripts/restore-db.sh ./backups/jipyo_2026-07-06_040000.dump
docker compose start backend collector-daemon
```

`-y` 를 주면 확인 프롬프트를 건너뛴다(서버 이관 스크립트 등 비대화형 실행용).

### 주의
- 백업 파일은 custom format(`pg_dump -Fc`, 압축). 복구는 `pg_restore`(= `restore-db.sh`)로 한다.
- 두 스크립트 모두 복사·복구 **전에 `pg_restore -l` 로 TOC 를 검증**한다. 손상된 덤프로 `--clean`
  을 돌리면 기존 데이터만 날아가고 복구는 실패하기 때문이다. 서버 간 전송 후에는 여기에 더해
  양쪽 `sha256sum` 도 비교할 것.
- `BACKUP_DIR` 를 동기화 폴더로 두지 않으면 **같은 디스크**라 디스크 사망 시 함께 유실됨 — 오프사이트 권장.
- 백업 컨테이너는 postgres 가 healthy 여야 붙는다. `PGPASSWORD` 는 `DB_PASSWORD` 로 주입된다.
