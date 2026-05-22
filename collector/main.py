import schedule
import time
import logging
import argparse
from datetime import date

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger(__name__)


def run_initial_setup():
    """최초 실행 시 전체 데이터 적재. DB가 비어 있을 때 한 번만 실행."""
    from dart.dart_pipeline     import sync_corp_codes, sync_disclosures
    from market.market_pipeline import sync_stock_listing, sync_daily_prices
    from ecos.ecos_pipeline     import sync_all_indicators

    logger.info("=== 초기 데이터 적재 시작 ===")

    # 1. DART 기업코드 (corp_code + company_name + ticker)
    sync_corp_codes()

    # 2. KOSPI/KOSDAQ 종목 목록 (sector, industry, market)
    sync_stock_listing()

    # 3. 한국은행 경제지표 10년치
    sync_all_indicators(years_back=10)

    # 4. 최근 7일 공시
    sync_disclosures(days_back=7)

    # 5. 전종목 최신 주가 (직전 영업일)
    sync_daily_prices()

    logger.info("=== 초기 데이터 적재 완료 ===")
    logger.info("재무제표: 'python main.py --weekly' 로 별도 실행")
    logger.info("과거 주가 백필: 'python main.py --backfill --ticker 005930 --start 2020-01-01'")


def run_daily():
    """매일 장 마감 후 실행."""
    from dart.dart_pipeline     import sync_disclosures
    from market.market_pipeline import sync_daily_prices, calculate_financial_metrics
    from ecos.ecos_pipeline     import sync_all_indicators

    logger.info("=== 일별 데이터 갱신 시작 ===")
    sync_daily_prices()
    sync_disclosures(days_back=1)
    sync_all_indicators(years_back=1)
    calculate_financial_metrics()
    logger.info("=== 일별 데이터 갱신 완료 ===")


def run_weekly():
    """매주 일요일 재무제표 배치 동기화."""
    from dart.dart_pipeline import sync_financials_batch
    current_year = date.today().year

    logger.info("=== 주간 재무제표 동기화 시작 ===")
    sync_financials_batch(year=current_year,      report_code="11013")  # 최신 분기
    sync_financials_batch(year=current_year - 1,  report_code="11011")  # 전년 사업보고서
    logger.info("=== 주간 재무제표 동기화 완료 ===")


def main():
    parser = argparse.ArgumentParser(description="Stock App Data Collector")
    parser.add_argument("--init",      action="store_true", help="초기 데이터 전체 적재")
    parser.add_argument("--daily",     action="store_true", help="일별 갱신 즉시 실행")
    parser.add_argument("--weekly",    action="store_true", help="주간 재무제표 즉시 실행")
    parser.add_argument("--ecos",      action="store_true", help="경제지표만 즉시 실행")
    parser.add_argument("--backfill",  action="store_true", help="특정 종목 과거 주가 백필")
    parser.add_argument("--ticker",    type=str, help="백필 대상 종목코드 (예: 005930)")
    parser.add_argument("--start",     type=str, default="2020-01-01", help="백필 시작일 (YYYY-MM-DD)")
    parser.add_argument("--end",       type=str, default=str(date.today()), help="백필 종료일")
    parser.add_argument("--daemon",    action="store_true", help="스케줄러 데몬 실행")
    args = parser.parse_args()

    if args.init:
        run_initial_setup()
        return

    if args.daily:
        run_daily()
        return

    if args.weekly:
        run_weekly()
        return

    if args.ecos:
        from ecos.ecos_pipeline import sync_all_indicators
        sync_all_indicators()
        return

    if args.backfill:
        if not args.ticker:
            logger.error("--ticker 옵션 필요")
            return
        from market.market_pipeline import sync_historical_prices
        sync_historical_prices(args.ticker, args.start, args.end)
        return

    if args.daemon:
        logger.info("스케줄러 데몬 시작")
        schedule.every().day.at("16:30").do(run_daily)       # 장 마감 후
        schedule.every().sunday.at("02:00").do(run_weekly)   # 주말 새벽

        while True:
            schedule.run_pending()
            time.sleep(60)
        return

    parser.print_help()


if __name__ == "__main__":
    main()
