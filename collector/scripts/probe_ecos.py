"""ECOS 통계 코드 진단 도구.

깨진 4개 지표(GDP 성장률·원달러 환율·M2·무역수지)의 현재 유효한
stat_code / item_code 조합을 ECOS API에 직접 질의해서 찾는다.

실행:
    docker-compose run --rm collector-init python scripts/probe_ecos.py
"""

import sys, os
import requests

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import ECOS_API_KEY, ECOS_BASE_URL


KEYWORDS = {
    "GDP 성장률":      ["국내총생산", "GDP", "경제성장률"],
    "원/달러 환율":     ["원화의 대미달러", "원달러", "환율"],
    "M2 통화량":       ["M2", "광의통화", "통화"],
    "무역수지":        ["무역수지", "경상수지", "수출"],
}


def list_tables(keyword: str) -> list[dict]:
    """StatisticTableList 호출. 키워드가 STAT_NAME에 포함되는 것만 반환."""
    url = f"{ECOS_BASE_URL}/StatisticTableList/{ECOS_API_KEY}/json/kr/1/2000"
    res = requests.get(url, timeout=30)
    res.raise_for_status()
    data = res.json()
    rows = data.get("StatisticTableList", {}).get("row", [])
    return [r for r in rows if keyword in r.get("STAT_NAME", "")]


def list_items(stat_code: str) -> list[dict]:
    """StatisticItemList 호출. 통계표 내 항목 전체 반환."""
    url = f"{ECOS_BASE_URL}/StatisticItemList/{ECOS_API_KEY}/json/kr/1/500/{stat_code}"
    res = requests.get(url, timeout=30)
    res.raise_for_status()
    data = res.json()
    return data.get("StatisticItemList", {}).get("row", [])


def main():
    if not ECOS_API_KEY:
        print("❌ ECOS_API_KEY 가 .env에 없습니다.")
        return

    for label, keywords in KEYWORDS.items():
        print(f"\n{'=' * 60}")
        print(f"  [{label}]")
        print('=' * 60)
        found_tables = []
        for kw in keywords:
            try:
                tables = list_tables(kw)
            except Exception as e:
                print(f"  검색 실패 ({kw}): {e}")
                continue
            for t in tables:
                key = t.get("STAT_CODE")
                if key in [x.get("STAT_CODE") for x in found_tables]:
                    continue
                found_tables.append(t)

        if not found_tables:
            print("  → 매칭되는 통계표 없음")
            continue

        # 상위 5개 통계표만 표시 (너무 많이 안 나오게)
        for t in found_tables[:5]:
            code   = t.get("STAT_CODE")
            name   = t.get("STAT_NAME")
            cycle  = t.get("CYCLE")
            print(f"\n  STAT_CODE={code}  CYCLE={cycle}  {name}")

            try:
                items = list_items(code)
            except Exception as e:
                print(f"    항목 조회 실패: {e}")
                continue

            # 항목 30개까지 출력 (중복 제거)
            seen = set()
            unique_items = []
            for it in items:
                icode = it.get("ITEM_CODE1") or it.get("ITEM_CODE")
                if icode in seen:
                    continue
                seen.add(icode)
                unique_items.append(it)

            for it in unique_items[:30]:
                icode = it.get("ITEM_CODE1") or it.get("ITEM_CODE")
                iname = it.get("ITEM_NAME1") or it.get("ITEM_NAME")
                print(f"    ITEM_CODE={icode!s:<20}  {iname}")
            if len(unique_items) > 30:
                print(f"    ... (총 {len(unique_items)}개 unique 항목)")


def list_key_statistics():
    """한국은행 100대 통계지표 — GDP 성장률 등 주요 지표가 stat_code와 함께 나옴."""
    url = f"{ECOS_BASE_URL}/KeyStatisticList/{ECOS_API_KEY}/json/kr/1/100"
    res = requests.get(url, timeout=30)
    res.raise_for_status()
    data = res.json()
    rows = data.get("KeyStatisticList", {}).get("row", [])

    print(f"\n{'=' * 60}")
    print("  [100대 통계지표]")
    print('=' * 60)

    keywords_of_interest = ["성장률", "GDP", "환율", "통화", "무역", "수지"]
    for r in rows:
        name = r.get("KEYSTAT_NAME", "")
        if not any(kw in name for kw in keywords_of_interest):
            continue
        cls = r.get("CLASS_NAME", "")
        val = r.get("DATA_VALUE", "")
        unit = r.get("UNIT_NAME", "")
        cycle = r.get("CYCLE", "")
        print(f"  [{cls}] {name}  CYCLE={cycle}")
        print(f"    값: {val} {unit}")


