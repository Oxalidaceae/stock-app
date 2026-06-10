package com.stockapp.domain.stock.service;

import com.stockapp.common.exception.BusinessException;
import com.stockapp.common.exception.ErrorCode;
import com.stockapp.domain.stock.dto.StockPriceResponse;
import com.stockapp.domain.stock.repository.StockPriceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
}
