import logging
from datetime import date

import FinanceDataReader as fdr
import pandas as pd
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy import text

import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.database import get_session
from db.models import Company, StockPrice, FinancialMetric, FinancialStatement

logger = logging.getLogger(__name__)


# ── 종목 목록 동기화 ──────────────────────────────────────────

def sync_stock_listing():
    """KOSPI/KOSDAQ 전체 종목 목록을 가져와 companies 테이블의 market/sector 업데이트."""
    logger.info("종목 목록 동기화 시작")
    for market in ("KOSPI", "KOSDAQ"):
        try:
            df = fdr.StockListing(market)
            _upsert_listing(df, market)
            logger.info(f"  {market}: {len(df)}건")
        except Exception as e:
            logger.error(f"{market} 목록 조회 실패: {e}")
    logger.info("종목 목록 동기화 완료")


def _upsert_listing(df: pd.DataFrame, market: str):
    col_map = {
        "Symbol":      "ticker",
        "Code":        "ticker",
        "Name":        "company_name",
        "Sector":      "sector",
        "Industry":    "industry",
        "ListingDate": "listing_date",
    }
    df = df.rename(columns={k: v for k, v in col_map.items() if k in df.columns})

    records = []
    for _, row in df.iterrows():
        ticker = str(row.get("ticker", "")).strip()
        if not ticker:
            continue
        records.append({
            "ticker":       ticker,
            "company_name": str(row.get("company_name", ticker)),
            "market":       market,
            "sector":       row.get("sector") if pd.notna(row.get("sector")) else None,
            "industry":     row.get("industry") if pd.notna(row.get("industry")) else None,
            "corp_code":    ticker,  # ticker를 임시 corp_code로 — DART sync 후 덮어씀
        })

    with get_session() as session:
        for batch in _batches(records, 500):
            stmt = pg_insert(Company).values(batch)
            stmt = stmt.on_conflict_do_update(
                index_elements=["ticker"],
                set_={
                    "market":   stmt.excluded.market,
                    "sector":   stmt.excluded.sector,
                    "industry": stmt.excluded.industry,
                },
            )
            session.execute(stmt)


# ── 주가 동기화 ───────────────────────────────────────────────

def sync_daily_prices(target_date: date | None = None):
    """종목 목록 조회로 당일 전 종목 주가를 한 번에 수집."""
    if target_date is None:
        target_date = date.today()

    logger.info(f"일별 주가 동기화: {target_date}")

    ticker_to_id = _get_ticker_to_id_map()
    records = []

    for market in ("KOSPI", "KOSDAQ"):
        try:
            df = fdr.StockListing(market)
            df = df.rename(columns={"Symbol": "ticker", "Code": "ticker"})
            ticker_col = "ticker" if "ticker" in df.columns else df.columns[0]

            for _, row in df.iterrows():
                ticker = str(row.get(ticker_col, "")).strip()
                company_id = ticker_to_id.get(ticker)
                if not company_id:
                    continue

                close = _safe_int(row.get("Close") or row.get("Adj Close"))
                if not close:
                    continue

                records.append({
                    "company_id":  company_id,
                    "trade_date":  target_date,
                    "open_price":  _safe_int(row.get("Open")),
                    "high_price":  _safe_int(row.get("High")),
                    "low_price":   _safe_int(row.get("Low")),
                    "close_price": close,
                    "volume":      _safe_int(row.get("Volume")),
                    "market_cap":  _safe_int(row.get("Marcap")),
                })
        except Exception as e:
            logger.error(f"{market} 주가 수집 실패: {e}")

    if not records:
        logger.warning("수집된 주가 데이터 없음")
        return

    with get_session() as session:
        for batch in _batches(records, 500):
            stmt = pg_insert(StockPrice).values(batch)
            stmt = stmt.on_conflict_do_update(
                index_elements=["company_id", "trade_date"],
                set_={
                    "open_price":  stmt.excluded.open_price,
                    "high_price":  stmt.excluded.high_price,
                    "low_price":   stmt.excluded.low_price,
                    "close_price": stmt.excluded.close_price,
                    "volume":      stmt.excluded.volume,
                    "market_cap":  stmt.excluded.market_cap,
                },
            )
            session.execute(stmt)

    logger.info(f"일별 주가 동기화 완료: {len(records)}건")


