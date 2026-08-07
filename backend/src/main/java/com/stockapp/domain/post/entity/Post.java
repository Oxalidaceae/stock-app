package com.stockapp.domain.post.entity;

import com.stockapp.domain.user.entity.AppUser;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "post")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PostStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PostCategory category;

    @Column(name = "like_count", nullable = false)
    private int likeCount;

    @Column(name = "dislike_count", nullable = false)
    private int dislikeCount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id")
    private AppUser author;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public static Post create(String title, String content,
                              PostCategory category, PostStatus status, AppUser author) {
        Post post = new Post();
        post.title = title.trim();
        post.content = content;
        post.category = category;
        post.author = author;
        post.likeCount = 0;
        post.dislikeCount = 0;
        LocalDateTime now = LocalDateTime.now();
        post.createdAt = now;
        post.updatedAt = now;
        post.applyStatus(status);
        return post;
    }

    public void update(String title, String content, PostCategory category, PostStatus status) {
        this.title = title.trim();
        this.content = content;
        this.category = category;
        this.updatedAt = LocalDateTime.now();
        applyStatus(status);
    }

    /** 처음 게시되는 순간에만 publishedAt 을 확정하고, 이후에는 유지한다. */
    private void applyStatus(PostStatus status) {
        this.status = status;
        if (status == PostStatus.PUBLISHED && this.publishedAt == null) {
            this.publishedAt = LocalDateTime.now();
        }
    }

    /** 반응 전환에 따른 집계 조정 (from → to). null 은 '반응 없음'. */
    public void adjustCounts(ReactionType from, ReactionType to) {
        if (from == ReactionType.LIKE) {
            this.likeCount = Math.max(0, this.likeCount - 1);
        } else if (from == ReactionType.DISLIKE) {
            this.dislikeCount = Math.max(0, this.dislikeCount - 1);
        }
        if (to == ReactionType.LIKE) {
            this.likeCount++;
        } else if (to == ReactionType.DISLIKE) {
            this.dislikeCount++;
        }
    }
}
