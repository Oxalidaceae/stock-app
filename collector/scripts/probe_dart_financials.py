"""DART 재무제표 호출 진단.

대형 종목 몇 개에 대해 여러 report_code를 시도해서 어느 조합이 데이터를
반환하는지 확인. --weekly가 전부 실패할 때 원인 파악용.

실행:
    docker-compose run --rm --entrypoint python collector-init scripts/probe_dart_financials.py
"""

import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from db.database import get_session
from dart.dart_collector import get_financial_statements


# 대형주 5개 — 재무제표가 반드시 있어야 하는 종목들
TEST_TICKERS = ["005930", "000660", "005380", "035420", "051910"]

# (year, report_code, 설명)
TEST_REPORTS = [
    ("2025", "11011", "2025년 사업보고서 (3월 제출)"),
    ("2025", "11014", "2025년 3분기"),
    ("2025", "11012", "2025년 반기"),
    ("2025", "11013", "2025년 1분기"),
    ("2026", "11013", "2026년 1분기 (5월 제출)"),
    ("2024", "11011", "2024년 사업보고서"),
]


def main():
    with get_session() as session:
        rows = session.execute(text("""
            SELECT corp_code, ticker, company_name
            FROM companies
            WHERE ticker = ANY(:tickers)
        """), {"tickers": TEST_TICKERS}).fetchall()

    if not rows:
        print("❌ 대형주 corp_code 조회 실패 — companies 테이블 확인 필요")
        return

    for corp_code, ticker, name in rows:
        print(f"\n{'=' * 60}")
        print(f"  [{ticker}] {name}  corp_code={corp_code}")
        print('=' * 60)
        for year, report, label in TEST_REPORTS:
            try:
                items = get_financial_statements(corp_code, year, report)
                status = f"✓ {len(items):>4}건" if items else "✗ 0건"
                print(f"  {status}  {year}/{report}  {label}")
            except Exception as e:
                print(f"  ! 실패  {year}/{report}  {label}  ({e})")


if __name__ == "__main__":
    main()
