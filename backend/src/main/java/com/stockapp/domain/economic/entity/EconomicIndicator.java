package com.stockapp.domain.economic.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "economic_indicators")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EconomicIndicator {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "stat_code", nullable = false, length = 10)
    private String statCode;

    @Column(name = "stat_name", nullable = false, length = 100)
    private String statName;

    @Column(name = "item_code", nullable = false, length = 50)
    private String itemCode;

    @Column(name = "item_name", nullable = false, length = 200)
    private String itemName;

    @Column(name = "period", nullable = false, length = 10)
    private String period;

    @Column(name = "period_type", nullable = false, length = 1)
    private Character periodType;

    @Column(name = "value", precision = 20, scale = 4)
    private BigDecimal value;

    @Column(name = "unit", length = 20)
    private String unit;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
