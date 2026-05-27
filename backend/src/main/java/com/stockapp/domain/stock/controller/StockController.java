package com.stockapp.domain.stock.controller;

import com.stockapp.common.response.ApiResponse;
import com.stockapp.domain.stock.dto.StockPriceResponse;
import com.stockapp.domain.stock.service.StockPriceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stocks")
@RequiredArgsConstructor
public class StockController {

    private final StockPriceService stockPriceService;

    @GetMapping("/{ticker}/price")
    public ApiResponse<StockPriceResponse> getLatestPrice(@PathVariable String ticker) {
        return ApiResponse.success(stockPriceService.getLatestPrice(ticker));
    }
}
