"""sync_status 테이블 업데이트 헬퍼.

각 파이프라인이 실행될 때마다 job_name 키로 upsert하여
대시보드의 "마지막 갱신: N분 전" 표시 + 운영 모니터링에 활용.

실패가 연속되면 웹훅으로 알림도 보낸다 — 로그에만 남기면 아무도 안 본다는 것을
정책브리핑 RSS 폐지 건(36일간 무인지)으로 확인했다.
"""

import json
import logging
import time
import urllib.error
import urllib.request
from contextlib import contextmanager
from datetime import datetime
from typing import Optional

from sqlalchemy import text

import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.database import get_session
from config import (
    COLLECTOR_ALERT_WEBHOOK,
    COLLECTOR_ALERT_THRESHOLD,
    COLLECTOR_ALERT_CHAT_ID,
)

logger = logging.getLogger(__name__)

# 이 상태로 기록되면 연속 실패 카운터가 올라간다.
_FAILURE_STATUSES = {"failed", "partial"}


def record_sync(
    job_name: str,
    status: str = "success",
    records: Optional[int] = None,
    duration_ms: Optional[int] = None,
    message: Optional[str] = None,
) -> None:
    """sync_status 테이블에 upsert. 호출 실패는 무시 (모니터링이 본 파이프라인을 막으면 안 됨).

    실패/부분실패면 consecutive_failures 를 올리고, 성공이면 0으로 되돌린다.
    임계치에 도달한 순간과 복구된 순간에만 알림을 보낸다.
    """
    prev_status: Optional[str] = None
    prev_failures = 0
    failures = 0

    try:
        with get_session() as session:
            row = session.execute(text(
                "SELECT status, consecutive_failures FROM sync_status WHERE job_name = :job"
            ), {"job": job_name}).first()
            if row:
                prev_status, prev_failures = row[0], (row[1] or 0)

            failures = prev_failures + 1 if status in _FAILURE_STATUSES else 0

            session.execute(text("""
                INSERT INTO sync_status
                    (job_name, last_run_at, status, records, duration_ms, message, consecutive_failures)
                VALUES (:job, :ts, :status, :records, :duration, :message, :failures)
                ON CONFLICT (job_name) DO UPDATE SET
                    last_run_at          = EXCLUDED.last_run_at,
                    status               = EXCLUDED.status,
                    records              = EXCLUDED.records,
                    duration_ms          = EXCLUDED.duration_ms,
                    message              = EXCLUDED.message,
                    consecutive_failures = EXCLUDED.consecutive_failures
            """), {
                "job": job_name,
                "ts": datetime.now(),
                "status": status,
                "records": records,
                "duration": duration_ms,
                "message": message,
                "failures": failures,
            })
    except Exception as e:
        logger.warning(f"sync_status 기록 실패 [{job_name}]: {e}")
        return

    _maybe_alert(job_name, status, prev_status, prev_failures, failures, records, message)


def _maybe_alert(
    job_name: str,
    status: str,
    prev_status: Optional[str],
    prev_failures: int,
    failures: int,
    records: Optional[int],
    message: Optional[str],
) -> None:
    """임계치 도달 시점과 복구 시점에만 웹훅을 보낸다.

    매 실행마다 보내면 시간당 한 번씩 울려 결국 알림을 꺼 버리게 된다. 그래서
    `failures == 임계치` 인 딱 한 번만 보내고, 그 뒤로는 조용히 카운트만 올린다.
    복구 알림도 실제로 경보가 나갔던 경우에만 보낸다 — 한 번 튀었다 돌아온
    건에 "복구됐습니다" 를 보내면 그것도 소음이다.
    """
    if not COLLECTOR_ALERT_WEBHOOK:
        return

    if failures == COLLECTOR_ALERT_THRESHOLD:
        content = (f"🔴 수집 실패 [{job_name}] — {failures}회 연속 ({status})\n"
                   f"records={records} · {message or '사유 미기록'}")
    elif failures == 0 and prev_status in _FAILURE_STATUSES and prev_failures >= COLLECTOR_ALERT_THRESHOLD:
        content = f"✅ 수집 복구 [{job_name}] — records={records}"
    else:
        return

    _post_webhook(content)


