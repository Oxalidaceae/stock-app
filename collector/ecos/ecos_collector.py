import requests
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import ECOS_API_KEY, ECOS_BASE_URL

# 주요 경제지표 통계표 코드
STAT_CODES = {
    "base_rate": "722Y001",       # 한국은행 기준금리
    "gdp_growth": "111Y002",      # GDP 성장률
    "cpi": "901Y009",             # 소비자물가지수
    "exchange_rate": "731Y001",   # 원/달러 환율
    "m2": "101Y002",              # 통화량(M2)
    "trade_balance": "403Y001",   # 무역수지
}


def get_stat_data(stat_code: str, item_code: str, start_period: str, end_period: str, period_type: str = "M") -> list:
    url = f"{ECOS_BASE_URL}/StatisticSearch/{ECOS_API_KEY}/json/kr/1/100/{stat_code}/{period_type}/{start_period}/{end_period}/{item_code}"
    res = requests.get(url)
    data = res.json()
    rows = data.get("StatisticSearch", {}).get("row", [])
    return rows


def get_base_rate(start_period: str = "202001", end_period: str = "202512") -> list:
    return get_stat_data(STAT_CODES["base_rate"], "0101000", start_period, end_period, "M")


def get_gdp_growth(start_period: str = "2020", end_period: str = "2025") -> list:
    return get_stat_data(STAT_CODES["gdp_growth"], "10101", start_period, end_period, "A")


def get_cpi(start_period: str = "202001", end_period: str = "202512") -> list:
    return get_stat_data(STAT_CODES["cpi"], "0", start_period, end_period, "M")


def get_exchange_rate(start_period: str = "202001", end_period: str = "202512") -> list:
    return get_stat_data(STAT_CODES["exchange_rate"], "0000001", start_period, end_period, "M")
