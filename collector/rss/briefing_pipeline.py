"""부처 보도자료 RSS 수집 — "경제 소식".

재정경제부·금융위원회 누리집의 보도자료 RSS 피드를 파싱하여
policy_briefing 테이블에 upsert(link 기준 중복 제거)한다.

저작권/AdSense 안전: 본문 전체는 저장하지 않고
제목 + 짧은 요약 + 원문 링크 + 부처명만 보관하고 출처를 표시한다.

수집원은 원래 정책브리핑(korea.kr) 통합 RSS 였으나 2026-07-01 서비스 중단으로
부처 직접 수집으로 바꿨다. 배경은 config.POLICY_BRIEFING_FEEDS 주석 참조.
"""

import html
import logging
import re
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

import feedparser
from sqlalchemy.dialects.postgresql import insert as pg_insert

import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.database import get_session
from db.models import PolicyBriefing
from db.sync_status import record_sync
from config import POLICY_BRIEFING_FEEDS

logger = logging.getLogger(__name__)

_SUMMARY_MAX = 500
_TAG_RE = re.compile(r"<[^>]+>")
_KST = ZoneInfo("Asia/Seoul")

# 날짜 문자열 끝의 타임존 표기 — '+0900', '+09:00', 'Z', 'GMT', 'KST' 등.
_TZ_SUFFIX_RE = re.compile(r"(?:Z|[+-]\d{2}:?\d{2}|\b[A-Z]{2,5}\b)\s*$")


def _parse_published(entry) -> datetime | None:
    """RSS 발행시각을 KST naive datetime으로 반환.

    feedparser 의 *_parsed 는 "항상 UTC struct_time" 이라고들 하지만, 그건 원문에
    타임존이 붙어 있을 때 얘기다. 타임존 없는 값은 feedparser 가 UTC 로 간주해
    버리므로, 그걸 다시 KST 로 변환하면 발행시각이 +9시간 밀린다.

    부처 피드가 정확히 그 경우다:
      - 재정경제부  `<pubDate>2026-08-07 00:00:00.0</pubDate>`
      - 금융위원회  `<dc:date>2026-08-04 00:00:00</dc:date>`
    둘 다 KST 현지시각인데 타임존 표기가 없다. 무조건 +9 를 더하면 16:30 발행
    기사가 다음 날 01:30 으로 튀어 /news 날짜 탭이 통째로 어긋난다.
    (반대로 korea.kr 옛 피드는 RFC822 로 오프셋을 달고 왔으므로 변환이 필요했다.)

    그래서 원문 문자열에 타임존 표기가 있을 때만 UTC→KST 변환을 한다.
    """
    for parsed_attr, raw_attr in (("published_parsed", "published"),
                                  ("updated_parsed", "updated")):
        t = getattr(entry, parsed_attr, None)
        if not t:
            continue
        try:
            dt = datetime(*t[:6])
        except (TypeError, ValueError):
            continue

        raw = (getattr(entry, raw_attr, "") or "").strip()
        if _TZ_SUFFIX_RE.search(raw):
            dt = dt.replace(tzinfo=timezone.utc).astimezone(_KST).replace(tzinfo=None)
        return dt
    return None


def _normalize_link(raw: str | None) -> str:
    """원문 링크 정리 — http 를 https 로 승격.

    재정경제부 피드는 링크를 http 로 준다. https 지면에서 http 링크를 걸면
    브라우저가 한 번 더 리다이렉트를 타거나 경고를 띄운다. link 는 upsert 의
    중복 판정 키이기도 하므로 저장 전에 한 번만 정규화한다.
    """
    link = (raw or "").strip()
    if link.startswith("http://"):
        link = "https://" + link[len("http://"):]
    return link


def _clean_text(raw: str | None) -> str:
    """HTML 엔티티 디코딩(&quot; &middot; &nbsp; ...) + 공백 정리. 제목·요약 공통."""
    if not raw:
        return ""
    text = html.unescape(raw)
    text = text.replace("\xa0", " ")      # non-breaking space → 일반 공백
    return re.sub(r"\s+", " ", text).strip()