def test_combo(stat_code: str, item_code: str, period_type: str, label: str = ""):
    """특정 stat_code/item_code 조합 실제 호출 + 데이터 있는지 확인."""
    if period_type == "Q":
        start = end = "2024Q1"
    elif period_type == "D":
        start = end = "20240115"
    else:
        start = end = "202401"

    url = f"{ECOS_BASE_URL}/StatisticSearch/{ECOS_API_KEY}/json/kr/1/3/{stat_code}/{period_type}/{start}/{end}/{item_code}"
    try:
        res = requests.get(url, timeout=15)
        data = res.json()
    except Exception as e:
        print(f"  ✗ {stat_code}/{item_code} [{period_type}]  요청 실패: {e}  {label}")
        return

    if "StatisticSearch" in data:
        rows = data["StatisticSearch"].get("row", [])
        if rows:
            r = rows[0]
            print(f"  ✓ {stat_code}/{item_code} [{period_type}]  값={r.get('DATA_VALUE')} ({r.get('TIME')}) {label}")
            return
    msg = data.get("RESULT", {}).get("MESSAGE") or "데이터 없음"
    print(f"  ✗ {stat_code}/{item_code} [{period_type}]  {msg}  {label}")


def test_combo_range(stat_code: str, item_code: str, period_type: str, start: str, end: str, label: str = ""):
    """ecos_pipeline과 동일한 범위/페이지 크기로 호출 시뮬레이션."""
    url = f"{ECOS_BASE_URL}/StatisticSearch/{ECOS_API_KEY}/json/kr/1/1000/{stat_code}/{period_type}/{start}/{end}/{item_code}"
    try:
        res = requests.get(url, timeout=30)
        data = res.json()
    except Exception as e:
        print(f"  ✗ {stat_code}/{item_code} {start}~{end} 요청 실패: {e}")
        return

    if "StatisticSearch" in data:
        total = data["StatisticSearch"].get("list_total_count", 0)
        rows = data["StatisticSearch"].get("row", [])
        if rows:
            print(f"  ✓ {stat_code}/{item_code} {start}~{end}  total={total}, returned={len(rows)}  {label}")
            print(f"    첫: {rows[0].get('TIME')}={rows[0].get('DATA_VALUE')}, 끝: {rows[-1].get('TIME')}={rows[-1].get('DATA_VALUE')}")
            return
    msg = data.get("RESULT", {}).get("MESSAGE") or "응답 형태 불명"
    print(f"  ✗ {stat_code}/{item_code} {start}~{end}  {msg}  {label}")


def test_fx_candidates():
    """원/달러 환율 후보 ITEM_CODE 일괄 테스트 (단일 시점)."""
    print(f"\n{'=' * 60}")
    print("  [환율 후보 단일 시점 테스트]")
    print('=' * 60)
    candidates = [
        ("731Y006", "0000003", "M", "원/달러 종가 15:30 (월)"),
        ("731Y006", "0000100", "M", "원/달러 평균자료 (월)"),
        ("731Y006", "0000200", "M", "원/달러 말일자료 (월)"),
        ("731Y006", "0000002", "M", "원/달러 시가 (월)"),
        ("731Y003", "0000003", "D", "원/달러 종가 15:30 (일)"),
        ("036Y001", "0000001", "M", "원/달러 매매기준율 (구 코드)"),
    ]
    for combo in candidates:
        test_combo(*combo)

    print(f"\n{'=' * 60}")
    print("  [환율 범위 호출 — pipeline과 동일 패턴]")
    print('=' * 60)
    print("기준금리 (정상 작동 검증용):")
    test_combo_range("722Y001", "0101000", "M", "201601", "202612", "기준금리")
    print("\n환율 — 시작 시점별:")
    test_combo_range("731Y006", "0000003", "M", "201601", "202612", "10년 전체")
    test_combo_range("731Y006", "0000003", "M", "202001", "202612", "2020~")
    test_combo_range("731Y006", "0000003", "M", "202301", "202612", "2023~")


if __name__ == "__main__":
    main()
    try:
        list_key_statistics()
    except Exception as e:
        print(f"\n100대 통계지표 조회 실패: {e}")
    try:
        test_fx_candidates()
    except Exception as e:
        print(f"\n환율 후보 테스트 실패: {e}")
