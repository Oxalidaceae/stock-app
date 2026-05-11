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
           "ORDER BY d.receptDate DESC")
    Page<Disclosure> findByTickerAndType(
            @Param("ticker") String ticker,
            @Param("type") String type,
            Pageable pageable);

    @Query("SELECT d FROM Disclosure d LEFT JOIN FETCH d.company " +
           "ORDER BY d.receptDate DESC")
    Page<Disclosure> findAllRecent(Pageable pageable);
}
