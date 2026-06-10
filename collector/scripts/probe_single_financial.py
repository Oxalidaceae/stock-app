"""단일 회사로 sync_financial_statements_for 직접 호출.

--weekly가 0건 적재하는 이유를 진단. 삼성전자 2025년 사업보고서 호출 시
정확히 어디서 실패하는지 추적.

실행:
    docker-compose run --rm --entrypoint python collector-init scripts/probe_single_financial.py
"""

import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import logging
import traceback

# DEBUG 로그까지 출력
logging.basicConfig(level=logging.DEBUG, format='%(levelname)s [%(name)s] %(message)s')

from sqlalchemy import text
from db.database import get_session
from dart.dart_pipeline import sync_financial_statements_for
from dart.dart_collector import get_financial_statements

CORP_CODE = "00126380"  # 삼성전자
YEAR = 2025
REPORT = "11011"


def main():
    print(f"\n{'=' * 60}")
    print(f"  삼성전자 {YEAR}/{REPORT} 단독 호출 진단")
    print('=' * 60)

    # 1. 회사 존재 확인
    with get_session() as session:
        row = session.execute(text(
            "SELECT id, ticker, company_name, is_active FROM companies WHERE corp_code = :c"
        ), {"c": CORP_CODE}).fetchone()
        if not row:
            print(f"❌ companies 테이블에 corp_code={CORP_CODE} 없음")
            return
        print(f"\n[1] DB 확인: id={row[0]}, ticker={row[1]}, name={row[2]}, is_active={row[3]}")

    # 2. DART API 직접 호출 결과
    print(f"\n[2] DART API 직접 호출")
    items = get_financial_statements(CORP_CODE, str(YEAR), REPORT)
    print(f"   받은 row 수: {len(items)}")
    if items:
        first = items[0]
        print(f"   첫 row: fs_div={first.get('fs_div')}, sj_div={first.get('sj_div')}, "
              f"account_id={first.get('account_id')}, account_nm={first.get('account_nm')}")

    # 3. 호출 전 financial_statements 카운트
    with get_session() as session:
        before = session.execute(text(
            "SELECT COUNT(*) FROM financial_statements WHERE company_id = (SELECT id FROM companies WHERE corp_code = :c)"
        ), {"c": CORP_CODE}).scalar()
    print(f"\n[3] 호출 전 financial_statements: {before}건")

    # 4. sync_financial_statements_for 직접 호출
    print(f"\n[4] sync_financial_statements_for 호출")
    try:
        sync_financial_statements_for(CORP_CODE, YEAR, REPORT)
        print("   → 정상 종료")
    except Exception as e:
        print(f"   → 예외: {type(e).__name__}: {e}")
        traceback.print_exc()

    # 5. 호출 후 카운트
    with get_session() as session:
        after = session.execute(text(
            "SELECT COUNT(*) FROM financial_statements WHERE company_id = (SELECT id FROM companies WHERE corp_code = :c)"
        ), {"c": CORP_CODE}).scalar()
    print(f"\n[5] 호출 후 financial_statements: {after}건")
    print(f"   증가: {after - before}건")


if __name__ == "__main__":
    main()
