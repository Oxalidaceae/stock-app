"""한국은행 100대 통계지표(KeyStatisticList) 동기화.

ECOS 의 KeyStatisticList 엔드포인트는 시계열이 아닌 현재 스냅샷만 반환.
매시간 호출하여 macro_keystats 테이블에 upsert.
"""

import logging
from datetime import datetime

import requests
from sqlalchemy import text
from sqlalchemy.dialects.postgresql import insert as pg_insert

import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.database import get_session
from db.models import MacroKeystat, MacroKeystatHistory
from db.sync_status import record_sync
from config import ECOS_API_KEY, ECOS_BASE_URL

logger = logging.getLogger(__name__)


def sync_macro_keystats():
    """ECOS 100대 통계지표를 받아 macro_keystats 에 upsert."""
    if not ECOS_API_KEY:
        logger.warning("ECOS_API_KEY 가 비어있음 — 100대 지표 동기화 건너뜀")
        return

    url = f"{ECOS_BASE_URL}/KeyStatisticList/{ECOS_API_KEY}/json/kr/1/200"

    try:
        res = requests.get(url, timeout=30)
        res.raise_for_status()
        data = res.json()
    except Exception as e:
        logger.error(f"ECOS KeyStatisticList 호출 실패: {e}")
        return

    if "RESULT" in data:
        result = data["RESULT"]
        code = result.get("CODE", "")
        if code != "INFO-000":
            logger.error(f"ECOS 에러 [{code}]: {result.get('MESSAGE')}")
            return

    rows = data.get("KeyStatisticList", {}).get("row", [])
    if not rows:
        logger.warning("100대 통계지표 응답이 비어있음")
        return

    now = datetime.now()
    records = []
    for i, r in enumerate(rows):
        records.append({
            "class_name":   r.get("CLASS_NAME") or "(기타)",
            "keystat_name": (r.get("KEYSTAT_NAME") or "")[:100],
            "value":        (r.get("DATA_VALUE") or "")[:50] or None,
            "unit":         (r.get("UNIT_NAME") or "")[:20] or None,
            "cycle":        (r.get("CYCLE") or "")[:20] or None,
            "sort_order":   i,
            "updated_at":   now,
        })

    with get_session() as session:
        stmt = pg_insert(MacroKeystat).values(records)
        stmt = stmt.on_conflict_do_update(
            index_elements=["class_name", "keystat_name"],
            set_={
                "value":      stmt.excluded.value,
                "unit":       stmt.excluded.unit,
                "cycle":      stmt.excluded.cycle,
                "sort_order": stmt.excluded.sort_order,
                "updated_at": stmt.excluded.updated_at,
            },
        )
        session.execute(stmt)

    logger.info(f"100대 통계지표 동기화 완료: {len(records)}건")
    record_sync("macro_keystats", records=len(records))

    _record_history(records, now)


def _record_history(records: list[dict], now: datetime):
    """cycle(데이터 시점)이 바뀐 지표만 macro_keystat_history 에 새 행 추가."""
    with get_session() as session:
        rows = session.execute(text("""
            SELECT DISTINCT ON (class_name, keystat_name) class_name, keystat_name, cycle
            FROM macro_keystat_history
            ORDER BY class_name, keystat_name, recorded_at DESC
        """)).fetchall()
    latest_cycle = {(r[0], r[1]): r[2] for r in rows}

    history_records = []
    for r in records:
        key = (r["class_name"], r["keystat_name"])
        if r["cycle"] and latest_cycle.get(key) != r["cycle"]:
            history_records.append({
                "class_name":   r["class_name"],
                "keystat_name": r["keystat_name"],
                "value":        r["value"],
                "unit":         r["unit"],
                "cycle":        r["cycle"],
                "recorded_at":  now,
            })

    if not history_records:
        logger.info("100대 통계지표 히스토리: 신규 시점 없음")
        return

    with get_session() as session:
        session.execute(pg_insert(MacroKeystatHistory).values(history_records))

    logger.info(f"100대 통계지표 히스토리 적재: {len(history_records)}건 (신규 시점)")
