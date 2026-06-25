package com.stockapp.domain.briefing.dto;

import com.stockapp.domain.briefing.entity.PolicyBriefing;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class AdminBriefingResponse {

    private final Long id;
    private final String title;
    private final String summary;
    private final String ministry;
    private final String source;
    private final String link;
    private final LocalDateTime publishedAt;
    private final LocalDateTime collectedAt;
    private final String editorNote;
    private final String impactTags;
    private final String relatedIndicators;
    private final String editorialStatus;
    private final String reviewedBy;
    private final LocalDateTime reviewedAt;
    private final LocalDateTime updatedAt;

    public static AdminBriefingResponse from(PolicyBriefing briefing) {
        return new AdminBriefingResponse(
                briefing.getId(),
                briefing.getTitle(),
                briefing.getSummary(),
                briefing.getMinistry(),
                briefing.getSource(),
                briefing.getLink(),
                briefing.getPublishedAt(),
                briefing.getCollectedAt(),
                briefing.getEditorNote(),
                briefing.getImpactTags(),
                briefing.getRelatedIndicators(),
                briefing.getEditorialStatus().name(),
                briefing.getReviewedBy() == null ? null : briefing.getReviewedBy().getUsername(),
                briefing.getReviewedAt(),
                briefing.getUpdatedAt()
        );
    }
}
