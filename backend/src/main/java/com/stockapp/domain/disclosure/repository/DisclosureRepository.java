package com.stockapp.domain.disclosure.repository;

import com.stockapp.domain.disclosure.entity.Disclosure;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DisclosureRepository extends JpaRepository<Disclosure, Long> {

    @Query("SELECT d FROM Disclosure d JOIN FETCH d.company c " +
           "WHERE c.ticker = :ticker " +
           "AND (:type IS NULL OR d.disclosureType = :type) " +
           "ORDER BY d.receptDate DESC, d.receptNo DESC")
    Page<Disclosure> findByTickerAndType(
            @Param("ticker") String ticker,
            @Param("type") String type,
            Pageable pageable);

    @Query("SELECT d FROM Disclosure d LEFT JOIN FETCH d.company c " +
           "WHERE (:q IS NULL OR :q = '' OR " +
           "       LOWER(d.reportName) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "       LOWER(COALESCE(c.companyName, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "       COALESCE(c.ticker, '') LIKE CONCAT('%', :q, '%')) " +
           "ORDER BY d.receptDate DESC, d.receptNo DESC")
    Page<Disclosure> findAllRecent(@Param("q") String q, Pageable pageable);
}
