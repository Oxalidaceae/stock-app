package com.stockapp.domain.dividend.entity;

import com.stockapp.domain.company.entity.Company;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "dividends")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Dividend {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "fiscal_year", nullable = false)
    private Short fiscalYear;

    @Column(name = "dividend_type", length = 20)
    private String dividendType;

    @Column(name = "ex_dividend_date")
    private LocalDate exDividendDate;

    @Column(name = "payment_date")
    private LocalDate paymentDate;

    @Column(name = "dividend_per_share")
    private Integer dividendPerShare;

    @Column(name = "total_dividend")
    private Long totalDividend;

    @Column(name = "dividend_yield", precision = 6, scale = 2)
    private BigDecimal dividendYield;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
