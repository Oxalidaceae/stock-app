package com.stockapp.domain.post.dto;

import com.stockapp.domain.post.entity.Post;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

/** 관리자용 — 상태·집계·타임스탬프를 포함한 전체 정보. */
@Getter
@AllArgsConstructor
public class AdminPostResponse {

    private final Long id;
    private final String title;
    private final String content;
    private final String status;
    private final int likeCount;
    private final int dislikeCount;
    private final String authorName;
    private final LocalDateTime publishedAt;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public static AdminPostResponse from(Post post) {
        return new AdminPostResponse(
                post.getId(),
                post.getTitle(),
                post.getContent(),
                post.getStatus().name(),
                post.getLikeCount(),
                post.getDislikeCount(),
                post.getAuthor() == null ? null : post.getAuthor().getUsername(),
                post.getPublishedAt(),
                post.getCreatedAt(),
                post.getUpdatedAt()
        );
    }
}
