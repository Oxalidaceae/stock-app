import schedule
import time
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def collect_market_data():
    logger.info("주가 데이터 수집 시작")
    # TODO: 주요 종목 일괄 수집


def collect_dart_disclosures():
    logger.info("DART 공시 수집 시작")
    # TODO: 당일 공시 수집 및 DB 저장


def collect_ecos_indicators():
    logger.info("한국은행 경제지표 수집 시작")
    # TODO: 주요 경제지표 수집 및 DB 저장


# 스케줄 설정
schedule.every(15).minutes.do(collect_market_data)          # 15분마다 주가 갱신
schedule.every().day.at("18:00").do(collect_dart_disclosures)  # 장 마감 후 공시 수집
schedule.every().day.at("09:00").do(collect_ecos_indicators)   # 매일 오전 경제지표 갱신

if __name__ == "__main__":
    logger.info("Collector 시작")
    collect_market_data()
    collect_dart_disclosures()
    collect_ecos_indicators()

    while True:
        schedule.run_pending()
        time.sleep(60)