def sync_historical_prices(ticker: str, start_date: str, end_date: str):
    """단일 종목 과거 주가 수집 (백필용)."""
    company_id = _get_ticker_to_id_map().get(ticker)
    if not company_id:
        logger.warning(f"종목 미존재: {ticker}")
        return

    df = fdr.DataReader(ticker, start_date, end_date)
    if df.empty:
        return

    records = []
    for trade_date, row in df.iterrows():
        close = _safe_int(row.get("Close"))
        if not close:
            continue
        records.append({
            "company_id":  company_id,
            "trade_date":  trade_date.date(),
            "open_price":  _safe_int(row.get("Open")),
            "high_price":  _safe_int(row.get("High")),
            "low_price":   _safe_int(row.get("Low")),
            "close_price": close,
            "volume":      _safe_int(row.get("Volume")),
        })

    if not records:
        return

    with get_session() as session:
        stmt = pg_insert(StockPrice).values(records)
        stmt = stmt.on_conflict_do_update(
            index_elements=["company_id", "trade_date"],
            set_={
                "open_price":  stmt.excluded.open_price,
                "high_price":  stmt.excluded.high_price,
                "low_price":   stmt.excluded.low_price,
                "close_price": stmt.excluded.close_price,
                "volume":      stmt.excluded.volume,
            },
        )
        session.execute(stmt)

    logger.info(f"{ticker} 과거 주가 {len(records)}건 저장")


# ── 재무지표 계산 ─────────────────────────────────────────────

# DART IFRS 계정과목 ID 매핑
_ACCOUNT_MAP = {
    "revenue":          ["ifrs-full_Revenue", "dart_Revenue", "ifrs_Revenue"],
    "operating_income": ["dart_OperatingIncomeLoss", "ifrs-full_ProfitLossFromOperatingActivities"],
    "net_income":       ["ifrs-full_ProfitLoss", "ifrs-full_ProfitLossAttributableToOwnersOfParent"],
    "total_assets":     ["ifrs-full_Assets"],
    "total_equity":     ["ifrs-full_Equity", "ifrs-full_EquityAttributableToOwnersOfParent"],
    "eps":              ["ifrs-full_BasicEarningsLossPerShare"],
    "bps":              ["ifrs-full_BookValuePerShare", "dart_BookValuePerShare"],
}


def calculate_financial_metrics():
    """financial_statements + stock_prices 를 조합해 financial_metrics 계산 및 저장."""
    logger.info("재무지표 계산 시작")
    today = date.today()

    with get_session() as session:
        # 재무제표가 있는 기업 목록
        rows = session.execute(text("""
            SELECT DISTINCT fs.company_id, fs.fiscal_year, fs.report_code
            FROM financial_statements fs
            JOIN companies c ON c.id = fs.company_id
            WHERE fs.fs_div = 'CFS'
            ORDER BY fs.company_id, fs.fiscal_year DESC, fs.report_code
        """)).fetchall()

    processed = set()
    records = []

    for company_id, fiscal_year, report_code in rows:
        if company_id in processed:
            continue
        processed.add(company_id)

        try:
            stmt_data = _get_statement_data(company_id, fiscal_year, report_code)
            close_price = _get_latest_close(company_id)

            if not stmt_data or not close_price:
                continue

            metric = _compute_metrics(stmt_data, close_price)
            metric.update({
                "company_id":  company_id,
                "base_date":   today,
                "fiscal_year": fiscal_year,
                "report_code": report_code,
            })
            records.append(metric)
        except Exception as e:
            logger.warning(f"메트릭 계산 실패 company_id={company_id}: {e}")

    if not records:
        logger.info("계산할 지표 없음")
        return

    with get_session() as session:
        stmt = pg_insert(FinancialMetric).values(records)
        stmt = stmt.on_conflict_do_update(
            index_elements=["company_id", "base_date"],
            set_={k: stmt.excluded[k] for k in records[0] if k not in ("company_id", "base_date")},
        )
        session.execute(stmt)

    logger.info(f"재무지표 계산 완료: {len(records)}개사")


