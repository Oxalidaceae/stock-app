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

            # 항목 5개까지 출력
            for it in items[:5]:
                icode = it.get("ITEM_CODE1") or it.get("ITEM_CODE")
                iname = it.get("ITEM_NAME1") or it.get("ITEM_NAME")
                print(f"    ITEM_CODE={icode!s:<20}  {iname}")
            if len(items) > 5:
                print(f"    ... (총 {len(items)}개 항목)")


if __name__ == "__main__":
    main()
