package com.stockapp.domain.post.dto;

import com.stockapp.domain.post.entity.Post;
import com.stockapp.domain.post.entity.ReactionType;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

/** 게시글 상세 — 본문 + 조회자(voterId)의 현재 반응 상태 포함. */
@Getter
@AllArgsConstructor
public class PostResponse {

    private final Long id;
    private final String title;
    private final String content;
    private final int likeCount;
    private final int dislikeCount;
    private final String authorName;
    private final LocalDateTime publishedAt;
    /** 조회자의 현재 반응: "LIKE" | "DISLIKE" | null. */
    private final String myReaction;

    public static PostResponse from(Post post, ReactionType myReaction) {
        return new PostResponse(
                post.getId(),
                post.getTitle(),
                post.getContent(),
                post.getLikeCount(),
                post.getDislikeCount(),
                post.getAuthor() == null ? null : post.getAuthor().getUsername(),
                post.getPublishedAt(),
                myReaction == null ? null : myReaction.name()
        );
    }
}
