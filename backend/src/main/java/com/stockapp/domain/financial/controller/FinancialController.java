package com.stockapp.domain.financial.controller;

import com.stockapp.common.response.ApiResponse;
import com.stockapp.domain.financial.dto.FinancialMetricResponse;
import com.stockapp.domain.financial.dto.FinancialStatementResponse;
import com.stockapp.domain.financial.service.FinancialService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/financials")
@RequiredArgsConstructor
public class FinancialController {

    private final FinancialService financialService;

    @GetMapping("/{ticker}/statements")
    public ApiResponse<List<FinancialStatementResponse>> getStatements(
            @PathVariable String ticker,
            @RequestParam(required = false) Short year,
            @RequestParam(required = false) String reportCode,
            @RequestParam(required = false, name = "fsdiv") String fsDiv) {
        return ApiResponse.success(financialService.getStatements(ticker, year, reportCode, fsDiv));
    }

    @GetMapping("/{ticker}/metrics")
    public ApiResponse<FinancialMetricResponse> getMetrics(@PathVariable String ticker) {
        return ApiResponse.success(financialService.getMetrics(ticker));
    }
}