def _clean_summary(raw: str | None) -> str | None:
    if not raw:
        return None
    text = _clean_text(_TAG_RE.sub(" ", raw))   # HTML 태그 제거 후 엔티티/공백 정리
    return text[:_SUMMARY_MAX] or None


def sync_policy_briefings():
    """부처 보도자료 RSS 수집 → policy_briefing upsert."""
    if not POLICY_BRIEFING_FEEDS:
        logger.error("POLICY_BRIEFING_FEEDS 가 비어있음 — 경제 소식 수집 불가")
        record_sync("policy_briefings", status="failed", records=0,
                    message="POLICY_BRIEFING_FEEDS 미설정")
        return

    records = []
    seen_links = set()
    failures = []          # "부처(사유)" 문자열 — sync_status.message 로 남긴다

    for feed in POLICY_BRIEFING_FEEDS:
        url = feed["url"]
        ministry = feed["ministry"]
        try:
            parsed = feedparser.parse(url)
        except Exception as e:
            logger.error(f"RSS 파싱 실패 [{ministry}] {url}: {e}")
            failures.append(f"{ministry}(파싱 예외: {e})")
            continue

        # 항목이 0건이면 실패로 본다. 피드가 폐지되어 404 HTML 이 오거나 구조가
        # 바뀌어도 feedparser 는 예외를 던지지 않고 빈 entries 를 돌려주기 때문에,
        # 여기서 정상 취급하면 수집이 멈춘 걸 아무도 모른다 (실제로 korea.kr RSS
        # 폐지 후 36일간 그랬다). 부처 보도자료는 매일 나오므로 0건 = 이상 신호.
        if not parsed.entries:
            http_status = getattr(parsed, "status", None)
            reason = (f"HTTP {http_status}" if http_status and http_status != 200
                      else str(getattr(parsed, "bozo_exception", "") or "항목 0건"))
            logger.error(f"RSS 응답에 항목이 없음 [{ministry}] {url}: {reason}")
            failures.append(f"{ministry}({reason})")
            continue

        for e in parsed.entries:
            link = _normalize_link(getattr(e, "link", ""))
            title = _clean_text(getattr(e, "title", ""))
            if not link or not title or link in seen_links:
                continue
            seen_links.add(link)

            records.append({
                "title":        title[:500],
                # 재정경제부 피드에는 description 이 아예 없어 None 이 된다 — 요약은
                # 어차피 지면에 노출하지 않으므로 NULL 이어도 무방하다.
                "summary":      _clean_summary(getattr(e, "summary", None)),
                "ministry":     ministry,
                "source":       feed.get("source", "부처 보도자료"),
                "link":         link[:1000],
                "published_at": _parse_published(e),
            })

        logger.info(f"RSS 수집 [{ministry}]: {len(parsed.entries)}건")

    if not records:
        message = ("전체 피드 실패 — " + ", ".join(failures)) if failures else "수집된 항목 없음"
        logger.error(f"경제 소식 수집 실패: {message}")
        record_sync("policy_briefings", status="failed", records=0, message=message)
        return

    with get_session() as session:
        stmt = pg_insert(PolicyBriefing).values(records)
        stmt = stmt.on_conflict_do_update(
            index_elements=["link"],
            set_={
                "title":        stmt.excluded.title,
                "summary":      stmt.excluded.summary,
                "ministry":     stmt.excluded.ministry,
                "source":       stmt.excluded.source,
                "published_at": stmt.excluded.published_at,
            },
        )
        session.execute(stmt)

    # 일부 피드만 죽었을 때도 흔적을 남긴다 — 나머지가 살아 있으면 화면은
    # 정상으로 보이지만 그 부처 소식만 조용히 끊긴 상태이기 때문.
    status = "partial" if failures else "success"
    message = ("일부 피드 실패 — " + ", ".join(failures)) if failures else None
    if failures:
        logger.error(f"경제 소식 부분 실패: {message}")

    logger.info(f"경제 소식 수집 완료: {len(records)}건")
    record_sync("policy_briefings", status=status, records=len(records), message=message)
