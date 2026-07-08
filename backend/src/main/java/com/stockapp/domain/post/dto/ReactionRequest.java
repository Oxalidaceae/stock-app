package com.stockapp.domain.post.dto;

import com.stockapp.domain.post.entity.ReactionType;
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

    /** 브라우저 익명 식별자(참고용, 선택). 중복 방지는 서버가 요청 IP 로 처리한다. */
    @Size(max = 100, message = "voterId 가 너무 깁니다")
    private String voterId;
}
