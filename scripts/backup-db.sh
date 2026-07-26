#!/usr/bin/env bash
# Jipyo PostgreSQL 수동 1회 백업 (Linux) — backup-db.ps1 의 리눅스 판.
#
# 평상시 백업은 docker-compose 의 `backup` 서비스가 자동으로 돌린다(backup-loop.sh).
# 이 스크립트는 배포 직전·서버 이관 직전처럼 "지금 당장 한 번" 이 필요할 때 쓴다.
#
# stockapp-postgres 컨테이너 안에서 pg_dump(custom format = 압축)로 덤프하고,
# TOC 검증 후 호스트로 복사한 뒤 보관 기간이 지난 파일을 정리한다.
#
# 사용법:
#   ./scripts/backup-db.sh
#   BACKUP_DIR=/home/junsu/jipyo-backups KEEP_DAYS=30 ./scripts/backup-db.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$REPO_ROOT/backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"
CONTAINER="${CONTAINER:-stockapp-postgres}"
DB_USER="${DB_USER:-stockapp}"
DB_NAME="${DB_NAME:-stockapp}"

TMP_IN_CONTAINER=/tmp/jipyo_backup.dump
STAMP="$(date +%Y-%m-%d_%H%M%S)"
OUT_FILE="$BACKUP_DIR/jipyo_${STAMP}.dump"
LOG_FILE="$BACKUP_DIR/backup.log"

mkdir -p "$BACKUP_DIR"
log() { echo "$(date '+%F %T')  $1" | tee -a "$LOG_FILE"; }

cleanup() { docker exec "$CONTAINER" rm -f "$TMP_IN_CONTAINER" >/dev/null 2>&1 || true; }
fail() { log "FAIL 백업 실패: $1"; exit 1; }
trap cleanup EXIT

# 1) 컨테이너 실행 확인
[ "$(docker inspect -f '{{.State.Running}}' "$CONTAINER" 2>/dev/null)" = "true" ] \
    || fail "컨테이너 '$CONTAINER' 가 실행 중이 아닙니다."

# 2) 컨테이너 내부에서 덤프 (custom format = 압축)
#    호스트로 파이프하지 않고 컨테이너 안에 파일로 쓴 뒤 docker cp 하는 이유는
#    리다이렉션 계층에서 바이너리가 손상되는 사고를 원천 차단하기 위함이다.
docker exec "$CONTAINER" pg_dump -U "$DB_USER" -Fc -f "$TMP_IN_CONTAINER" "$DB_NAME" \
    || fail "pg_dump 실패"

# 3) 덤프 유효성 검증 (TOC 를 읽을 수 있어야 정상 파일)
docker exec "$CONTAINER" pg_restore -l "$TMP_IN_CONTAINER" >/dev/null \
    || fail "덤프 검증(pg_restore -l) 실패 — 손상된 덤프"

# 4) 호스트로 복사
docker cp "${CONTAINER}:${TMP_IN_CONTAINER}" "$OUT_FILE" || fail "docker cp 실패"

# 5) 크기 sanity 체크
size_bytes="$(stat -c %s "$OUT_FILE")"
[ "$size_bytes" -ge 1024 ] || fail "백업 파일이 비정상적으로 작습니다 (${size_bytes} bytes)"
log "OK   백업 성공: $OUT_FILE ($(du -h "$OUT_FILE" | cut -f1))"

# 6) 오래된 백업 정리
find "$BACKUP_DIR" -name 'jipyo_*.dump' -type f -mtime +"$KEEP_DAYS" -print -delete \
    | while read -r old; do log "정리 오래된 백업 삭제: $(basename "$old")"; done
