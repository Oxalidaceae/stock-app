package com.stockapp.domain.economic.dto;

import com.stockapp.domain.economic.entity.EconomicIndicator;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.io.Serializable;
import java.math.BigDecimal;

@Getter
@AllArgsConstructor
public class EconomicIndicatorResponse implements Serializable {

    private final Long id;
    private final String statCode;
    private final String statName;
    private final String itemCode;
    private final String itemName;
    private final String period;
    private final Character periodType;
    private final BigDecimal value;
    private final String unit;

    public static EconomicIndicatorResponse from(EconomicIndicator e) {
        return new EconomicIndicatorResponse(
                e.getId(),
                e.getStatCode(),
                e.getStatName(),
                e.getItemCode(),
                e.getItemName(),
                e.getPeriod(),
                e.getPeriodType(),
                e.getValue(),
                e.getUnit()
        );
    }
}
