import requests
import time
import logging
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import ECOS_API_KEY, ECOS_BASE_URL

logger = logging.getLogger(__name__)

# ECOS API 에러 코드 정의
ECOS_ERROR_CODES = {
    "INFO-000": "정상",
    "ERROR-101": "인증키 오류",
    "ERROR-200": "필수 인자 누락",
    "ERROR-300": "데이터 없음",
    "ERROR-500": "서비스 이용 제한 초과",
    "ERROR-600": "서비스 일시 중지",
    "ERROR-700": "시스템 에러",
}

RETRYABLE_CODES = {"ERROR-500", "ERROR-600", "ERROR-700"}

MAX_RETRIES = 3
RETRY_DELAY = 3  # 초
REQUEST_INTERVAL = 0.5  # 호출 간격 (초)

# 마지막 호출 시간 추적
_last_call_time = 0.0

# 주요 경제지표 통계표 코드
STAT_CODES = {
    "base_rate": "722Y001",       # 한국은행 기준금리
    "gdp_growth": "111Y002",      # GDP 성장률
    "cpi": "901Y009",             # 소비자물가지수
    "exchange_rate": "731Y001",   # 원/달러 환율
    "m2": "101Y002",              # 통화량(M2)
    "trade_balance": "403Y001",   # 무역수지
}


def _throttle():
    """호출 간격 조절"""
    global _last_call_time
    elapsed = time.time() - _last_call_time
    if elapsed < REQUEST_INTERVAL:
        time.sleep(REQUEST_INTERVAL - elapsed)
    _last_call_time = time.time()


def get_stat_data(stat_code: str, item_code: str, start_period: str, end_period: str, period_type: str = "M") -> list:
    url = f"{ECOS_BASE_URL}/StatisticSearch/{ECOS_API_KEY}/json/kr/1/100/{stat_code}/{period_type}/{start_period}/{end_period}/{item_code}"

    for attempt in range(1, MAX_RETRIES + 1):
        _throttle()
        try:
            res = requests.get(url, timeout=30)
            res.raise_for_status()

            data = res.json()

            # ECOS는 에러 시 RESULT 키 사용
            if "RESULT" in data:
                code = data["RESULT"].get("CODE", "")
                message = data["RESULT"].get("MESSAGE", ECOS_ERROR_CODES.get(code, "알 수 없는 에러"))

                if code == "INFO-000":
                    pass  # 정상
                elif code == "ERROR-300":
                    logger.debug(f"ECOS 데이터 없음: {stat_code} ({start_period}~{end_period})")
                    return []
                elif code in RETRYABLE_CODES and attempt < MAX_RETRIES:
                    wait = RETRY_DELAY * attempt
                    logger.warning(f"ECOS API 에러 [{code}]: {message} — {wait}초 후 재시도 ({attempt}/{MAX_RETRIES})")
                    time.sleep(wait)
                    continue
                else:
                    logger.error(f"ECOS API 에러 [{code}]: {message}")
                    return []

            rows = data.get("StatisticSearch", {}).get("row", [])
            return rows

        except requests.exceptions.Timeout:
            if attempt < MAX_RETRIES:
                logger.warning(f"ECOS API 타임아웃 — 재시도 ({attempt}/{MAX_RETRIES})")
                time.sleep(RETRY_DELAY)
                continue
            logger.error("ECOS API 타임아웃 — 최대 재시도 초과")
            return []
        except requests.exceptions.ConnectionError:
            if attempt < MAX_RETRIES:
                logger.warning(f"ECOS API 연결 실패 — 재시도 ({attempt}/{MAX_RETRIES})")
                time.sleep(RETRY_DELAY)
                continue
            logger.error("ECOS API 연결 실패 — 최대 재시도 초과")
            return []
        except requests.exceptions.HTTPError as e:
            logger.error(f"ECOS HTTP 에러: {e}")
            return []

    return []


def get_base_rate(start_period: str = "202001", end_period: str = "202512") -> list:
    return get_stat_data(STAT_CODES["base_rate"], "0101000", start_period, end_period, "M")


def get_gdp_growth(start_period: str = "2020", end_period: str = "2025") -> list:
    return get_stat_data(STAT_CODES["gdp_growth"], "10101", start_period, end_period, "A")


def get_cpi(start_period: str = "202001", end_period: str = "202512") -> list:
    return get_stat_data(STAT_CODES["cpi"], "0", start_period, end_period, "M")


def get_exchange_rate(start_period: str = "202001", end_period: str = "202512") -> list:
    return get_stat_data(STAT_CODES["exchange_rate"], "0000001", start_period, end_period, "M")
