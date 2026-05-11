package com.stockapp.domain.stock.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.List;

@Getter
@AllArgsConstructor
public class PriceChartResponse implements Serializable {

    private final String ticker;
    private final String period;
    private final List<ChartPoint> data;

    @Getter
    @AllArgsConstructor
    public static class ChartPoint implements Serializable {
        private final LocalDate date;
        private final Long open;
        private final Long high;
        private final Long low;
        private final Long close;
        private final Long volume;
    }
}
