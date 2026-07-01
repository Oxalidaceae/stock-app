package com.stockapp.domain.guide.dto;

import com.stockapp.domain.guide.entity.Guide;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

/** 가이드 상세 (마크다운 본문 포함). */
@Getter
@AllArgsConstructor
public class GuideResponse {

    private final String slug;
    private final String title;
    private final String summary;
    private final String tag;
    private final String content;
    private final String authorName;
    private final LocalDateTime publishedAt;
    private final LocalDateTime updatedAt;

    public static GuideResponse from(Guide guide) {
        return new GuideResponse(
                guide.getSlug(),
                guide.getTitle(),
                guide.getSummary(),
                guide.getTag(),
                guide.getContent(),
                guide.getAuthor() == null ? null : guide.getAuthor().getUsername(),
                guide.getPublishedAt(),
                guide.getUpdatedAt()
        );
    }
}
