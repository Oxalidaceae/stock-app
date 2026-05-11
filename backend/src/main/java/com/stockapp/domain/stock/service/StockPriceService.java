package com.stockapp.domain.stock.service;

import com.stockapp.common.exception.BusinessException;
import com.stockapp.common.exception.ErrorCode;
import com.stockapp.domain.stock.dto.PriceChartResponse;
import com.stockapp.domain.stock.dto.StockPriceResponse;
import com.stockapp.domain.stock.entity.StockPrice;
import com.stockapp.domain.stock.repository.StockPriceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StockPriceService {

    private final StockPriceRepository stockPriceRepository;

    @Cacheable(value = "stocks", key = "'price:' + #ticker")
    public StockPriceResponse getLatestPrice(String ticker) {
        return stockPriceRepository.findLatestByTicker(ticker)
                .map(StockPriceResponse::from)
                .orElseThrow(() -> new BusinessException(ErrorCode.STOCK_PRICE_NOT_FOUND));
    }

    @Cacheable(value = "stocks", key = "'chart:' + #ticker + ':' + #period")
    public PriceChartResponse getChart(String ticker, String period) {
        LocalDate startDate = calculateStartDate(period);
        List<StockPrice> prices = stockPriceRepository.findByTickerAndDateRange(ticker, startDate);

        List<PriceChartResponse.ChartPoint> chartPoints = prices.stream()
                .map(sp -> new PriceChartResponse.ChartPoint(
                        sp.getTradeDate(),
                        sp.getOpenPrice(),
                        sp.getHighPrice(),
                        sp.getLowPrice(),
                        sp.getClosePrice(),
                        sp.getVolume()))
                .toList();

        return new PriceChartResponse(ticker, period, chartPoints);
    }

    private LocalDate calculateStartDate(String period) {
        LocalDate now = LocalDate.now();
        return switch (period.toUpperCase()) {
            case "1M" -> now.minusMonths(1);
            case "3M" -> now.minusMonths(3);
            case "6M" -> now.minusMonths(6);
            case "1Y" -> now.minusYears(1);
            case "3Y" -> now.minusYears(3);
            default -> now.minusMonths(3);
        };
    }
}
