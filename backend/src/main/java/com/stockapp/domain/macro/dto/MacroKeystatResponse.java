package com.stockapp.domain.macro.dto;

import com.stockapp.domain.macro.entity.MacroKeystat;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class MacroKeystatResponse {
    private final String className;
    private final String keystatName;
    private final String value;
    private final String unit;
    private final String cycle;
    private final LocalDateTime updatedAt;

    // 전기대비 변화 — macro_keystat_history 기준 (없으면 null)
    private final String previousValue;
    private final String previousCycle;
    private final Double change;        // value - previousValue
    private final Double changePercent; // (value - previousValue) / previousValue * 100

    public static MacroKeystatResponse from(MacroKeystat m) {
        return new MacroKeystatResponse(
                m.getClassName(),
                m.getKeystatName(),
                m.getValue(),
                m.getUnit(),
                m.getCycle(),
                m.getUpdatedAt(),
                null, null, null, null
        );
    }

    public static MacroKeystatResponse withChange(MacroKeystat m, String previousValue, String previousCycle) {
        Double current = parse(m.getValue());
        Double previous = parse(previousValue);
        Double change = (current != null && previous != null) ? round2(current - previous) : null;
        Double changePercent = (current != null && previous != null && previous != 0)
                ? round2((current - previous) / previous * 100)
                : null;

        return new MacroKeystatResponse(
                m.getClassName(),
                m.getKeystatName(),
                m.getValue(),
                m.getUnit(),
                m.getCycle(),
                m.getUpdatedAt(),
                previousValue,
                previousCycle,
                change,
                changePercent
        );
    }

    private static Double parse(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            return Double.parseDouble(s.replace(",", ""));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static Double round2(double v) {
        return Math.round(v * 100) / 100.0;
    }
}
