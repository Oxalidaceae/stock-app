package com.stockapp.domain.economic.controller;

import com.stockapp.common.response.ApiResponse;
import com.stockapp.domain.economic.dto.EconomicIndicatorResponse;
import com.stockapp.domain.economic.service.EconomicService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/economic")
@RequiredArgsConstructor
public class EconomicController {

    private final EconomicService economicService;

    @GetMapping("/indicators")
    public ApiResponse<List<Map<String, String>>> getIndicators() {
        return ApiResponse.success(economicService.getIndicatorList());
    }

    @GetMapping("/indicators/{statCode}")
    public ApiResponse<List<EconomicIndicatorResponse>> getTimeSeries(
            @PathVariable String statCode,
            @RequestParam(required = false) String start,
            @RequestParam(required = false) String end) {
        return ApiResponse.success(economicService.getTimeSeries(statCode, start, end));
    }
}
