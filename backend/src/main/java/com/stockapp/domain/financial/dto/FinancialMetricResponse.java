package com.stockapp.domain.financial.dto;

import com.stockapp.domain.financial.entity.FinancialMetric;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@AllArgsConstructor
public class FinancialMetricResponse implements Serializable {

    private final LocalDate baseDate;
    private final Short fiscalYear;
    private final String reportCode;

    // 밸류에이션
    private final BigDecimal per;
    private final BigDecimal pbr;
    private final BigDecimal psr;
    private final BigDecimal evEbitda;

    // 수익성
    private final BigDecimal roe;
    private final BigDecimal roa;
    private final BigDecimal operatingMargin;
    private final BigDecimal netMargin;

    // 안전성
    private final BigDecimal debtRatio;
    private final BigDecimal currentRatio;

    // 배당
    private final BigDecimal dividendYield;
    private final Long dps;

    // 주당 지표
    private final Long eps;
    private final Long bps;

    // 절대 규모
    private final Long revenue;
    private final Long operatingIncome;
    private final Long netIncome;
    private final Long totalAssets;
    private final Long totalEquity;

    public static FinancialMetricResponse from(FinancialMetric fm) {
        return new FinancialMetricResponse(
                fm.getBaseDate(),
                fm.getFiscalYear(),
                fm.getReportCode(),
                fm.getPer(),
                fm.getPbr(),
                fm.getPsr(),
                fm.getEvEbitda(),
                fm.getRoe(),
                fm.getRoa(),
                fm.getOperatingMargin(),
                fm.getNetMargin(),
                fm.getDebtRatio(),
                fm.getCurrentRatio(),
                fm.getDividendYield(),
                fm.getDps(),
                fm.getEps(),
                fm.getBps(),
                fm.getRevenue(),
                fm.getOperatingIncome(),
                fm.getNetIncome(),
                fm.getTotalAssets(),
                fm.getTotalEquity()
        );
    }
}
