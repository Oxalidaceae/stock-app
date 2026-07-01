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

    @Column(name = "voter_id", nullable = false, length = 100)
    private String voterId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ReactionType type;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public static PostReaction of(Long postId, String voterId, ReactionType type) {
        PostReaction reaction = new PostReaction();
        reaction.postId = postId;
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
