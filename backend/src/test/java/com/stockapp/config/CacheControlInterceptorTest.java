package com.stockapp.config;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;

class CacheControlInterceptorTest {

    private final CacheControlInterceptor interceptor = new CacheControlInterceptor();

    private String cacheHeaderFor(String method, String uri) {
        MockHttpServletRequest request = new MockHttpServletRequest(method, uri);
        MockHttpServletResponse response = new MockHttpServletResponse();
        interceptor.preHandle(request, response, new Object());
        return response.getHeader(HttpHeaders.CACHE_CONTROL);
    }

    @Test
    void fastChangingEndpointGetsShortTtl() {
        assertThat(cacheHeaderFor("GET", "/api/stocks/005930/price"))
                .contains("public")
                .contains("max-age=60");
    }

    @Test
    void slowChangingEndpointGetsLongTtl() {
        assertThat(cacheHeaderFor("GET", "/api/economic/indicators"))
                .contains("public")
                .contains("max-age=600");
    }

    @Test
    void nonGetRequestIsNotCached() {
        assertThat(cacheHeaderFor("POST", "/api/screener")).isNull();
    }

    @Test
    void adminAndAuthAreExcluded() {
        assertThat(cacheHeaderFor("GET", "/api/admin/posts")).isNull();
        assertThat(cacheHeaderFor("GET", "/api/auth/me")).isNull();
    }

    @Test
    void postsExcludedBecauseResponseVariesByRequesterIp() {
        // 게시글 상세는 요청 IP 기준 myReaction 을 포함 → public 캐싱 시 남의 반응 상태 노출
        assertThat(cacheHeaderFor("GET", "/api/posts/1")).isNull();
    }

    @Test
    void sitemapKeepsItsOwnCacheHeader() {
        assertThat(cacheHeaderFor("GET", "/api/sitemap.xml")).isNull();
    }

    @Test
    void existingCacheControlIsNotOverwritten() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/stocks/005930/price");
        MockHttpServletResponse response = new MockHttpServletResponse();
        response.setHeader(HttpHeaders.CACHE_CONTROL, "no-store");

        interceptor.preHandle(request, response, new Object());

        assertThat(response.getHeader(HttpHeaders.CACHE_CONTROL)).isEqualTo("no-store");
    }
}
