import FinanceDataReader as fdr
import pandas as pd
from datetime import datetime, timedelta
import redis
import json
import logging
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import REDIS_HOST, REDIS_PORT, REDIS_PASSWORD

logger = logging.getLogger(__name__)

try:
    r = redis.Redis(
        host=REDIS_HOST, port=REDIS_PORT, password=REDIS_PASSWORD,
        decode_responses=True, socket_timeout=5, retry_on_timeout=True,
    )
    r.ping()
except redis.ConnectionError:
    logger.warning("Redis 연결 실패 — 캐시 없이 진행합니다")
    r = None


def fetch_stock_price(ticker: str) -> dict:
    try:
        end = datetime.today()
        start = end - timedelta(days=365)
        df = fdr.DataReader(ticker, start.strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d"))
        if df.empty:
            logger.debug(f"{ticker}: 데이터 없음")
            return {}
        latest = df.iloc[-1]
        return {
            "ticker": ticker,
            "close": float(latest["Close"]),
            "open": float(latest["Open"]),
            "high": float(latest["High"]),
            "low": float(latest["Low"]),
            "volume": int(latest["Volume"]),
            "date": df.index[-1].strftime("%Y-%m-%d"),
            "updated_at": datetime.now().isoformat(),
        }
    except Exception as e:
        logger.error(f"{ticker} 주가 조회 실패: {e}")
        return {}


def cache_stock_price(ticker: str):
    data = fetch_stock_price(ticker)
    if data and r:
        try:
            r.setex(f"stock:price:{ticker}", 900, json.dumps(data))  # 15분 캐시
        except redis.RedisError as e:
            logger.warning(f"Redis 캐시 실패 ({ticker}): {e}")
    return data


def fetch_kospi_stocks() -> pd.DataFrame:
    try:
        return fdr.StockListing("KOSPI")
    except Exception as e:
        logger.error(f"KOSPI 종목 목록 조회 실패: {e}")
        return pd.DataFrame()


def fetch_kosdaq_stocks() -> pd.DataFrame:
    try:
        return fdr.StockListing("KOSDAQ")
    except Exception as e:
        logger.error(f"KOSDAQ 종목 목록 조회 실패: {e}")
        return pd.DataFrame()
