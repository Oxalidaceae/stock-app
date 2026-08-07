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

# 수집 실패 알림 웹훅 (텔레그램 / Discord / Slack). 미설정이면 알림을 보내지 않는다.
#
# 정책브리핑 RSS 가 죽은 뒤 36일간 아무도 몰랐던 이유가 "실패가 로그에만 남아서"
# 였다. 로그를 매일 보지 않아도 알 수 있게 외부로 밀어낸다.
#
# 텔레그램:  https://api.telegram.org/bot<BOT_TOKEN>/sendMessage
# Discord:  채널 설정 → 연동 → 웹후크에서 발급한 URL
# Slack:    인커밍 웹훅 URL
COLLECTOR_ALERT_WEBHOOK = os.getenv("COLLECTOR_ALERT_WEBHOOK", "").strip()

# 텔레그램에서만 필요한 수신 대화방 ID. 텔레그램은 "URL 하나로 특정 방에 쏘는"
# 웹훅이 아니라 봇 API 라 받는 쪽을 따로 지정해야 한다.
# 확인 방법: 봇에게 아무 메시지나 보낸 뒤
#   curl https://api.telegram.org/bot<BOT_TOKEN>/getUpdates
# 응답의 result[].message.chat.id 값. (개인 대화는 양수, 그룹은 보통 음수)
COLLECTOR_ALERT_CHAT_ID = os.getenv("COLLECTOR_ALERT_CHAT_ID", "").strip()

# 연속 몇 회 실패해야 알림을 보낼지. 일시적 네트워크 오류로 알림이 울리면
# 결국 무시하게 되므로 기본 3회(= 시간당 실행 기준 3시간) 연속일 때만 보낸다.
#
# 값이 비어 있거나 숫자가 아니면 기본값으로 떨어진다 — 알림 설정 실수 하나로
# 컬렉터 전체가 기동조차 못 하는 상황을 만들지 않기 위해서다.
try:
    COLLECTOR_ALERT_THRESHOLD = int(os.getenv("COLLECTOR_ALERT_THRESHOLD") or 3)
except ValueError:
    COLLECTOR_ALERT_THRESHOLD = 3
