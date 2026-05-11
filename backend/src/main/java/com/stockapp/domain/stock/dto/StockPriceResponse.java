package com.stockapp.domain.stock.dto;

import com.stockapp.domain.stock.entity.StockPrice;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.io.Serializable;
import java.time.LocalDate;

@Getter
@AllArgsConstructor
public class StockPriceResponse implements Serializable {

    private final LocalDate tradeDate;
    private final Long openPrice;
    private final Long highPrice;
    private final Long lowPrice;
    private final Long closePrice;
    private final Long volume;
    private final Long marketCap;

    public static StockPriceResponse from(StockPrice sp) {
        return new StockPriceResponse(
                sp.getTradeDate(),
                sp.getOpenPrice(),
                sp.getHighPrice(),
                sp.getLowPrice(),
                sp.getClosePrice(),
                sp.getVolume(),
                sp.getMarketCap()
        );
    }
}
