package com.stockapp.domain.post.dto;

import com.stockapp.domain.post.entity.ReactionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ReactionRequest {

    @NotNull(message = "반응 종류를 지정해주세요")
    private ReactionType type;

    /** 브라우저별 익명 식별자(localStorage UUID). 로그인 없이 중복 방지에 사용. */
    @NotBlank(message = "voterId 가 필요합니다")
    @Size(max = 100, message = "voterId 가 너무 깁니다")
    private String voterId;
}
