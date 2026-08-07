import schedule
import time
import logging
import argparse
import os
from logging.handlers import TimedRotatingFileHandler
from datetime import date

# stdout(도커/Dozzle 실시간 로그) + 회전 파일(호스트 ./logs 마운트로 재빌드해도 보존)
_handlers: list[logging.Handler] = [logging.StreamHandler()]
_log_dir = os.environ.get("LOG_DIR", "/logs")
try:
    os.makedirs(_log_dir, exist_ok=True)
    _handlers.append(TimedRotatingFileHandler(
        os.path.join(_log_dir, "collector.log"),
        when="midnight",     # 매일 자정 회전
        backupCount=30,       # 30일(1달)치 보관 후 자동 삭제
        encoding="utf-8",
    ))
except OSError:
    pass  # 로그 디렉토리 사용 불가(로컬 개발 등) 시 stdout만 사용

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    handlers=_handlers,
)
logger = logging.getLogger(__name__)


def run_initial_setup():
    """최초 실행 시 전체 데이터 적재. DB가 비어 있을 때 한 번만 실행."""
    from dart.dart_pipeline     import sync_corp_codes, sync_disclosures
    from market.market_pipeline import sync_stock_listing, sync_daily_prices
    from ecos.ecos_pipeline     import sync_all_indicators
    from ecos.keystat_pipeline  import sync_macro_keystats
    from rss.briefing_pipeline  import sync_policy_briefings

    logger.info("=== 초기 데이터 적재 시작 ===")

    # 1. DART 기업코드 (corp_code + company_name + ticker)
    sync_corp_codes()

    # 2. KOSPI/KOSDAQ 종목 목록 (sector, industry, market)
    sync_stock_listing()

    # 3. 한국은행 경제지표 10년치 (시계열)
    sync_all_indicators(years_back=10)

    # 4. 한국은행 100대 통계지표 (스냅샷)
    sync_macro_keystats()

    # 5. 최근 7일 공시
    sync_disclosures(days_back=7)

    # 6. 전종목 최신 주가 (직전 영업일)
    sync_daily_prices()

    # 7. 경제 소식 (부처 보도자료 RSS — 재정경제부·금융위)
    sync_policy_briefings()

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
    """매주 일요일 재무제표 배치 동기화 + 재무지표 계산."""
    from dart.dart_pipeline     import sync_financials_batch
    from market.market_pipeline import calculate_financial_metrics
    current_year = date.today().year

    logger.info("=== 주간 재무제표 동기화 시작 ===")
    sync_financials_batch(year=current_year,      report_code="11013")  # 최신 분기
    sync_financials_batch(year=current_year - 1,  report_code="11011")  # 전년 사업보고서
    calculate_financial_metrics()
    logger.info("=== 주간 재무제표 동기화 완료 ===")


def main():
    parser = argparse.ArgumentParser(description="Stock App Data Collector")
    parser.add_argument("--init",      action="store_true", help="초기 데이터 전체 적재")
    parser.add_argument("--daily",     action="store_true", help="일별 갱신 즉시 실행")
    parser.add_argument("--weekly",    action="store_true", help="주간 재무제표 즉시 실행")
    parser.add_argument("--ecos",      action="store_true", help="경제지표만 즉시 실행")
    parser.add_argument("--rss",       action="store_true", help="경제 소식(부처 보도자료 RSS) 즉시 실행")
    parser.add_argument("--backfill",  action="store_true", help="특정 종목 과거 주가 백필")
    parser.add_argument("--ticker",    type=str, help="백필 대상 종목코드 (예: 005930)")
    parser.add_argument("--start",     type=str, default="2020-01-01", help="백필 시작일 (YYYY-MM-DD)")
    parser.add_argument("--end",       type=str, default=str(date.today()), help="백필 종료일")
    parser.add_argument("--daemon",    action="store_true", help="스케줄러 데몬 실행")
    parser.add_argument("--test-alert", action="store_true", help="알림 웹훅 설정 확인 (테스트 메시지 1건 발송)")
    args = parser.parse_args()

    # DB 도 API 키도 필요 없다 — 알림 경로만 확인하므로 가장 먼저 처리한다.
    if args.test_alert:
        from db.sync_status import send_test_alert
        send_test_alert()
        return

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

    if args.rss:
        from rss.briefing_pipeline import sync_policy_briefings
        sync_policy_briefings()
        return

    if args.backfill:
        if not args.ticker:
            logger.error("--ticker 옵션 필요")
            return
        from market.market_pipeline import sync_historical_prices
        sync_historical_prices(args.ticker, args.start, args.end)
        return

    if args.daemon:
        from datetime import datetime
        from dart.dart_pipeline     import sync_disclosures
        from market.market_pipeline import sync_daily_prices, calculate_financial_metrics
        from ecos.ecos_pipeline     import sync_all_indicators
        from ecos.keystat_pipeline  import sync_macro_keystats
        from rss.briefing_pipeline  import sync_policy_briefings

        logger.info(f"스케줄러 데몬 시작 (현재 시각: {datetime.now()})")

        # 매시간, 10분 간격으로 스태거 — 작업이 동시에 몰리지 않게 부하 분산
        schedule.every().hour.at(":00").do(sync_disclosures, days_back=1)      # 공시
        schedule.every().hour.at(":20").do(sync_all_indicators, years_back=1)  # 경제지표 시계열
        schedule.every().hour.at(":30").do(calculate_financial_metrics)        # 재무지표 계산
        schedule.every().hour.at(":40").do(sync_macro_keystats)                # 100대 통계지표
        schedule.every().hour.at(":50").do(sync_policy_briefings)              # 경제 소식 RSS

        # 일별 주가는 KRX 종가(EOD) — 장 마감(15:30) + FDR 15~20분 지연 고려해 하루 1회만
        # (장중 시간당 갱신은 종가 미확정이라 무의미)
        schedule.every().day.at("16:00").do(sync_daily_prices)                 # 일별 주가

        # 재무제표 '원본' 배치는 DART 일일 한도(10,000콜)·소요시간(~30분) 때문에 매시간 불가 → 주 1회 유지
        schedule.every().sunday.at("02:00").do(run_weekly)                     # 재무제표 원본 + 재무지표 재계산

        # 데몬 부팅 직후 한 번 실행해서 DB 비어있어도 즉시 채움
        try:
            sync_macro_keystats()
        except Exception as e:
            logger.warning(f"기동 시 100대 지표 동기화 실패: {e}")
        try:
            sync_policy_briefings()
        except Exception as e:
            logger.warning(f"기동 시 경제 소식 동기화 실패: {e}")

        for job in schedule.get_jobs():
            logger.info(f"  등록: 다음 실행 {job.next_run}  →  {job.job_func.__name__}")

        while True:
            schedule.run_pending()
            time.sleep(60)
        return

    parser.print_help()


if __name__ == "__main__":
    main()
