package com.stockapp.domain.company.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "companies")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "corp_code", unique = true, nullable = false, length = 8)
    private String corpCode;

    @Column(name = "ticker", unique = true, length = 10)
    private String ticker;

    @Column(name = "company_name", nullable = false, length = 100)
    private String companyName;

    @Column(name = "company_name_en", length = 100)
    private String companyNameEn;

    @Column(name = "market", length = 10)
    private String market;

    @Column(name = "sector", length = 50)
    private String sector;

    @Column(name = "industry", length = 100)
    private String industry;

    @Column(name = "ceo_name", length = 50)
    private String ceoName;

    @Column(name = "listing_date")
    private LocalDate listingDate;

    @Column(name = "fiscal_month")
    private Short fiscalMonth;

    @Column(name = "homepage", length = 200)
    private String homepage;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.isActive == null) {
            this.isActive = true;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
