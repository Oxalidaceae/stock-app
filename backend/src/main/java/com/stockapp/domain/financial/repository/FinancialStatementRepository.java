package com.stockapp.domain.financial.repository;

import com.stockapp.domain.financial.entity.FinancialStatement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FinancialStatementRepository extends JpaRepository<FinancialStatement, Long> {

    @Query("SELECT fs FROM FinancialStatement fs WHERE fs.company.ticker = :ticker " +
           "AND (:year IS NULL OR fs.fiscalYear = :year) " +
           "AND (:reportCode IS NULL OR fs.reportCode = :reportCode) " +
           "AND (:fsDiv IS NULL OR fs.fsDiv = :fsDiv) " +
           "ORDER BY fs.fiscalYear DESC, fs.accountName ASC")
    List<FinancialStatement> findByTickerAndFilters(
            @Param("ticker") String ticker,
            @Param("year") Short year,
            @Param("reportCode") String reportCode,
            @Param("fsDiv") String fsDiv);
}
