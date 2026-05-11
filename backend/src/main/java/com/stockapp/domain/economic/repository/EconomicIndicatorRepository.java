package com.stockapp.domain.economic.repository;

import com.stockapp.domain.economic.entity.EconomicIndicator;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EconomicIndicatorRepository extends JpaRepository<EconomicIndicator, Long> {

    /**
     * 등록된 경제지표 종류 목록 (stat_code + stat_name 유니크)
     */
    @Query("SELECT DISTINCT e.statCode, e.statName, e.unit FROM EconomicIndicator e " +
           "ORDER BY e.statCode")
    List<Object[]> findDistinctIndicators();

    @Query("SELECT e FROM EconomicIndicator e WHERE e.statCode = :statCode " +
           "AND (:start IS NULL OR e.period >= :start) " +
           "AND (:end IS NULL OR e.period <= :end) " +
           "ORDER BY e.period ASC")
    List<EconomicIndicator> findByStatCodeAndPeriodRange(
            @Param("statCode") String statCode,
            @Param("start") String start,
            @Param("end") String end);
}
