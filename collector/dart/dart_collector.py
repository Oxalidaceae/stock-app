import requests
import time
import logging
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import DART_API_KEY, DART_BASE_URL

logger = logging.getLogger(__name__)

# DART API 에러 코드 정의 — OpenDART 개발가이드의 "메시지 설명" 표 기준.
#
# 예전 표는 013 과 021 의 뜻이 뒤바뀌어 있었다. 그래서 "조회된 데이타가 없습니다"(013)
# 를 치명적 오류로 보고 예외를 던졌고, 공시가 한 건도 없는 일요일·연휴에는 매시간
# 공시 수집이 예외로 끝나 스케줄러 데몬까지 같이 죽었다.
DART_ERROR_CODES = {
    "000": "정상",
    "010": "등록되지 않은 키입니다",
    "011": "사용할 수 없는 키입니다 (일시 사용 중지)",
    "012": "접근할 수 없는 IP입니다",
    "013": "조회된 데이타가 없습니다",
    "014": "파일이 존재하지 않습니다",
    "020": "요청 제한 초과",
    "021": "조회 가능한 회사 개수 초과 (최대 100건)",
    "100": "필드의 부적절한 값입니다",
    "101": "부적절한 접근입니다",
    "800": "시스템 점검으로 서비스 중지 중",
    "900": "정의되지 않은 오류",
    "901": "개인정보 보유기간 만료로 사용할 수 없는 키입니다",
}

# 재시도 가능한 에러 코드
RETRYABLE_CODES = {"020", "800", "900"}

MAX_RETRIES = 3
RETRY_DELAY = 5  # 초


class DartApiError(Exception):
    """DART API 에러"""
    def __init__(self, status: str, message: str):
        self.status = status
        self.message = message
        super().__init__(f"DART API 에러 [{status}]: {message}")


def _dart_request(url: str, params: dict, retries: int = MAX_RETRIES) -> dict:
    """DART API 공통 요청 함수 — 에러 핸들링 + 재시도 + 호출 간격"""
    for attempt in range(1, retries + 1):
        try:
            res = requests.get(url, params=params, timeout=30)
            res.raise_for_status()  # HTTP 4xx/5xx 체크

            data = res.json()
            status = data.get("status", "000")
            message = data.get("message", DART_ERROR_CODES.get(status, "알 수 없는 에러"))

            if status == "000":
                return data

            if status == "013":
                # 데이터 없음은 정상 케이스 — 빈 결과 반환
                # (주말·연휴의 공시 검색, 아직 제출되지 않은 보고서의 재무제표 조회 등)
                logger.debug(f"DART 조회 결과 없음: {url}")
                return data

            if status in RETRYABLE_CODES and attempt < retries:
                wait = RETRY_DELAY * attempt
                logger.warning(f"DART API 재시도 가능 에러 [{status}]: {message} — {wait}초 후 재시도 ({attempt}/{retries})")
                time.sleep(wait)
                continue

            # 인증 오류 등 치명적 에러
            logger.error(f"DART API 에러 [{status}]: {message}")
            raise DartApiError(status, message)

        except requests.exceptions.Timeout:
            if attempt < retries:
                logger.warning(f"DART API 타임아웃 — 재시도 ({attempt}/{retries})")
                time.sleep(RETRY_DELAY)
                continue
            raise
        except requests.exceptions.ConnectionError:
            if attempt < retries:
                logger.warning(f"DART API 연결 실패 — 재시도 ({attempt}/{retries})")
                time.sleep(RETRY_DELAY)
                continue
            raise

    return {}


def get_disclosure_list(corp_code: str = None, start_date: str = None, end_date: str = None) -> list:
    """기간 내 공시 전체 수집. DART API는 호출당 100건이라 page_no를 반복 호출해 모두 가져옴."""
    base_params = {
        "crtfc_key": DART_API_KEY,
        "bgn_de": start_date,
        "end_de": end_date,
        "page_count": 100,
    }
    if corp_code:
        base_params["corp_code"] = corp_code

    all_items = []
    page_no = 1
    max_pages = 100  # 안전장치: 최대 10,000건

    while page_no <= max_pages:
        params = {**base_params, "page_no": page_no}
        data = _dart_request(f"{DART_BASE_URL}/list.json", params)

        items = data.get("list", [])
        if not items:
            break

        all_items.extend(items)

        total_page = int(data.get("total_page", 1))
        if page_no >= total_page:
            break

        page_no += 1
        time.sleep(0.1)  # 호출 간격

    if page_no >= max_pages:
        logger.warning(f"공시 페이지네이션 최대 한도({max_pages}) 도달 — 일부 누락 가능")

    return all_items


def get_financial_statements(corp_code: str, year: str, report_code: str = "11011") -> list:
    """
    report_code: 11011=사업보고서, 11012=반기보고서, 11013=1분기, 11014=3분기
    """
    params = {
        "crtfc_key": DART_API_KEY,
        "corp_code": corp_code,
        "bsns_year": year,
        "reprt_code": report_code,
        "fs_div": "CFS",  # 연결재무제표
    }
    data = _dart_request(f"{DART_BASE_URL}/fnlttSinglAcntAll.json", params)
    return data.get("list", [])


def get_corp_code_list() -> bytes:
    """전체 기업코드 ZIP 파일 다운로드 (DART 기업코드 - 종목코드 매핑용)"""
    params = {"crtfc_key": DART_API_KEY}
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            res = requests.get(f"{DART_BASE_URL}/corpCode.xml", params=params, timeout=60)
            res.raise_for_status()
            if len(res.content) < 1000:
                # ZIP이 아니라 에러 JSON일 수 있음
                try:
                    err = res.json()
                    status = err.get("status", "")
                    logger.error(f"기업코드 ZIP 다운로드 에러 [{status}]: {err.get('message')}")
                    if status in RETRYABLE_CODES and attempt < MAX_RETRIES:
                        time.sleep(RETRY_DELAY * attempt)
                        continue
                except Exception:
                    pass
            return res.content
        except requests.exceptions.RequestException as e:
            if attempt < MAX_RETRIES:
                logger.warning(f"기업코드 ZIP 다운로드 실패 — 재시도 ({attempt}/{MAX_RETRIES}): {e}")
                time.sleep(RETRY_DELAY)
                continue
            raise
    return b""
