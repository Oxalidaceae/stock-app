package com.stockapp.domain.macro.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** 100대 통계지표 시계열. cycle(데이터 시점)이 바뀔 때만 새 행이 추가된다. */
@Entity
@Table(name = "macro_keystat_history")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MacroKeystatHistory {

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

    @Column(name = "recorded_at", nullable = false)
    private LocalDateTime recordedAt;
}
