package com.stockapp.domain.briefing.repository;

import com.stockapp.domain.briefing.entity.PolicyBriefing;
import com.stockapp.domain.briefing.entity.EditorialStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface PolicyBriefingRepository extends JpaRepository<PolicyBriefing, Long> {

    /** 공개 소식 — 전체. 고정 없이 순수 최신순(날짜 필터 해제 상태). (PUBLISHED + COLLECTED) */
    @Query("SELECT b FROM PolicyBriefing b " +
           "WHERE b.editorialStatus IN :statuses " +
           "AND (:ministry IS NULL OR :ministry = '' OR b.ministry = :ministry) " +
           "ORDER BY b.publishedAt DESC, b.id DESC")
    Page<PolicyBriefing> findPublic(
            @Param("statuses") Collection<EditorialStatus> statuses,
            @Param("ministry") String ministry,
            Pageable pageable);

    /** 공개 소식 — 지정한 날짜 범위. 같은 날이므로 요약(PUBLISHED)을 상단 고정 후 시간 최신순. (PUBLISHED + COLLECTED) */
    @Query("SELECT b FROM PolicyBriefing b " +
           "WHERE b.editorialStatus IN :statuses " +
           "AND (:ministry IS NULL OR :ministry = '' OR b.ministry = :ministry) " +
           "AND b.publishedAt >= :start AND b.publishedAt < :end " +
           "ORDER BY CASE WHEN b.editorNote IS NOT NULL THEN 0 ELSE 1 END, " +
           "b.publishedAt DESC, b.id DESC")
    Page<PolicyBriefing> findPublicByDateRange(
            @Param("statuses") Collection<EditorialStatus> statuses,
            @Param("ministry") String ministry,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            Pageable pageable);

    /** 날짜 탭용 — 공개 소식의 날짜별 건수 (최신순). */
    @Query(value = "SELECT DATE(published_at) AS d, COUNT(*) AS cnt " +
           "FROM policy_briefing " +
           "WHERE editorial_status IN ('PUBLISHED', 'COLLECTED') " +
           "AND (:ministry IS NULL OR :ministry = '' OR ministry = :ministry) " +
           "AND published_at IS NOT NULL " +
           "GROUP BY DATE(published_at) ORDER BY d DESC",
           nativeQuery = true)
    List<Object[]> findPublicDateCounts(@Param("ministry") String ministry);

    @Query("SELECT b FROM PolicyBriefing b " +
           "WHERE (:status IS NULL OR b.editorialStatus = :status) " +
           "AND (:ministry IS NULL OR :ministry = '' OR b.ministry = :ministry) " +
           "AND (:q IS NULL OR :q = '' OR LOWER(b.title) LIKE LOWER(CONCAT('%', :q, '%'))) " +
           "ORDER BY b.publishedAt DESC, b.id DESC")
    Page<PolicyBriefing> findForAdmin(
            @Param("status") EditorialStatus status,
            @Param("ministry") String ministry,
            @Param("q") String q,
            Pageable pageable);
}
