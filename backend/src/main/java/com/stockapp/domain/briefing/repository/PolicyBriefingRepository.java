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

    /** 공개 소식 — 지정한 날짜 범위의 기사 (해설 게시분 PUBLISHED + 수집분 COLLECTED). */
    @Query("SELECT b FROM PolicyBriefing b " +
           "WHERE b.editorialStatus IN :statuses " +
           "AND (:ministry IS NULL OR :ministry = '' OR b.ministry = :ministry) " +
           "AND b.publishedAt >= :start AND b.publishedAt < :end " +
           "ORDER BY b.publishedAt DESC, b.id DESC")
    List<PolicyBriefing> findPublicByDateRange(
            @Param("statuses") Collection<EditorialStatus> statuses,
            @Param("ministry") String ministry,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

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
