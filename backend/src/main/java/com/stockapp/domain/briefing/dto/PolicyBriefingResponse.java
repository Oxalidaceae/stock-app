package com.stockapp.domain.briefing.dto;

import com.stockapp.domain.briefing.entity.PolicyBriefing;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.io.Serializable;
import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class PolicyBriefingResponse implements Serializable {

    private final Long id;
    private final String title;
    private final String summary;
    private final String ministry;
    private final String source;
    private final String link;
    private final LocalDateTime publishedAt;

    public static PolicyBriefingResponse from(PolicyBriefing b) {
        return new PolicyBriefingResponse(
                b.getId(),
                b.getTitle(),
                b.getSummary(),
                b.getMinistry(),
                b.getSource(),
                b.getLink(),
                b.getPublishedAt()
        );
    }
}
