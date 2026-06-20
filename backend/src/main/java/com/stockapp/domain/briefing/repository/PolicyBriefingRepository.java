package com.stockapp.domain.briefing.repository;

import com.stockapp.domain.briefing.entity.PolicyBriefing;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PolicyBriefingRepository extends JpaRepository<PolicyBriefing, Long> {

    @Query("SELECT b FROM PolicyBriefing b " +
           "WHERE (:ministry IS NULL OR :ministry = '' OR b.ministry = :ministry) " +
           "ORDER BY b.publishedAt DESC, b.id DESC")
    Page<PolicyBriefing> findAllByMinistry(@Param("ministry") String ministry, Pageable pageable);
}
