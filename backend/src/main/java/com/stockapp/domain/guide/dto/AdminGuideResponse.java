package com.stockapp.domain.guide.dto;

import com.stockapp.domain.guide.entity.Guide;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

/** 관리자용 가이드 (상태·타임스탬프 포함). */
@Getter
@AllArgsConstructor
public class AdminGuideResponse {

    private final Long id;
    private final String slug;
    private final String title;
    private final String summary;
    private final String tag;
    private final String content;
    private final String status;
    private final String authorName;
    private final LocalDateTime publishedAt;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public static AdminGuideResponse from(Guide guide) {
        return new AdminGuideResponse(
                guide.getId(),
                guide.getSlug(),
                guide.getTitle(),
                guide.getSummary(),
                guide.getTag(),
                guide.getContent(),
                guide.getStatus().name(),
                guide.getAuthor() == null ? null : guide.getAuthor().getUsername(),
                guide.getPublishedAt(),
                guide.getCreatedAt(),
                guide.getUpdatedAt()
        );
    }
}
