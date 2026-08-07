package com.stockapp.domain.briefing.dto;

import com.stockapp.domain.briefing.entity.PolicyBriefing;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.io.Serializable;
import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class PolicyBriefingResponse implements Serializable {

    /*
     * 원문 요약(PolicyBriefing.summary)은 공개 응답에 담지 않는다.
     *
     * 화면에서는 이미 렌더링하지 않고 있었지만(NewsPage 주석 참조) 응답 본문에는
     * 실려 나가고 있었다. 수집원이 부처 보도자료로 바뀌면서 금융위원회처럼
     * "무단 변경·복제·배포 금지"를 명시한 기관이 포함됐고, 원문 발췌를 공개
     * API 로 흘리는 것은 그 조건에 걸릴 소지가 있다. 편집자가 큐레이션을 쓸 때
     * 참고하는 용도는 관리자 API(AdminBriefingResponse)가 계속 담당한다.
     */
    private final Long id;
    private final String title;
    private final String ministry;
    private final String source;
    private final String link;
    private final LocalDateTime publishedAt;
    private final String editorNote;
    private final String impactTags;
    private final String relatedIndicators;
    private final LocalDateTime reviewedAt;

    public static PolicyBriefingResponse from(PolicyBriefing b) {
        return new PolicyBriefingResponse(
                b.getId(),
                b.getTitle(),
                b.getMinistry(),
                b.getSource(),
                b.getLink(),
                b.getPublishedAt(),
                b.getEditorNote(),
                b.getImpactTags(),
                b.getRelatedIndicators(),
                b.getReviewedAt()
        );
    }
}
