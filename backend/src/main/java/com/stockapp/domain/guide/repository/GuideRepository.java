package com.stockapp.domain.guide.repository;

import com.stockapp.domain.guide.entity.Guide;
import com.stockapp.domain.guide.entity.GuideStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GuideRepository extends JpaRepository<Guide, Long> {

    /** 공개 목록 — 게시된 가이드만 최신 게시순. */
    List<Guide> findByStatusOrderByPublishedAtDesc(GuideStatus status);

    /** 공개 상세 — slug + 상태. */
    Optional<Guide> findBySlugAndStatus(String slug, GuideStatus status);

    /** 관리자 목록 — 전체 최근 수정순. */
    Page<Guide> findAllByOrderByUpdatedAtDesc(Pageable pageable);

    /** 관리자 목록 — 상태 필터 + 최근 수정순. */
    Page<Guide> findByStatusOrderByUpdatedAtDesc(GuideStatus status, Pageable pageable);

    Optional<Guide> findBySlug(String slug);

    boolean existsBySlug(String slug);
}
