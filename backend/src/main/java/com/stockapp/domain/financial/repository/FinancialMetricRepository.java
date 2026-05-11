package com.stockapp.domain.financial.repository;

import com.stockapp.domain.financial.entity.FinancialMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface FinancialMetricRepository extends JpaRepository<FinancialMetric, Long>,
        JpaSpecificationExecutor<FinancialMetric> {

    @Query("SELECT fm FROM FinancialMetric fm WHERE fm.company.ticker = :ticker " +
           "ORDER BY fm.baseDate DESC LIMIT 1")
    Optional<FinancialMetric> findLatestByTicker(@Param("ticker") String ticker);
}
