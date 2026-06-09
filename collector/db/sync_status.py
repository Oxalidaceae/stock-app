"""sync_status 테이블 업데이트 헬퍼.

각 파이프라인이 실행될 때마다 job_name 키로 upsert하여
대시보드의 "마지막 갱신: N분 전" 표시 + 운영 모니터링에 활용.
"""

import logging
import time
from contextlib import contextmanager
from datetime import datetime
from typing import Optional

from sqlalchemy import text

import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.database import get_session

logger = logging.getLogger(__name__)


def record_sync(
    job_name: str,
    status: str = "success",
    records: Optional[int] = None,
    duration_ms: Optional[int] = None,
    message: Optional[str] = None,
) -> None:
    """sync_status 테이블에 upsert. 호출 실패는 무시 (모니터링이 본 파이프라인을 막으면 안 됨)."""
    try:
        with get_session() as session:
            session.execute(text("""
                INSERT INTO sync_status (job_name, last_run_at, status, records, duration_ms, message)
                VALUES (:job, :ts, :status, :records, :duration, :message)
                ON CONFLICT (job_name) DO UPDATE SET
                    last_run_at = EXCLUDED.last_run_at,
                    status      = EXCLUDED.status,
                    records     = EXCLUDED.records,
                    duration_ms = EXCLUDED.duration_ms,
                    message     = EXCLUDED.message
            """), {
                "job": job_name,
                "ts": datetime.now(),
                "status": status,
                "records": records,
                "duration": duration_ms,
                "message": message,
            })
    except Exception as e:
        logger.warning(f"sync_status 기록 실패 [{job_name}]: {e}")


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
