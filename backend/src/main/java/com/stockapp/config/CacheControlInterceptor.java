package com.stockapp.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Duration;

/**
 * 공개 조회 API(GET)에 {@code Cache-Control} 을 붙여 Cloudflare 엣지·브라우저가
 * 원본(홈서버 PostgreSQL) 부하를 대신 흡수하게 한다. 데이터는 대부분 시간·일 단위로만
 * 갱신되므로 짧은 max-age 로도 히트율이 높다.
 *
 * <p>preHandle 에서 헤더를 설정한다 — 핸들러가 응답 본문을 쓰기 전이라 확실히 반영된다.
 *
 * <p><b>public 캐시에서 제외해야 하는 것</b>(응답이 요청자마다 다르거나 민감):
 * <ul>
 *   <li>{@code /api/admin/**} · {@code /api/auth/**} — 인증·관리자 전용</li>
 *   <li>{@code /api/posts/**} — 게시글 상세가 요청 IP 기준 {@code myReaction} 을 포함.
 *       public 으로 캐싱하면 공유 캐시가 남의 반응 상태를 노출한다.</li>
 *   <li>{@code /api/sitemap.xml} — SitemapController 가 자체 Cache-Control(1시간) 지정</li>
 * </ul>
 */
@Component
public class CacheControlInterceptor implements HandlerInterceptor {

    // 시간·일 단위로만 바뀌는 데이터 — 경제지표(시간), 재무제표(일/주), 가이드(발행 시), 경제소식(3시간).
    private static final Duration LONG_TTL = Duration.ofMinutes(10);
    // 상대적으로 자주 갱신 — 주가(장마감 16:00), 공시(매시간), 검색, 수집상태.
    private static final Duration SHORT_TTL = Duration.ofSeconds(60);

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!HttpMethod.GET.matches(request.getMethod())) {
            return true;
        }

        String path = request.getRequestURI();
        if (isExcluded(path) || response.containsHeader(HttpHeaders.CACHE_CONTROL)) {
            return true;
        }

        Duration ttl = isSlowChanging(path) ? LONG_TTL : SHORT_TTL;
        response.setHeader(HttpHeaders.CACHE_CONTROL,
                CacheControl.maxAge(ttl).cachePublic().getHeaderValue());
        return true;
    }

    private boolean isExcluded(String path) {
        return path.startsWith("/api/admin/")
                || path.startsWith("/api/auth/")
                || path.startsWith("/api/posts")
                || path.equals("/api/sitemap.xml");
    }

    private boolean isSlowChanging(String path) {
        return path.startsWith("/api/economic")
                || path.startsWith("/api/macro")
                || path.startsWith("/api/financials")
                || path.startsWith("/api/guides")
                || path.startsWith("/api/briefings");
    }
}
