package com.stockapp.domain.financial.service;

import com.stockapp.common.exception.BusinessException;
import com.stockapp.common.exception.ErrorCode;
import com.stockapp.domain.financial.dto.FinancialMetricResponse;
import com.stockapp.domain.financial.dto.FinancialStatementResponse;
import com.stockapp.domain.financial.repository.FinancialMetricRepository;
import com.stockapp.domain.financial.repository.FinancialStatementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FinancialService {

    private final FinancialStatementRepository statementRepository;
    private final FinancialMetricRepository metricRepository;

    @Cacheable(value = "financials", key = "'statements:' + #ticker + ':' + #year + ':' + #reportCode + ':' + #fsDiv")
    public List<FinancialStatementResponse> getStatements(String ticker, Short year, String reportCode, String fsDiv) {
        return statementRepository.findByTickerAndFilters(ticker, year, reportCode, fsDiv).stream()
                .map(FinancialStatementResponse::from)
                .toList();
    }

    @Cacheable(value = "financials", key = "'metrics:' + #ticker")
    public FinancialMetricResponse getMetrics(String ticker) {
        return metricRepository.findLatestByTicker(ticker)
                .map(FinancialMetricResponse::from)
                .orElseThrow(() -> new BusinessException(ErrorCode.FINANCIAL_NOT_FOUND));
    }
}
