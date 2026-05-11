package com.stockapp.domain.financial.entity;

import com.stockapp.domain.company.entity.Company;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "financial_statements")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class FinancialStatement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "fiscal_year", nullable = false)
    private Short fiscalYear;

    @Column(name = "report_code", nullable = false, length = 5)
    private String reportCode;

    @Column(name = "fs_div", nullable = false, length = 3)
    private String fsDiv;

    @Column(name = "account_id", length = 50)
    private String accountId;

    @Column(name = "account_name", nullable = false, length = 100)
    private String accountName;

    @Column(name = "current_amount")
    private Long currentAmount;

    @Column(name = "previous_amount")
    private Long previousAmount;

    @Column(name = "currency", length = 10)
    private String currency;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
