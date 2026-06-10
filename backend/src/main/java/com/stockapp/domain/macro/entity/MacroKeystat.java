package com.stockapp.domain.macro.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "macro_keystats")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MacroKeystat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "class_name", nullable = false, length = 50)
    private String className;

    @Column(name = "keystat_name", nullable = false, length = 100)
    private String keystatName;

    @Column(name = "value", length = 50)
    private String value;

    @Column(name = "unit", length = 20)
    private String unit;

    @Column(name = "cycle", length = 20)
    private String cycle;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
