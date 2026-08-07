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

DART_BASE_URL = "https://opendart.fss.or.kr/api"
ECOS_BASE_URL = "https://ecos.bok.or.kr/api"

# 부처 보도자료 RSS — "경제 소식" 수집.
#
# 원래는 정책브리핑(korea.kr)의 부처별 RSS(dept_moef/dept_fsc/dept_customs.xml)를
# 썼으나, 2026-07-01 자로 RSS 제공이 중단되어(사유: "콘텐츠 저작권 등 권리 보호에
# 따른 제공방식 변경", 대체 API 안내 없음) 세 피드가 모두 404 가 되었다.
# 각 부처 누리집이 직접 운영하는 보도자료 RSS 로 교체한다.
#
# 관세청은 자체 RSS 안내를 찾지 못해 제외했다. 기존 수집분(~2026-07-02)은
# 아카이브로 남으므로 화면의 부처 필터에는 계속 노출된다.
#
# 저장 범위는 종전과 같다 — 제목·요약·원문링크·부처명만 보관하고, 요약 발췌는
# 공개 화면에 렌더링하지 않는다(NewsPage 의 BriefingArticle 주석 참조).
POLICY_BRIEFING_FEEDS = [
    # 재정경제부 — 2026-01-02 정부조직 개편으로 기획재정부에서 개칭(예산 기능은
    # 기획예산처로 분리). 저작권정책에 공공누리 제1유형(출처표시) 명시.
    {
        "ministry": "재정경제부",
        "source": "재정경제부 보도자료",
        "url": "https://mofe.go.kr/com/detailRssTagService.do?bbsId=MOSFBBS_000000000028",
    },
    # 금융위원회 — 저작권정책은 저작권법 제24조의2(자유이용)만 근거로 들고 공공누리
    # 유형을 명시하지 않는다. 무단 변경·개작을 금지하므로 원문 요약을 지면에
    # 재게시하지 않는 현재 방식(제목·부처·발행일·원문 링크만 노출)을 유지할 것.
    {
        "ministry": "금융위원회",
        "source": "금융위원회 보도자료",
        "url": "https://www.fsc.go.kr/about/fsc_bbs_rss/?fid=0111",
    },
]
