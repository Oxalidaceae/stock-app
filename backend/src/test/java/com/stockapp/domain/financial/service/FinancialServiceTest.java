package com.stockapp.domain.financial.service;

import com.stockapp.common.exception.BusinessException;
import com.stockapp.common.exception.ErrorCode;
import com.stockapp.domain.financial.dto.FinancialTrendResponse;
import com.stockapp.domain.financial.entity.FinancialStatement;
import com.stockapp.domain.financial.repository.FinancialMetricRepository;
import com.stockapp.domain.financial.repository.FinancialStatementRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * getTrend 의 회계연도별 집계(Bucket)가 핵심 검증 대상.
 * 당기(current)뿐 아니라 전기(previous) 금액으로 직전 연도를 보강하고, 겹치면 당기가 이기는
 * 규칙 + 계정 매핑(account_id 우선, account_name 폴백) + 마진/ROE 파생 계산을 확인한다.
 */
class FinancialServiceTest {

    private FinancialStatementRepository statementRepository;
    private FinancialMetricRepository metricRepository;
    private FinancialService service;

    @BeforeEach
    void setUp() {
        statementRepository = mock(FinancialStatementRepository.class);
        metricRepository = mock(FinancialMetricRepository.class);
        service = new FinancialService(statementRepository, metricRepository);
    }

    /** FinancialStatement 는 protected 생성자 + getter 뿐이라 Mockito 스텁으로 만든다. */
    private FinancialStatement stmt(int year, String accountId, String accountName, Long current, Long previous) {
        FinancialStatement s = mock(FinancialStatement.class);
        when(s.getFiscalYear()).thenReturn((short) year);
        when(s.getAccountId()).thenReturn(accountId);
        when(s.getAccountName()).thenReturn(accountName);
        when(s.getCurrentAmount()).thenReturn(current);
        when(s.getPreviousAmount()).thenReturn(previous);
        return s;
    }

    private void givenStatements(FinancialStatement... rows) {
        when(statementRepository.findByTickerAndFilters("005930", null, "11011", "CFS"))
                .thenReturn(List.of(rows));
    }

    private List<FinancialTrendResponse> trend() {
        return service.getTrend("005930", "11011", "CFS");
    }

    @Test
    void singleYearComputesMarginsAndRoe() {
        givenStatements(
                stmt(2023, "ifrs-full_Revenue", "매출액", 1000L, null),
                stmt(2023, "dart_OperatingIncomeLoss", "영업이익", 200L, null),
                stmt(2023, "ifrs-full_ProfitLoss", "당기순이익", 100L, null),
                stmt(2023, "ifrs-full_Equity", "자본총계", 500L, null));

        List<FinancialTrendResponse> trend = trend();

        assertThat(trend).hasSize(1);
        FinancialTrendResponse row = trend.get(0);
        assertThat(row.getFiscalYear()).isEqualTo((short) 2023);
        assertThat(row.getRevenue()).isEqualTo(1000L);
        assertThat(row.getOperatingMargin()).isEqualTo(20.0);   // 200/1000
        assertThat(row.getNetMargin()).isEqualTo(10.0);         // 100/1000
        assertThat(row.getRoe()).isEqualTo(20.0);               // 100/500
    }

    @Test
    void previousAmountBackfillsPriorYearAscending() {
        givenStatements(
                stmt(2023, "ifrs-full_Revenue", "매출액", 1000L, 800L),
                stmt(2023, "ifrs-full_ProfitLoss", "당기순이익", 100L, 80L));

        List<FinancialTrendResponse> trend = trend();

        assertThat(trend).extracting(FinancialTrendResponse::getFiscalYear)
                .containsExactly((short) 2022, (short) 2023);   // 오름차순
        assertThat(trend.get(0).getRevenue()).isEqualTo(800L);  // 2022 = 전기 보강
        assertThat(trend.get(1).getRevenue()).isEqualTo(1000L); // 2023 = 당기
    }

    @Test
    void currentReportOverridesDerivedPreviousForSameYear() {
        givenStatements(
                stmt(2024, "ifrs-full_Revenue", "매출액", 1200L, 1000L), // 2023 을 1000 으로 보강
                stmt(2023, "ifrs-full_Revenue", "매출액", 1050L, null)); // 당기 2023 = 1050

        List<FinancialTrendResponse> trend = trend();

        FinancialTrendResponse y2023 = trend.stream()
                .filter(r -> r.getFiscalYear() == (short) 2023).findFirst().orElseThrow();
        assertThat(y2023.getRevenue()).isEqualTo(1050L);        // 당기가 전기보강(1000)을 덮어씀
    }

    @Test
    void accountNameFallbackWhenAccountIdUnknown() {
        givenStatements(
                stmt(2023, null, "매출액", 500L, null),
                stmt(2023, "some_unknown_id", "당기순이익", 50L, null));

        List<FinancialTrendResponse> trend = trend();

        assertThat(trend).hasSize(1);
        assertThat(trend.get(0).getRevenue()).isEqualTo(500L);
        assertThat(trend.get(0).getNetMargin()).isEqualTo(10.0);
    }

    @Test
    void yearWithoutRevenueOrNetIncomeIsFilteredOut() {
        givenStatements(stmt(2023, "ifrs-full_Assets", "자산총계", 999L, null));

        assertThat(trend()).isEmpty();
    }

    @Test
    void getMetricsThrowsWhenMissing() {
        when(metricRepository.findLatestByTicker("000000")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getMetrics("000000"))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.FINANCIAL_NOT_FOUND);
    }
}
