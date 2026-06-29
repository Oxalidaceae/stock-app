"""정책브리핑(korea.kr) 부처별 RSS 수집 — "경제 소식".

기획재정부·금융위원회·관세청 등 부처 RSS 피드를 파싱하여
policy_briefing 테이블에 upsert(link 기준 중복 제거)한다.

저작권/AdSense 안전: 본문 전체는 저장하지 않고
제목 + 짧은 요약 + 원문 링크 + 부처명만 보관 (공공누리 제1유형, 출처표시).
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


def _parse_published(entry) -> datetime | None:
    """RSS 발행시각을 KST naive datetime으로 반환.

    feedparser 의 published_parsed 는 항상 UTC(GMT) struct_time 이므로
    KST(+9)로 변환한 뒤 naive 로 저장한다. (변환 누락 시 자정 무렵 KST 기사가
    하루 전날 UTC 로 밀려 날짜 탭이 어긋남.)
    """
    t = getattr(entry, "published_parsed", None) or getattr(entry, "updated_parsed", None)
    if not t:
        return None
    try:
        return (
            datetime(*t[:6], tzinfo=timezone.utc)
            .astimezone(_KST)
            .replace(tzinfo=None)
        )
    except Exception:
        return None


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
    """정책브리핑 부처별 RSS 수집 → policy_briefing upsert."""
    if not POLICY_BRIEFING_FEEDS:
        logger.warning("POLICY_BRIEFING_FEEDS 가 비어있음 — 경제 소식 수집 건너뜀")
        return

    records = []
    seen_links = set()

    for feed in POLICY_BRIEFING_FEEDS:
        url = feed["url"]
        ministry = feed["ministry"]
        try:
            parsed = feedparser.parse(url)
        except Exception as e:
            logger.error(f"RSS 파싱 실패 [{ministry}] {url}: {e}")
            continue

        if parsed.bozo and not parsed.entries:
            logger.warning(f"RSS 응답 비정상 [{ministry}] {url}: {getattr(parsed, 'bozo_exception', '')}")
            continue

        for e in parsed.entries:
            link = (getattr(e, "link", "") or "").strip()
            title = _clean_text(getattr(e, "title", ""))
            if not link or not title or link in seen_links:
                continue
            seen_links.add(link)

            records.append({
                "title":        title[:500],
                "summary":      _clean_summary(getattr(e, "summary", None)),
                "ministry":     ministry,
                "source":       feed.get("source", "정책브리핑"),
                "link":         link[:1000],
                "published_at": _parse_published(e),
            })

        logger.info(f"RSS 수집 [{ministry}]: {len(parsed.entries)}건")

    if not records:
        logger.warning("경제 소식: 수집된 항목 없음")
        record_sync("policy_briefings", records=0)
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

    logger.info(f"경제 소식 수집 완료: {len(records)}건")
    record_sync("policy_briefings", records=len(records))
