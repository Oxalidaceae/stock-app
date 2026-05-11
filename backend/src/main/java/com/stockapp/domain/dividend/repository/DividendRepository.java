package com.stockapp.domain.dividend.repository;

import com.stockapp.domain.dividend.entity.Dividend;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface DividendRepository extends JpaRepository<Dividend, Long> {

    @Query("SELECT d FROM Dividend d JOIN FETCH d.company c " +
           "WHERE d.exDividendDate >= :startDate AND d.exDividendDate <= :endDate " +
           "ORDER BY d.exDividendDate ASC")
    List<Dividend> findByExDividendDateBetween(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}
