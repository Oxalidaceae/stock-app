"""한국은행 ECOS 100대 통계지표 카테고리별 출력.

실행:
    docker compose run --rm --entrypoint python collector-daemon scripts/list_ecos_keystats.py
"""

import sys, os
from collections import defaultdict

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import requests
from config import ECOS_API_KEY, ECOS_BASE_URL


def main():
    if not ECOS_API_KEY:
        print("❌ ECOS_API_KEY 가 비어있습니다 (.env 확인)")
        return

    url = f"{ECOS_BASE_URL}/KeyStatisticList/{ECOS_API_KEY}/json/kr/1/200"
    try:
        res = requests.get(url, timeout=30)
        res.raise_for_status()
    except Exception as e:
        print(f"❌ 요청 실패: {e}")
        return

    try:
        data = res.json()
    except Exception as e:
        print(f"❌ JSON 파싱 실패: {e}")
        print(f"응답 (첫 500자): {res.text[:500]}")
        return

    if "RESULT" in data:
        result = data["RESULT"]
        print(f"❌ ECOS 에러 [{result.get('CODE')}]: {result.get('MESSAGE')}")
        return

    rows = data.get("KeyStatisticList", {}).get("row", [])
    if not rows:
        print(f"❌ 데이터 없음. 응답: {str(data)[:500]}")
        return

    print(f"총 {len(rows)}개\n")

    by_class = defaultdict(list)
    for r in rows:
        cls = r.get("CLASS_NAME", "(분류없음)")
        by_class[cls].append(r)

    for cls, items in by_class.items():
        print(f"{'=' * 60}")
        print(f"  [{cls}]  {len(items)}개")
        print('=' * 60)
        for r in items:
            name = r.get("KEYSTAT_NAME") or ""
            val = r.get("DATA_VALUE") or "-"
            unit = r.get("UNIT_NAME") or ""
            cycle = r.get("CYCLE") or ""
            print(f"  {name:<40} {val:>15} {unit:<8} [{cycle}]")
        print()


if __name__ == "__main__":
    main()
