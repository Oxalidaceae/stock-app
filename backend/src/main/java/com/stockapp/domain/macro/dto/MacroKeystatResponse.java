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

    public static MacroKeystatResponse from(MacroKeystat m) {
        return new MacroKeystatResponse(
                m.getClassName(),
                m.getKeystatName(),
                m.getValue(),
                m.getUnit(),
                m.getCycle(),
                m.getUpdatedAt()
        );
    }
}
