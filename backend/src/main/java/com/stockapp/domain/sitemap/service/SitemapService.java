package com.stockapp.domain.sitemap.service;

import com.stockapp.domain.guide.entity.Guide;
import com.stockapp.domain.guide.entity.GuideStatus;
import com.stockapp.domain.guide.repository.GuideRepository;
import com.stockapp.domain.post.entity.Post;
import com.stockapp.domain.post.entity.PostStatus;
import com.stockapp.domain.post.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * sitemap.xml 동적 생성.
 * 정적 라우트 + 게시된 가이드(/guide/slug) + 게시된 게시글(/board/id)을 DB에서 읽어
 * 관리자가 글을 게시하는 즉시 사이트맵에 반영되게 한다.
 * (종목 상세 /stock/* 는 수천 개 얇은 페이지의 대량 등록을 피하기 위해 의도적으로 제외)
 */
@Service
@RequiredArgsConstructor
public class SitemapService {

    /** canonical·프리렌더(prerender-meta.mjs)와 동일한 운영 도메인. */
    private static final String ORIGIN = "https://jipyo.net";
    private static final DateTimeFormatter DATE = DateTimeFormatter.ISO_LOCAL_DATE;

    private final GuideRepository guideRepository;
    private final PostRepository postRepository;

    private record StaticRoute(String path, String changefreq, String priority) {}

    private static final List<StaticRoute> STATIC_ROUTES = List.of(
            new StaticRoute("/", "daily", "1.0"),
            new StaticRoute("/disclosures", "daily", "0.9"),
            new StaticRoute("/economic", "daily", "0.8"),
            new StaticRoute("/macro", "daily", "0.8"),
            new StaticRoute("/news", "daily", "0.8"),
            new StaticRoute("/screener", "weekly", "0.7"),
            new StaticRoute("/compare", "weekly", "0.7"),
            new StaticRoute("/guide", "weekly", "0.6"),
            new StaticRoute("/about", "monthly", "0.5"),
            new StaticRoute("/contact", "monthly", "0.5"),
            new StaticRoute("/privacy", "monthly", "0.3"),
            new StaticRoute("/terms", "monthly", "0.3")
    );

    /**
     * 게시판 목록. 게시된 글이 하나도 없으면 사이트맵에 넣지 않는다 —
     * 빈 섹션을 크롤러에 제출하면 thin content 신호가 된다.
     * (사이드바 노출도 같은 조건으로 숨긴다: frontend Sidebar/useHasPosts)
     */
    private static final StaticRoute BOARD_ROUTE = new StaticRoute("/board", "weekly", "0.6");

    @Transactional(readOnly = true)
    public String buildXml() {
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");

        List<Post> posts = postRepository.findAllByStatusOrderByPublishedAtDesc(PostStatus.PUBLISHED);

        for (StaticRoute route : STATIC_ROUTES) {
            appendUrl(xml, ORIGIN + route.path(), null, route.changefreq(), route.priority());
        }
        if (!posts.isEmpty()) {
            appendUrl(xml, ORIGIN + BOARD_ROUTE.path(), null,
                    BOARD_ROUTE.changefreq(), BOARD_ROUTE.priority());
        }
        for (Guide guide : guideRepository.findByStatusOrderByPublishedAtDesc(GuideStatus.PUBLISHED)) {
            appendUrl(xml, ORIGIN + "/guide/" + guide.getSlug(),
                    guide.getUpdatedAt(), "monthly", "0.6");
        }
        for (Post post : posts) {
            appendUrl(xml, ORIGIN + "/board/" + post.getId(),
                    post.getUpdatedAt(), "monthly", "0.5");
        }

        xml.append("</urlset>\n");
        return xml.toString();
    }

    private void appendUrl(StringBuilder xml, String loc, LocalDateTime lastmod,
                           String changefreq, String priority) {
        xml.append("  <url>\n");
        xml.append("    <loc>").append(loc).append("</loc>\n");
        if (lastmod != null) {
            xml.append("    <lastmod>").append(DATE.format(lastmod.toLocalDate())).append("</lastmod>\n");
        }
        xml.append("    <changefreq>").append(changefreq).append("</changefreq>\n");
        xml.append("    <priority>").append(priority).append("</priority>\n");
        xml.append("  </url>\n");
    }
}
