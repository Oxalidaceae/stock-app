package com.stockapp.domain.guide.dto;

import com.stockapp.domain.guide.entity.Guide;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

/** 가이드 목록용. */
@Getter
@AllArgsConstructor
public class GuideSummaryResponse {

    private final String slug;
    private final String title;
    private final String summary;
    private final String tag;
    private final LocalDateTime publishedAt;

    public static GuideSummaryResponse from(Guide guide) {
        return new GuideSummaryResponse(
                guide.getSlug(),
                guide.getTitle(),
                guide.getSummary(),
                guide.getTag(),
                guide.getPublishedAt()
        );
    }
}
