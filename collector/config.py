import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

DART_API_KEY = os.getenv("DART_API_KEY")
ECOS_API_KEY = os.getenv("ECOS_API_KEY")

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "stockapp")
DB_USER = os.getenv("DB_USERNAME", "stockapp")
DB_PASSWORD = os.getenv("DB_PASSWORD", "stockapp")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)

DART_BASE_URL = "https://opendart.fss.or.kr/api"
ECOS_BASE_URL = "https://ecos.bok.or.kr/api"

# 정책브리핑(korea.kr) 부처별 RSS — "경제 소식" 수집.
# 공공누리 제1유형(출처표시) — 제목·요약·원문링크·부처명만 저장.
POLICY_BRIEFING_FEEDS = [
    {"ministry": "기획재정부", "source": "정책브리핑", "url": "https://www.korea.kr/rss/dept_moef.xml"},
    {"ministry": "금융위원회", "source": "정책브리핑", "url": "https://www.korea.kr/rss/dept_fsc.xml"},
    {"ministry": "관세청",     "source": "정책브리핑", "url": "https://www.korea.kr/rss/dept_customs.xml"},
]
