package com.stockapp.domain.guide.entity;

import com.stockapp.domain.user.entity.AppUser;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "guide")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Guide {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** URL 식별자 (예: per-pbr-valuation). 유일. */
    @Column(nullable = false, length = 200)
    private String slug;

    @Column(nullable = false, length = 500)
    private String title;

    /** SEO 메타 설명 · 목록 요약. */
    @Column(columnDefinition = "TEXT")
    private String summary;

    /** 분류 라벨 (예: 밸류에이션). */
    @Column(length = 100)
    private String tag;

    /** 본문 (마크다운). */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private GuideStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id")
    private AppUser author;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public static Guide create(String slug, String title, String summary, String tag,
                               String content, GuideStatus status, AppUser author) {
        Guide guide = new Guide();
        guide.author = author;
        LocalDateTime now = LocalDateTime.now();
        guide.createdAt = now;
        guide.updatedAt = now;
        guide.assign(slug, title, summary, tag, content, status);
        return guide;
    }

    public void update(String slug, String title, String summary, String tag,
                       String content, GuideStatus status) {
        this.updatedAt = LocalDateTime.now();
        assign(slug, title, summary, tag, content, status);
    }

    private void assign(String slug, String title, String summary, String tag,
                        String content, GuideStatus status) {
        this.slug = slug.trim();
        this.title = title.trim();
        this.summary = normalize(summary);
        this.tag = normalize(tag);
        this.content = content;
        this.status = status;
        if (status == GuideStatus.PUBLISHED && this.publishedAt == null) {
            this.publishedAt = LocalDateTime.now();
        }
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
