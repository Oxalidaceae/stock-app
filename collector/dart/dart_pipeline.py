import zipfile
import io
import time
import logging
import xml.etree.ElementTree as ET
from datetime import date, timedelta

from sqlalchemy import text
from sqlalchemy.dialects.postgresql import insert as pg_insert

import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.database import get_session
from db.models import Company, Disclosure, FinancialStatement
from db.sync_status import record_sync
from dart.dart_collector import (
    get_corp_code_list, get_disclosure_list,
    get_financial_statements,
)

logger = logging.getLogger(__name__)

DART_VIEWER_URL = "https://dart.fss.or.kr/dsaf001/main.do"


# ── 기업 코드 동기화 ──────────────────────────────────────────

def sync_corp_codes():
    """DART 전체 기업코드 ZIP을 받아 companies 테이블에 upsert."""
    logger.info("기업코드 동기화 시작")
    content = get_corp_code_list()
    records = _parse_corp_code_zip(content)

    with get_session() as session:
        for batch in _batches(records, 500):
            stmt = pg_insert(Company).values(batch)
            stmt = stmt.on_conflict_do_update(
                index_elements=["corp_code"],
                set_={
                    "company_name": stmt.excluded.company_name,
                    "ticker":       stmt.excluded.ticker,
                },
            )
            session.execute(stmt)

    logger.info(f"기업코드 동기화 완료: {len(records)}건")


def _parse_corp_code_zip(content: bytes) -> list[dict]:
    with zipfile.ZipFile(io.BytesIO(content)) as z:
        with z.open("CORPCODE.xml") as f:
            root = ET.parse(f).getroot()

    result = []
    for item in root.findall("list"):
        ticker = item.findtext("stock_code", "").strip() or None
        result.append({
            "corp_code":    item.findtext("corp_code", "").strip(),
            "company_name": item.findtext("corp_name", "").strip(),
            "ticker":       ticker,
        })
    return [r for r in result if r["corp_code"]]


# ── 공시 동기화 ───────────────────────────────────────────────

def sync_disclosures(days_back: int = 1):
    """최근 N일간 전체 공시를 가져와 disclosures 테이블에 upsert."""
    end_date   = date.today()
    start_date = end_date - timedelta(days=days_back)
    start_str  = start_date.strftime("%Y%m%d")
    end_str    = end_date.strftime("%Y%m%d")

    logger.info(f"공시 동기화: {start_str} ~ {end_str}")
    items = get_disclosure_list(start_date=start_str, end_date=end_str)

    ticker_to_id = _get_ticker_to_id_map()
    records = []
    for item in items:
        corp_code = item.get("corp_code", "")
        records.append({
            "company_id":      ticker_to_id.get(corp_code),
            "rcept_no":        item.get("rcept_no", ""),
            "report_name":     item.get("report_nm", ""),
            "disclosure_type": _classify_disclosure(item.get("report_nm", "")),
            "rcept_date":      _parse_date(item.get("rcept_dt")),
            "submitter":       item.get("flr_nm"),
            "dart_url":        f"{DART_VIEWER_URL}?rcpNo={item.get('rcept_no')}",
        })

    if not records:
        logger.info("신규 공시 없음")
        return

    with get_session() as session:
        stmt = pg_insert(Disclosure).values(records)
        stmt = stmt.on_conflict_do_update(
            index_elements=["rcept_no"],
            set_={"report_name": stmt.excluded.report_name},
        )
        session.execute(stmt)

    logger.info(f"공시 동기화 완료: {len(records)}건")
    _trim_disclosures_to_recent_dates(keep_dates=5)
    record_sync("disclosures", records=len(records))


def _trim_disclosures_to_recent_dates(keep_dates: int = 5):
    """가장 최근 N개의 distinct 날짜만 남기고 나머지는 삭제. 영업일 기준 자동 정합."""
    with get_session() as session:
        result = session.execute(text("""
            DELETE FROM disclosures
            WHERE rcept_date < (
                SELECT MIN(d) FROM (
                    SELECT DISTINCT rcept_date AS d FROM disclosures
                    ORDER BY rcept_date DESC LIMIT :keep
                ) sub
            )
        """), {"keep": keep_dates})
        if result.rowcount:
            logger.info(f"오래된 공시 {result.rowcount}건 정리 (최근 {keep_dates}일 유지)")


