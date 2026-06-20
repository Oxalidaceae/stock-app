package com.stockapp.domain.briefing.entity;

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
}
