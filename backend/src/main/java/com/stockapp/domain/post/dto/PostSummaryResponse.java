package com.stockapp.domain.post.dto;

import com.stockapp.domain.post.entity.Post;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

/** 게시판 목록용 — 본문 대신 요약 발췌만 전달. */
@Getter
@AllArgsConstructor
public class PostSummaryResponse {

    private final Long id;
    private final String title;
    private final String excerpt;
    private final int likeCount;
    private final int dislikeCount;
    private final String authorName;
    private final LocalDateTime publishedAt;

    private static final int EXCERPT_LENGTH = 140;

    public static PostSummaryResponse from(Post post) {
        return new PostSummaryResponse(
                post.getId(),
                post.getTitle(),
                excerpt(post.getContent()),
                post.getLikeCount(),
                post.getDislikeCount(),
                post.getAuthor() == null ? null : post.getAuthor().getUsername(),
                post.getPublishedAt()
        );
    }

    private static String excerpt(String content) {
        if (content == null) {
            return "";
        }
        String flat = content.replaceAll("\\s+", " ").trim();
        return flat.length() <= EXCERPT_LENGTH ? flat : flat.substring(0, EXCERPT_LENGTH) + "…";
    }
}