def _get_statement_data(company_id: int, fiscal_year: int, report_code: str) -> dict:
    with get_session() as session:
        rows = session.execute(text("""
            SELECT account_id, account_name, current_amount
            FROM financial_statements
            WHERE company_id = :cid AND fiscal_year = :year
              AND report_code = :rc AND fs_div = 'CFS'
        """), {"cid": company_id, "year": fiscal_year, "rc": report_code}).fetchall()

    result = {}
    for account_id, account_name, amount in rows:
        for key, ids in _ACCOUNT_MAP.items():
            if account_id in ids:
                result[key] = amount
                break
        # account_id 매핑 실패 시 account_name으로 fallback
        if "revenue" not in result and "매출액" in (account_name or ""):
            result["revenue"] = amount
        if "operating_income" not in result and "영업이익" in (account_name or ""):
            result["operating_income"] = amount
        if "net_income" not in result and account_name in ("당기순이익", "당기순이익(손실)"):
            result["net_income"] = amount
        if "total_assets" not in result and account_name == "자산총계":
            result["total_assets"] = amount
        if "total_equity" not in result and account_name == "자본총계":
            result["total_equity"] = amount

    return result


def _get_latest_close(company_id: int) -> int | None:
    with get_session() as session:
        row = session.execute(text("""
            SELECT close_price FROM stock_prices
            WHERE company_id = :cid
            ORDER BY trade_date DESC LIMIT 1
        """), {"cid": company_id}).fetchone()
    return row[0] if row else None


def _compute_metrics(data: dict, close_price: int) -> dict:
    def safe_div(a, b):
        try:
            return round(a / b, 2) if a is not None and b else None
        except (TypeError, ZeroDivisionError):
            return None

    def pct(a, b):
        """a * 100 / b 의 None 안전 버전 (퍼센트 지표 계산용)."""
        if a is None or not b:
            return None
        try:
            return round(a * 100 / b, 2)
        except (TypeError, ZeroDivisionError):
            return None

    revenue          = data.get("revenue")
    operating_income = data.get("operating_income")
    net_income       = data.get("net_income")
    total_assets     = data.get("total_assets")
    total_equity     = data.get("total_equity")
    eps              = data.get("eps")
    bps              = data.get("bps")

    total_debt = (total_assets - total_equity) if total_assets and total_equity else None

    return {
        "per":              safe_div(close_price, eps),
        "pbr":              safe_div(close_price, bps),
        "psr":              safe_div(close_price * 1000, revenue) if revenue else None,
        "roe":              pct(net_income, total_equity),
        "roa":              pct(net_income, total_assets),
        "operating_margin": pct(operating_income, revenue),
        "net_margin":       pct(net_income, revenue),
        "debt_ratio":       pct(total_debt, total_equity),
        "eps":              eps,
        "bps":              bps,
        "revenue":          revenue,
        "operating_income": operating_income,
        "net_income":       net_income,
        "total_assets":     total_assets,
        "total_equity":     total_equity,
    }


# ── 유틸 ──────────────────────────────────────────────────────

def _get_ticker_to_id_map() -> dict:
    with get_session() as session:
        rows = session.execute(text(
            "SELECT ticker, id FROM companies WHERE ticker IS NOT NULL"
        )).fetchall()
    return {ticker: id_ for ticker, id_ in rows}


def _safe_int(val) -> int | None:
    try:
        f = float(val)
        return int(f) if f == f else None  # NaN 체크
    except (TypeError, ValueError):
        return None


def _batches(lst: list, size: int):
    for i in range(0, len(lst), size):
        yield lst[i:i + size]
