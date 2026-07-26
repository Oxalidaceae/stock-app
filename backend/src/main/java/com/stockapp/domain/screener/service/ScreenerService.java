package com.stockapp.domain.screener.service;

import com.stockapp.common.response.PageResponse;
import com.stockapp.common.util.Pagination;
import com.stockapp.domain.financial.entity.FinancialMetric;
import com.stockapp.domain.financial.repository.FinancialMetricRepository;
import com.stockapp.domain.screener.dto.ScreenerRequest;
import com.stockapp.domain.screener.dto.ScreenerResponse;
import com.stockapp.domain.screener.spec.FinancialMetricSpec;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ScreenerService {

    // 정렬 허용 컬럼 화이트리스트 — FinancialMetric 의 실제 프로퍼티명만 통과시킨다.
    // 목록에 없는 값이 Sort.by() 에 들어가면 PropertyReferenceException → 500 이 되므로 방어한다.
    private static final Set<String> SORTABLE = Set.of(
            "per", "pbr", "psr", "evEbitda", "roe", "roa",
            "operatingMargin", "netMargin", "debtRatio", "currentRatio",
            "dividendYield", "dps", "eps", "bps",
            "revenue", "operatingIncome", "netIncome",
            "totalAssets", "totalEquity", "baseDate");

    private static final String DEFAULT_SORT = "per";

    private final FinancialMetricRepository metricRepository;

    public PageResponse<ScreenerResponse> screen(ScreenerRequest request) {
        Specification<FinancialMetric> spec = FinancialMetricSpec.fromRequest(request);

        String sortBy = SORTABLE.contains(request.getSortBy()) ? request.getSortBy() : DEFAULT_SORT;
        Sort sort = Sort.by(
                "desc".equalsIgnoreCase(request.getSortDir())
                        ? Sort.Direction.DESC : Sort.Direction.ASC,
                sortBy);

        PageRequest pageable = Pagination.publicPage(request.getPage(), request.getSize(), sort);

        Page<ScreenerResponse> result = metricRepository.findAll(spec, pageable)
                .map(ScreenerResponse::from);

        return PageResponse.from(result);
    }
}