# ── 재무제표 동기화 ───────────────────────────────────────────

def sync_financial_statements_for(corp_code: str, year: int, report_code: str = "11011"):
    """단일 기업의 재무제표를 가져와 financial_statements 테이블에 upsert."""
    items = get_financial_statements(corp_code, str(year), report_code)
    if not items:
        return

    company_id = _get_company_id(corp_code)
    if not company_id:
        logger.warning(f"기업 미존재: {corp_code}")
        return

    records = []
    seen_keys = set()
    for item in items:
        # DART 응답에 fs_div가 누락되는 경우가 있어 요청 시 값(CFS)으로 보정
        fs_div = item.get("fs_div") or "CFS"
        account_id = item.get("account_id", "")
        # ON CONFLICT 충돌 방지 — DART가 같은 (fs_div, account_id)에
        # 여러 row를 반환하는 경우(sj_div만 다르고 계정ID 동일 등) 첫 row만 사용.
        key = (fs_div, account_id)
        if key in seen_keys:
            continue
        seen_keys.add(key)

        try:
            records.append({
                "company_id":       company_id,
                "fiscal_year":      year,
                "report_code":      report_code,
                "fs_div":           fs_div,
                "account_id":       account_id,
                "account_name":     item.get("account_nm", ""),
                "current_amount":   _parse_amount(item.get("thstrm_amount")),
                "previous_amount":  _parse_amount(item.get("frmtrm_amount")),
                "currency":         item.get("currency", "KRW"),
            })
        except Exception as e:
            logger.warning(f"재무제표 파싱 실패 {corp_code} {item}: {e}")

    if not records:
        return

    with get_session() as session:
        stmt = pg_insert(FinancialStatement).values(records)
        stmt = stmt.on_conflict_do_update(
            index_elements=["company_id", "fiscal_year", "report_code", "fs_div", "account_id"],
            set_={
                "current_amount":  stmt.excluded.current_amount,
                "previous_amount": stmt.excluded.previous_amount,
            },
        )
        session.execute(stmt)


def sync_financials_batch(year: int, report_code: str = "11011", delay_sec: float = 0.3):
    """상장사 전체 재무제표 배치 동기화."""
    with get_session() as session:
        rows = session.execute(
            session.query(Company.corp_code)
            .filter(Company.ticker.isnot(None), Company.is_active.is_(True))
            .statement
        ).fetchall()

    logger.info(f"재무제표 배치 동기화: {year}년 {report_code} / {len(rows)}개사")
    for i, (corp_code,) in enumerate(rows):
        try:
            sync_financial_statements_for(corp_code, year, report_code)
            time.sleep(delay_sec)
        except Exception as e:
            logger.warning(f"재무제표 실패 {corp_code}: {e}")
        if (i + 1) % 50 == 0:
            logger.info(f"  진행중: {i + 1}/{len(rows)}")

    logger.info("재무제표 배치 동기화 완료")


# ── 유틸 ──────────────────────────────────────────────────────

def _get_ticker_to_id_map() -> dict:
    with get_session() as session:
        rows = session.execute(
            session.query(Company.corp_code, Company.id).statement
        ).fetchall()
    return {corp_code: id_ for corp_code, id_ in rows}


def _get_company_id(corp_code: str) -> int | None:
    with get_session() as session:
        row = session.execute(
            session.query(Company.id).filter_by(corp_code=corp_code).statement
        ).fetchone()
    return row[0] if row else None


def _classify_disclosure(report_name: str) -> str:
    if any(k in report_name for k in ["사업보고서", "반기보고서", "분기보고서"]):
        return "정기공시"
    if any(k in report_name for k in ["증자", "감자", "합병", "분할", "취득", "처분"]):
        return "주요사항보고"
    if any(k in report_name for k in ["감사보고서", "검토보고서"]):
        return "외부감사"
    return "기타"


def _parse_date(s: str | None) -> date | None:
    if not s or len(s) < 8:
        return None
    try:
        return date(int(s[:4]), int(s[4:6]), int(s[6:8]))
    except ValueError:
        return None


def _parse_amount(s: str | None) -> int | None:
    if not s:
        return None
    try:
        return int(s.replace(",", "").strip())
    except ValueError:
        return None


def _batches(lst: list, size: int):
    for i in range(0, len(lst), size):
        yield lst[i:i + size]
