package com.stockapp.domain.guide.entity;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class GuideTest {

    @Test
    void createTrimsAndNormalizesBlankToNull() {
        Guide guide = Guide.create("  my-slug  ", "  제목  ", "   ", "  분류  ", "본문", GuideStatus.DRAFT, null);

        assertThat(guide.getSlug()).isEqualTo("my-slug");
        assertThat(guide.getTitle()).isEqualTo("제목");
        assertThat(guide.getSummary()).isNull();    // 공백 요약 → null
        assertThat(guide.getTag()).isEqualTo("분류");
        assertThat(guide.getPublishedAt()).isNull(); // DRAFT 는 게시 시각 없음
    }

    @Test
    void publishedAtIsSetOnFirstPublishAndKeptAfterwards() {
        Guide guide = Guide.create("slug", "제목", null, null, "본문", GuideStatus.PUBLISHED, null);
        var firstPublishedAt = guide.getPublishedAt();
        assertThat(firstPublishedAt).isNotNull();

        guide.update("slug", "제목", null, null, "본문", GuideStatus.DRAFT);
        guide.update("slug", "제목", null, null, "본문", GuideStatus.PUBLISHED);

        assertThat(guide.getPublishedAt()).isEqualTo(firstPublishedAt);
    }
}