def _service_name(url: str) -> str:
    """웹훅 URL 로 대상 서비스를 판별. 본문 형식과 로그 표기에 함께 쓴다."""
    if "api.telegram.org" in url:
        return "telegram"
    if "discord" in url:
        return "discord"
    return "slack"


def _build_payload(url: str, content: str) -> Optional[dict]:
    """서비스별 요청 본문. 설정이 모자라면 None 을 돌려준다.

    셋이 본문 키를 다 다르게 쓴다:
      - 텔레그램: {"chat_id": ..., "text": ...}  ← 받는 방을 지정해야 한다
      - Discord:  {"content": ...}
      - Slack:    {"text": ...}
    """
    service = _service_name(url)
    if service == "telegram":
        if not COLLECTOR_ALERT_CHAT_ID:
            logger.error("COLLECTOR_ALERT_CHAT_ID 미설정 — 텔레그램은 봇 토큰 외에 "
                         "수신 대화방 ID 가 필요합니다 (.env.example 참고)")
            return None
        return {"chat_id": COLLECTOR_ALERT_CHAT_ID, "text": content}
    if service == "discord":
        return {"content": content}
    return {"text": content}


def _post_webhook(content: str) -> None:
    """텔레그램/Discord/Slack 웹훅 전송. 실패해도 파이프라인은 계속 간다."""
    payload = _build_payload(COLLECTOR_ALERT_WEBHOOK, content)
    if payload is None:
        return

    request = urllib.request.Request(
        COLLECTOR_ALERT_WEBHOOK,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            response.read()
    except urllib.error.HTTPError as e:
        # 응답 본문을 같이 남긴다 — 텔레그램은 "chat not found" 처럼 원인을
        # 적어 주므로, 이게 없으면 설정 실수를 상태 코드만 보고 추측해야 한다.
        try:
            body = e.read().decode("utf-8", "replace")[:300]
        except Exception:
            body = ""
        logger.warning(f"알림 웹훅 전송 실패 (HTTP {e.code}) [{_service_name(COLLECTOR_ALERT_WEBHOOK)}]: {body}")
    except Exception as e:
        logger.warning(f"알림 웹훅 전송 실패: {e}")


def send_test_alert() -> None:
    """알림 설정 점검용 — 실제 실패가 3회 쌓이기를 기다리지 않고 경로를 확인한다.

    `python main.py --test-alert` 로 실행.
    """
    if not COLLECTOR_ALERT_WEBHOOK:
        logger.error("COLLECTOR_ALERT_WEBHOOK 미설정 — 알림을 보낼 곳이 없습니다")
        return

    service = _service_name(COLLECTOR_ALERT_WEBHOOK)
    logger.info(f"테스트 알림 발송 → {service}")
    _post_webhook("🔔 Jipyo 컬렉터 알림 테스트 — 이 메시지가 보이면 설정이 끝난 것입니다.")
    logger.info("발송 시도 완료 — 메시지가 오지 않았다면 위 경고 로그를 확인하세요")


@contextmanager
def track_sync(job_name: str):
    """Context manager — 자동으로 실행 시간/성공·실패를 기록.

    사용:
        with track_sync("daily_prices") as ctx:
            ctx["records"] = len(records)
            ...
    """
    start = time.monotonic()
    ctx: dict = {"records": None, "message": None}
    try:
        yield ctx
    except Exception as e:
        duration_ms = int((time.monotonic() - start) * 1000)
        record_sync(
            job_name,
            status="failed",
            records=ctx.get("records"),
            duration_ms=duration_ms,
            message=str(e)[:500],
        )
        raise
    else:
        duration_ms = int((time.monotonic() - start) * 1000)
        record_sync(
            job_name,
            status="success",
            records=ctx.get("records"),
            duration_ms=duration_ms,
            message=ctx.get("message"),
        )
