#!/usr/bin/env bash
# Jipyo DB 복구 (Linux) — restore-db.ps1 의 리눅스 판.
#
# ⚠ 대상 DB 의 기존 데이터를 백업 시점으로 덮어쓴다(--clean). 재해 복구 / 서버 이관용.
#   복구 중 잠금 충돌을 피하려고 backend·collector 를 먼저 멈추길 권장한다.
#
# 사용법:
#   docker compose stop backend collector-daemon
#   ./scripts/restore-db.sh ./backups/jipyo_2026-07-06_040000.dump
#   docker compose start backend collector-daemon
#
# 옵션:
#   -y            확인 프롬프트 없이 진행 (스크립트/이관 자동화용)
#   CONTAINER=... DB_USER=... DB_NAME=...  환경변수로 기본값 재정의
set -euo pipefail

CONTAINER="${CONTAINER:-stockapp-postgres}"
DB_USER="${DB_USER:-stockapp}"
DB_NAME="${DB_NAME:-stockapp}"
TMP_IN_CONTAINER=/tmp/jipyo_restore.dump
ASSUME_YES=false

while getopts ':y' opt; do
    case "$opt" in
        y) ASSUME_YES=true ;;
        *) echo "알 수 없는 옵션: -$OPTARG" >&2; exit 2 ;;
    esac
done
shift $((OPTIND - 1))

FILE="${1:-}"
if [ -z "$FILE" ]; then
    echo "사용법: $0 [-y] <백업파일.dump>" >&2
    exit 2
fi
if [ ! -f "$FILE" ]; then
    echo "백업 파일을 찾을 수 없습니다: $FILE" >&2
    exit 1
fi

if [ "$(docker inspect -f '{{.State.Running}}' "$CONTAINER" 2>/dev/null)" != "true" ]; then
    echo "컨테이너 '$CONTAINER' 가 실행 중이 아닙니다. 'docker compose up -d postgres' 로 먼저 띄우세요." >&2
    exit 1
fi

echo "경고: '$DB_NAME' 의 기존 데이터를 이 백업으로 덮어씁니다."
echo "  파일: $FILE ($(du -h "$FILE" | cut -f1))"
echo "  복구 전 'docker compose stop backend collector-daemon' 을 권장합니다."
if [ "$ASSUME_YES" != "true" ]; then
    printf '계속하려면 yes 입력: '
    read -r answer
    [ "$answer" = "yes" ] || { echo '취소됨'; exit 1; }
fi

cleanup() { docker exec "$CONTAINER" rm -f "$TMP_IN_CONTAINER" >/dev/null 2>&1 || true; }
trap cleanup EXIT

docker cp "$FILE" "${CONTAINER}:${TMP_IN_CONTAINER}"

# 복구 전 덤프 유효성 확인 — TOC 를 못 읽으면 전송 중 손상된 파일이다.
# 손상된 덤프로 --clean 을 돌리면 기존 데이터만 날리고 복구는 실패하므로 반드시 먼저 검증한다.
if ! docker exec "$CONTAINER" pg_restore -l "$TMP_IN_CONTAINER" >/dev/null 2>&1; then
    echo "덤프 검증(pg_restore -l) 실패 — 손상된 파일입니다. 전송을 다시 하세요." >&2
    echo "  (원본과 sha256sum 이 같은지 확인할 것)" >&2
    exit 1
fi

# --clean --if-exists: 기존 객체 삭제 후 복구, --no-owner: 소유자 구문 무시
set +e
docker exec "$CONTAINER" pg_restore -U "$DB_USER" -d "$DB_NAME" \
    --clean --if-exists --no-owner "$TMP_IN_CONTAINER"
restore_exit=$?
set -e

if [ "$restore_exit" -ne 0 ]; then
    echo "pg_restore 가 경고/오류와 함께 종료됨 (exit $restore_exit). 위 로그를 확인하세요."
    echo "(존재하지 않는 객체 DROP 경고는 정상일 수 있습니다.)"
else
    echo "복구 완료."
fi
echo "백엔드 재시작: docker compose start backend collector-daemon"
