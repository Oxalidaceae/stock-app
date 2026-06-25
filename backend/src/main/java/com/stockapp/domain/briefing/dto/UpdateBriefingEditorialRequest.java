package com.stockapp.domain.briefing.dto;

import com.stockapp.domain.briefing.entity.EditorialStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UpdateBriefingEditorialRequest {

    @Size(max = 10000, message = "해설은 10,000자 이하여야 합니다")
    private String editorNote;

    @Size(max = 500, message = "관련 주제는 500자 이하여야 합니다")
    private String impactTags;

    @Size(max = 500, message = "관련 지표는 500자 이하여야 합니다")
    private String relatedIndicators;

    @NotNull(message = "게시 상태를 선택해주세요")
    private EditorialStatus editorialStatus;
}
