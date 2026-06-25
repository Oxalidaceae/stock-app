package com.stockapp.domain.briefing.entity;

import com.stockapp.domain.user.entity.AppUser;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "policy_briefing")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PolicyBriefing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(length = 100)
    private String ministry;

    @Column(length = 50)
    private String source;

    @Column(nullable = false, length = 1000)
    private String link;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "collected_at")
    private LocalDateTime collectedAt;

    @Column(name = "editor_note", columnDefinition = "TEXT")
    private String editorNote;

    @Column(name = "impact_tags", length = 500)
    private String impactTags;

    @Column(name = "related_indicators", length = 500)
    private String relatedIndicators;

    @Enumerated(EnumType.STRING)
    @Column(name = "editorial_status", nullable = false, length = 20)
    private EditorialStatus editorialStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private AppUser reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public void updateEditorial(
            String editorNote,
            String impactTags,
            String relatedIndicators,
            EditorialStatus status,
            AppUser reviewer) {
        this.editorNote = normalize(editorNote);
        this.impactTags = normalize(impactTags);
        this.relatedIndicators = normalize(relatedIndicators);
        this.editorialStatus = status;
        this.updatedAt = LocalDateTime.now();

        if (status == EditorialStatus.PUBLISHED) {
            this.reviewedBy = reviewer;
            this.reviewedAt = LocalDateTime.now();
        } else {
            this.reviewedBy = null;
            this.reviewedAt = null;
        }
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
