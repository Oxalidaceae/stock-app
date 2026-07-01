package com.stockapp.domain.guide.dto;

import com.stockapp.domain.guide.entity.GuideStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class GuideRequest {

    @NotBlank(message = "slug 를 입력해주세요")
    @Size(max = 200, message = "slug 는 200자 이하여야 합니다")
    @Pattern(regexp = "[a-z0-9]+(?:-[a-z0-9]+)*", message = "slug 는 영소문자·숫자·하이픈만 사용할 수 있습니다")
    private String slug;

    @NotBlank(message = "제목을 입력해주세요")
    @Size(max = 500, message = "제목은 500자 이하여야 합니다")
    private String title;

    @Size(max = 1000, message = "요약은 1,000자 이하여야 합니다")
    private String summary;

    @Size(max = 100, message = "분류는 100자 이하여야 합니다")
    private String tag;

    @NotBlank(message = "내용을 입력해주세요")
    @Size(max = 100000, message = "내용은 100,000자 이하여야 합니다")
    private String content;

    @NotNull(message = "게시 상태를 선택해주세요")
    private GuideStatus status;
}
