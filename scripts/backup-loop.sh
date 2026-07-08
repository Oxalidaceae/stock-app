#!/bin/sh
# Jipyo DB 자동 백업 루프 — docker-compose 의 backup 서비스가 실행한다.
# 매일 BACKUP_HOUR 시(컨테이너 TZ 기준)에 pg_dump 로 압축 백업하고 오래된 파일을 정리한다.
# postgres:16-alpine 이미지의 pg_dump/pg_restore + busybox 도구만 사용하므로 별도 의존성 없음.
set -eu

BACKUP_HOUR="$(( 10#${BACKUP_HOUR:-4} ))"   # 10# = 08 같은 값의 8진수 오해 방지
KEEP_DAYS="${KEEP_DAYS:-14}"
export PGHOST="${PGHOST:-postgres}"
export PGUSER="${PGUSER:-stockapp}"
export PGDATABASE="${PGDATABASE:-stockapp}"
# PGPASSWORD 는 compose 환경변수로 주입 (네트워크 접속이라 비밀번호 필요)

DIR=/backups
mkdir -p "$DIR"

log() { echo "$(date '+%F %T')  $1" | tee -a "$DIR/backup.log"; }

do_backup() {
    ts=$(date +%Y-%m-%d_%H%M%S)
    out="$DIR/jipyo_${ts}.dump"
    if pg_dump -Fc -f "$out" 2>>"$DIR/backup.log"; then
        log "OK   $out ($(du -h "$out" | cut -f1))"
        # KEEP_DAYS 초과분 정리
        find "$DIR" -name 'jipyo_*.dump' -type f -mtime +"$KEEP_DAYS" -delete
    else
        log "FAIL pg_dump 실패 (DB 접속·비밀번호 확인)"
        rm -f "$out"
    fi
}

target=$(printf '%02d' "$BACKUP_HOUR")
log "backup service 시작 — 매일 ${target}:00 (TZ=$(date '+%Z')), 보관 ${KEEP_DAYS}일"

# 시작 시 1회 백업 옵션 (기본 off)
if [ "${RUN_ON_START:-false}" = "true" ]; then
    do_backup
fi

# 하루 한 번, 지정 시각대에만 실행 (분 단위 폴링, last 로 중복 방지)
last=""
while true; do
    today=$(date +%Y-%m-%d)
    hour=$(date +%H)
    if [ "$hour" = "$target" ] && [ "$today" != "$last" ]; then
        do_backup
        last="$today"
    fi
    sleep 60
done
