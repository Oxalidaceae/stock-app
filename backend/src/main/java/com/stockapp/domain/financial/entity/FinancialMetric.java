package com.stockapp.domain.financial.entity;

import com.stockapp.domain.company.entity.Company;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "financial_metrics")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class FinancialMetric {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "base_date", nullable = false)
    private LocalDate baseDate;

    @Column(name = "fiscal_year")
    private Short fiscalYear;

    @Column(name = "report_code", length = 5)
    private String reportCode;

    // 밸류에이션
    @Column(name = "per", precision = 10, scale = 2)
    private BigDecimal per;

    @Column(name = "pbr", precision = 10, scale = 2)
    private BigDecimal pbr;

    @Column(name = "psr", precision = 10, scale = 2)
    private BigDecimal psr;

    @Column(name = "ev_ebitda", precision = 10, scale = 2)
    private BigDecimal evEbitda;

    // 수익성
    @Column(name = "roe", precision = 10, scale = 2)
    private BigDecimal roe;

    @Column(name = "roa", precision = 10, scale = 2)
    private BigDecimal roa;

    @Column(name = "operating_margin", precision = 10, scale = 2)
    private BigDecimal operatingMargin;

    @Column(name = "net_margin", precision = 10, scale = 2)
    private BigDecimal netMargin;

    // 안전성
    @Column(name = "debt_ratio", precision = 10, scale = 2)
    private BigDecimal debtRatio;

    @Column(name = "current_ratio", precision = 10, scale = 2)
    private BigDecimal currentRatio;

    // 배당
    @Column(name = "dividend_yield", precision = 6, scale = 2)
    private BigDecimal dividendYield;

    @Column(name = "dps")
    private Long dps;

    // 주당 지표
    @Column(name = "eps")
    private Long eps;

    @Column(name = "bps")
    private Long bps;

    // 절대 규모
    @Column(name = "revenue")
    private Long revenue;

    @Column(name = "operating_income")
    private Long operatingIncome;

    @Column(name = "net_income")
    private Long netIncome;

    @Column(name = "total_assets")
    private Long totalAssets;

    @Column(name = "total_equity")
    private Long totalEquity;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
