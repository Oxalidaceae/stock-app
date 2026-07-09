package com.stockapp.domain.guide.service;

import com.stockapp.common.exception.BusinessException;
import com.stockapp.common.exception.ErrorCode;
import com.stockapp.domain.guide.entity.Guide;
import com.stockapp.domain.guide.entity.GuideStatus;
import com.stockapp.domain.guide.repository.GuideRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GuideServiceTest {

    private GuideRepository guideRepository;
    private GuideService guideService;

    @BeforeEach
    void setUp() {
        guideRepository = mock(GuideRepository.class);
        guideService = new GuideService(guideRepository);
    }

    @Test
    void getGuidesReturnsPublishedSummaries() {
        Guide guide = Guide.create("per-basics", "PER 읽는 법", "요약", "밸류에이션", "본문", GuideStatus.PUBLISHED, null);
        when(guideRepository.findByStatusOrderByPublishedAtDesc(GuideStatus.PUBLISHED))
                .thenReturn(List.of(guide));

        var result = guideService.getGuides();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getSlug()).isEqualTo("per-basics");
        assertThat(result.get(0).getTitle()).isEqualTo("PER 읽는 법");
    }

    @Test
    void getGuideReturnsPublishedGuideBySlug() {
        Guide guide = Guide.create("per-basics", "PER 읽는 법", "요약", "밸류에이션", "본문", GuideStatus.PUBLISHED, null);
        when(guideRepository.findBySlugAndStatus("per-basics", GuideStatus.PUBLISHED))
                .thenReturn(Optional.of(guide));

        var result = guideService.getGuide("per-basics");

        assertThat(result.getContent()).isEqualTo("본문");
    }

    @Test
    void getGuideRejectsUnknownOrUnpublishedSlug() {
        when(guideRepository.findBySlugAndStatus("hidden", GuideStatus.PUBLISHED))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> guideService.getGuide("hidden"))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.NOT_FOUND);
    }
}
