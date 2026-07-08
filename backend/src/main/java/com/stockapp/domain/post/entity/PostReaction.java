package com.stockapp.domain.post.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "post_reaction")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PostReaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "post_id", nullable = false)
    private Long postId;

    /** 중복 방지 기준: 요청 IP 의 단방향 해시. */
    @Column(name = "voter_ip_hash", nullable = false, length = 64)
    private String voterIpHash;

    /** 브라우저 익명 식별자(참고용). dedup 키 아님. */
    @Column(name = "voter_id", length = 100)
    private String voterId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ReactionType type;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public static PostReaction of(Long postId, String voterIpHash, String voterId, ReactionType type) {
        PostReaction reaction = new PostReaction();
        reaction.postId = postId;
        reaction.voterIpHash = voterIpHash;
        reaction.voterId = voterId;
        reaction.type = type;
        LocalDateTime now = LocalDateTime.now();
        reaction.createdAt = now;
        reaction.updatedAt = now;
        return reaction;
    }

    public void changeType(ReactionType type) {
        this.type = type;
        this.updatedAt = LocalDateTime.now();
    }
}
