package com.stockapp.domain.post.dto;

import com.stockapp.domain.post.entity.PostStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class PostRequest {

    @NotBlank(message = "제목을 입력해주세요")
    @Size(max = 500, message = "제목은 500자 이하여야 합니다")
    private String title;

    @NotBlank(message = "내용을 입력해주세요")
    @Size(max = 50000, message = "내용은 50,000자 이하여야 합니다")
    private String content;

    @NotNull(message = "게시 상태를 선택해주세요")
    private PostStatus status;
}
