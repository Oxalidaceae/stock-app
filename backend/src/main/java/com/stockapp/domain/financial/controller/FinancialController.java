package com.stockapp.domain.financial.controller;

import com.stockapp.common.response.ApiResponse;
import com.stockapp.domain.financial.dto.FinancialMetricResponse;
import com.stockapp.domain.financial.dto.FinancialStatementResponse;
import com.stockapp.domain.financial.dto.FinancialTrendResponse;
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

    /** 연도별 재무 펀더멘털 추이 (기본: 사업보고서 11011, 연결 CFS). */
    @GetMapping("/{ticker}/trend")
    public ApiResponse<List<FinancialTrendResponse>> getTrend(
            @PathVariable String ticker,
            @RequestParam(required = false, defaultValue = "11011") String reportCode,
            @RequestParam(required = false, name = "fsdiv", defaultValue = "CFS") String fsDiv) {
        return ApiResponse.success(financialService.getTrend(ticker, reportCode, fsDiv));
    }
}
