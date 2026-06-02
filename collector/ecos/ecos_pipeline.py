import logging
import time
from datetime import date

from sqlalchemy.dialects.postgresql import insert as pg_insert

import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.database import get_session
from db.models import EconomicIndicator
from ecos.ecos_collector import get_stat_data

logger = logging.getLogger(__name__)

# ECOS 수집 대상 지표 정의
INDICATORS = [
    {
        "stat_code":   "722Y001",
        "stat_name":   "한국은행 기준금리",
        "item_code":   "0101000",
        "period_type": "M",
        "unit":        "%",
    },
    {
        "stat_code":   "200Y108",
        "stat_name":   "실질 GDP (계절조정, 분기)",
        "item_code":   "10601",
        "period_type": "Q",
        "unit":        "십억원",
    },
    {
        "stat_code":   "901Y009",
        "stat_name":   "소비자물가지수(CPI)",
        "item_code":   "0",
        "period_type": "M",
        "unit":        "지수",
    },
    {
        "stat_code":   "731Y006",
        "stat_name":   "원/달러 환율 (종가 15:30)",
        "item_code":   "0000003",
        "period_type": "M",
        "unit":        "원",
    },
    {
        "stat_code":   "161Y005",
        "stat_name":   "통화량 M2 (평잔, 계절조정)",
        "item_code":   "BBHS00",
        "period_type": "M",
        "unit":        "십억원",
    },
    {
        "stat_code":   "301Y017",
        "stat_name":   "경상수지 (계절조정)",
        "item_code":   "SA000",
        "period_type": "M",
        "unit":        "백만달러",
    },
]


def sync_indicator(indicator: dict, start_period: str, end_period: str):
    rows = get_stat_data(
        stat_code   = indicator["stat_code"],
        item_code   = indicator["item_code"],
        start_period= start_period,
        end_period  = end_period,
        period_type = indicator["period_type"],
    )

    if not rows:
        logger.warning(f"데이터 없음: {indicator['stat_name']}")
        return

    records = []
    seen_periods = set()
    for row in rows:
        period = row.get("TIME", "")
        # ECOS가 가끔 같은 (stat_code, item_code, period) 키에 여러 row를 반환함
        # (예: 환율 731Y006/0000003에서 매월 2건). UNIQUE 제약 충돌 방지를 위해
        # 같은 period의 첫 row만 사용.
        if period in seen_periods:
            continue
        seen_periods.add(period)

        raw_value = row.get("DATA_VALUE", "").strip()
        try:
            value = float(raw_value) if raw_value else None
        except ValueError:
            value = None

        records.append({
            "stat_code":   indicator["stat_code"],
            "stat_name":   indicator["stat_name"],
            "item_code":   indicator["item_code"],
            "item_name":   row.get("ITEM_NAME1", indicator["stat_name"]),
            "period":      period,
            "period_type": indicator["period_type"],
            "value":       value,
            "unit":        indicator["unit"],
        })

    with get_session() as session:
        stmt = pg_insert(EconomicIndicator).values(records)
        stmt = stmt.on_conflict_do_update(
            index_elements=["stat_code", "item_code", "period"],
            set_={"value": stmt.excluded.value},
        )
        session.execute(stmt)

    logger.info(f"  {indicator['stat_name']}: {len(records)}건 저장")


def sync_all_indicators(years_back: int = 10):
    """전체 경제지표 동기화. years_back: 몇 년치 히스토리를 가져올지."""
    current_year = date.today().year
    start_year   = current_year - years_back

    logger.info(f"경제지표 동기화 시작 ({start_year} ~ {current_year})")

    for indicator in INDICATORS:
        period_type = indicator["period_type"]
        if period_type == "A":
            start = str(start_year)
            end   = str(current_year)
        elif period_type == "Q":
            start = f"{start_year}Q1"
            end   = f"{current_year}Q4"
        else:  # M, D
            start = f"{start_year}01"
            end   = f"{current_year}12"

        try:
            sync_indicator(indicator, start, end)
            time.sleep(1)  # API 호출 간격 유지
        except Exception as e:
            logger.error(f"지표 동기화 실패 [{indicator['stat_name']}]: {e}")

    logger.info("경제지표 동기화 완료")
