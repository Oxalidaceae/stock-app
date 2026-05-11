package com.stockapp.domain.disclosure.entity;

import com.stockapp.domain.company.entity.Company;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "disclosures")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Disclosure {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    @Column(name = "rcept_no", unique = true, nullable = false, length = 14)
    private String receptNo;

    @Column(name = "report_name", nullable = false, length = 200)
    private String reportName;

    @Column(name = "disclosure_type", length = 50)
    private String disclosureType;

    @Column(name = "rcept_date", nullable = false)
    private LocalDate receptDate;

    @Column(name = "submitter", length = 100)
    private String submitter;

    @Column(name = "dart_url", length = 300)
    private String dartUrl;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
