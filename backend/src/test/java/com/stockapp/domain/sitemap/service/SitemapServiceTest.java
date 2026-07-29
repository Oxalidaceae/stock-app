package com.stockapp.domain.sitemap.service;

import com.stockapp.domain.guide.entity.Guide;
import com.stockapp.domain.guide.entity.GuideStatus;
import com.stockapp.domain.guide.repository.GuideRepository;
import com.stockapp.domain.post.entity.Post;
import com.stockapp.domain.post.entity.PostStatus;
import com.stockapp.domain.post.repository.PostRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class SitemapServiceTest {

    private GuideRepository guideRepository;
    private PostRepository postRepository;
    private SitemapService service;

    @BeforeEach
    void setUp() {
        guideRepository = mock(GuideRepository.class);
        postRepository = mock(PostRepository.class);
        service = new SitemapService(guideRepository, postRepository);
    }

    @Test
    void includesStaticRoutesAndPublishedContent() {
        Guide guide = mock(Guide.class);
        when(guide.getSlug()).thenReturn("per-guide");
        when(guide.getUpdatedAt()).thenReturn(LocalDateTime.of(2026, 7, 1, 9, 30));
        when(guideRepository.findByStatusOrderByPublishedAtDesc(GuideStatus.PUBLISHED))
                .thenReturn(List.of(guide));

        Post post = mock(Post.class);
        when(post.getId()).thenReturn(42L);
        when(post.getUpdatedAt()).thenReturn(LocalDateTime.of(2026, 7, 2, 12, 0));
        when(postRepository.findAllByStatusOrderByPublishedAtDesc(PostStatus.PUBLISHED))
                .thenReturn(List.of(post));

        String xml = service.buildXml();

        assertThat(xml).startsWith("<?xml");
        assertThat(xml).contains("<loc>https://jipyo.net/</loc>");        // 홈
        assertThat(xml).contains("<loc>https://jipyo.net/screener</loc>"); // 정적 라우트
        assertThat(xml).contains("<loc>https://jipyo.net/guide/per-guide</loc>");
        assertThat(xml).contains("<lastmod>2026-07-01</lastmod>");        // 날짜만(시간 제거)
        assertThat(xml).contains("<loc>https://jipyo.net/board/42</loc>");
        assertThat(xml).contains("<loc>https://jipyo.net/board</loc>");   // 글이 있으니 목록도 포함
        assertThat(xml).contains("</urlset>");
    }

    @Test
    void emptyContentStillEmitsStaticRoutes() {
        when(guideRepository.findByStatusOrderByPublishedAtDesc(GuideStatus.PUBLISHED))
                .thenReturn(List.of());
        when(postRepository.findAllByStatusOrderByPublishedAtDesc(PostStatus.PUBLISHED))
                .thenReturn(List.of());

        String xml = service.buildXml();

        assertThat(xml).contains("<loc>https://jipyo.net/disclosures</loc>");
        assertThat(xml).doesNotContain("/guide/");   // 게시된 가이드 없음
        assertThat(xml).doesNotContain("/board/");   // 게시된 글 없음
        // 빈 게시판은 목록 URL 자체를 넣지 않는다 (thin content 신호 회피)
        assertThat(xml).doesNotContain("<loc>https://jipyo.net/board</loc>");
    }
}
