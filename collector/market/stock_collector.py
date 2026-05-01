import FinanceDataReader as fdr
import pandas as pd
from datetime import datetime, timedelta
import redis
import json
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import REDIS_HOST, REDIS_PORT, REDIS_PASSWORD

r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, password=REDIS_PASSWORD, decode_responses=True)


def fetch_stock_price(ticker: str) -> dict:
    end = datetime.today()
    start = end - timedelta(days=365)
    df = fdr.DataReader(ticker, start.strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d"))
    if df.empty:
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


def cache_stock_price(ticker: str):
    data = fetch_stock_price(ticker)
    if data:
        r.setex(f"stock:price:{ticker}", 900, json.dumps(data))  # 15분 캐시
    return data


def fetch_kospi_stocks() -> pd.DataFrame:
    return fdr.StockListing("KOSPI")


def fetch_kosdaq_stocks() -> pd.DataFrame:
    return fdr.StockListing("KOSDAQ")
