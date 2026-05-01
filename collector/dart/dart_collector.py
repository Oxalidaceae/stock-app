import requests
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import DART_API_KEY, DART_BASE_URL


def get_disclosure_list(corp_code: str = None, start_date: str = None, end_date: str = None) -> list:
    params = {
        "crtfc_key": DART_API_KEY,
        "bgn_de": start_date,
        "end_de": end_date,
        "page_count": 100,
    }
    if corp_code:
        params["corp_code"] = corp_code

    res = requests.get(f"{DART_BASE_URL}/list.json", params=params)
    data = res.json()
    return data.get("list", [])


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
    res = requests.get(f"{DART_BASE_URL}/fnlttSinglAcntAll.json", params=params)
    data = res.json()
    return data.get("list", [])


def get_company_info(corp_code: str) -> dict:
    params = {"crtfc_key": DART_API_KEY, "corp_code": corp_code}
    res = requests.get(f"{DART_BASE_URL}/company.json", params=params)
    return res.json()


def get_corp_code_list() -> bytes:
    """전체 기업코드 ZIP 파일 다운로드 (DART 기업코드 - 종목코드 매핑용)"""
    params = {"crtfc_key": DART_API_KEY}
    res = requests.get(f"{DART_BASE_URL}/corpCode.xml", params=params)
    return res.content
