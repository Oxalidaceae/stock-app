package com.stockapp.domain.post.dto;

import com.stockapp.domain.post.entity.ReactionType;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ReactionResponse {

    private final int likeCount;
    private final int dislikeCount;
    /** 반응 후 조회자의 상태: "LIKE" | "DISLIKE" | null(취소됨). */
    private final String myReaction;

    public static ReactionResponse of(int likeCount, int dislikeCount, ReactionType myReaction) {
        return new ReactionResponse(
                likeCount,
                dislikeCount,
                myReaction == null ? null : myReaction.name()
        );
    }
}
