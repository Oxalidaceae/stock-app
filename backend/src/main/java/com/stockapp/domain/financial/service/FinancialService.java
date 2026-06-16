package com.stockapp.domain.financial.service;

import com.stockapp.common.exception.BusinessException;
import com.stockapp.common.exception.ErrorCode;
import com.stockapp.domain.financial.dto.FinancialMetricResponse;
import com.stockapp.domain.financial.dto.FinancialStatementResponse;
import com.stockapp.domain.financial.dto.FinancialTrendResponse;
import com.stockapp.domain.financial.entity.FinancialStatement;
import com.stockapp.domain.financial.repository.FinancialMetricRepository;
import com.stockapp.domain.financial.repository.FinancialStatementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FinancialService {

    private final FinancialStatementRepository statementRepository;
    private final FinancialMetricRepository metricRepository;

    // DART IFRS 계정과목 ID 매핑 (collector/market/market_pipeline.py _ACCOUNT_MAP 와 동일)
    private static final Set<String> REVENUE_IDS = Set.of("ifrs-full_Revenue", "dart_Revenue", "ifrs_Revenue");
    private static final Set<String> OPERATING_INCOME_IDS = Set.of("dart_OperatingIncomeLoss", "ifrs-full_ProfitLossFromOperatingActivities");
    private static final Set<String> NET_INCOME_IDS = Set.of("ifrs-full_ProfitLoss", "ifrs-full_ProfitLossAttributableToOwnersOfParent");
    private static final Set<String> TOTAL_ASSETS_IDS = Set.of("ifrs-full_Assets");
    private static final Set<String> TOTAL_EQUITY_IDS = Set.of("ifrs-full_Equity", "ifrs-full_EquityAttributableToOwnersOfParent");
    private static final Set<String> EPS_IDS = Set.of("ifrs-full_BasicEarningsLossPerShare");

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

    /**
     * financial_statements 를 회계연도별로 집계해 매출/영업이익/순이익 등 추이를 반환한다.
     * 각 보고서의 당기(current)뿐 아니라 전기(previous) 금액도 활용해 직전 연도를 보강한다.
     * (DART 보고서는 당기·전기를 함께 담으므로 단일 연도 적재 시에도 2개 연도를 얻을 수 있다.)
     * 마진·ROE 는 원본 계정에서 파생 계산한다. (오름차순 정렬)
     */
    @Cacheable(value = "financials", key = "'trend:' + #ticker + ':' + #reportCode + ':' + #fsDiv")
    public List<FinancialTrendResponse> getTrend(String ticker, String reportCode, String fsDiv) {
        List<FinancialStatement> rows = statementRepository.findByTickerAndFilters(ticker, null, reportCode, fsDiv);

        // 당기 금액 기반 버킷 (실제 보고서 연도)
        Map<Short, Bucket> current = new TreeMap<>(Comparator.naturalOrder());
        // 전기 금액 기반 버킷 (직전 연도 보강용)
        Map<Short, Bucket> derived = new TreeMap<>(Comparator.naturalOrder());

        for (FinancialStatement fs : rows) {
            current.computeIfAbsent(fs.getFiscalYear(), y -> new Bucket())
                    .apply(fs.getAccountId(), fs.getAccountName(), fs.getCurrentAmount());
            if (fs.getPreviousAmount() != null) {
                derived.computeIfAbsent((short) (fs.getFiscalYear() - 1), y -> new Bucket())
                        .apply(fs.getAccountId(), fs.getAccountName(), fs.getPreviousAmount());
            }
        }

        // 전기 보강분으로 시작해 당기 보고서로 덮어쓰기 (실제 보고서 연도 우선)
        Map<Short, Bucket> merged = new TreeMap<>(derived);
        merged.putAll(current);

        return merged.entrySet().stream()
                .map(e -> e.getValue().toResponse(e.getKey()))
                .filter(r -> r.getRevenue() != null || r.getNetIncome() != null)
                .toList();
    }

    /** 한 회계연도의 주요 계정을 모으는 누적 버킷. */
    private static final class Bucket {
        Long revenue, operatingIncome, netIncome, totalAssets, totalEquity, eps;

        void apply(String id, String name, Long amount) {
            if (amount == null) return;

            // account_id 우선 매핑
            if (revenue == null && id != null && REVENUE_IDS.contains(id)) revenue = amount;
            else if (operatingIncome == null && id != null && OPERATING_INCOME_IDS.contains(id)) operatingIncome = amount;
            else if (netIncome == null && id != null && NET_INCOME_IDS.contains(id)) netIncome = amount;
            else if (totalAssets == null && id != null && TOTAL_ASSETS_IDS.contains(id)) totalAssets = amount;
            else if (totalEquity == null && id != null && TOTAL_EQUITY_IDS.contains(id)) totalEquity = amount;
            else if (eps == null && id != null && EPS_IDS.contains(id)) eps = amount;

            // account_id 매핑 실패 시 account_name fallback (collector 와 동일 규칙)
            if (name == null) return;
            if (revenue == null && name.contains("매출액")) revenue = amount;
            if (operatingIncome == null && name.contains("영업이익")) operatingIncome = amount;
            if (netIncome == null && (name.equals("당기순이익") || name.equals("당기순이익(손실)"))) netIncome = amount;
            if (totalAssets == null && name.equals("자산총계")) totalAssets = amount;
            if (totalEquity == null && name.equals("자본총계")) totalEquity = amount;
        }

        FinancialTrendResponse toResponse(Short fiscalYear) {
            return new FinancialTrendResponse(
                    fiscalYear, revenue, operatingIncome, netIncome, totalAssets, totalEquity, eps,
                    pct(operatingIncome, revenue),
                    pct(netIncome, revenue),
                    pct(netIncome, totalEquity)
            );
        }

        /** a * 100 / b 의 null 안전 버전 (퍼센트 지표). */
        private static Double pct(Long a, Long b) {
            if (a == null || b == null || b == 0) return null;
            return Math.round(a * 10000.0 / b) / 100.0;
        }
    }
}
