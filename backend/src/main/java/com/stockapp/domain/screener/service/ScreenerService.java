package com.stockapp.domain.screener.service;

import com.stockapp.common.response.PageResponse;
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

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ScreenerService {

    private final FinancialMetricRepository metricRepository;

    public PageResponse<ScreenerResponse> screen(ScreenerRequest request) {
        Specification<FinancialMetric> spec = FinancialMetricSpec.fromRequest(request);

        Sort sort = Sort.by(
                "desc".equalsIgnoreCase(request.getSortDir())
                        ? Sort.Direction.DESC : Sort.Direction.ASC,
                request.getSortBy());

        PageRequest pageable = PageRequest.of(request.getPage(), request.getSize(), sort);

        Page<ScreenerResponse> result = metricRepository.findAll(spec, pageable)
                .map(ScreenerResponse::from);

        return PageResponse.from(result);
    }
}
