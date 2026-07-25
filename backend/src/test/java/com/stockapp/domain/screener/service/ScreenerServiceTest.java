package com.stockapp.domain.screener.service;

import com.stockapp.domain.financial.entity.FinancialMetric;
import com.stockapp.domain.financial.repository.FinancialMetricRepository;
import com.stockapp.domain.screener.dto.ScreenerRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatchers;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ScreenerServiceTest {

    private FinancialMetricRepository repository;
    private ScreenerService service;

    @BeforeEach
    void setUp() {
        repository = mock(FinancialMetricRepository.class);
        service = new ScreenerService(repository);
    }

    /** request 로 screen() 을 호출하고, 리포지토리에 실제로 넘어간 Pageable(정렬·페이징)을 잡아 돌려준다. */
    private Pageable capturePageable(ScreenerRequest request) {
        when(repository.findAll(ArgumentMatchers.<Specification<FinancialMetric>>any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        service.screen(request);

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(repository).findAll(ArgumentMatchers.<Specification<FinancialMetric>>any(), captor.capture());
        return captor.getValue();
    }

    @Test
    void invalidSortByFallsBackToPer() {
        // 화이트리스트에 없는 값(존재하지 않는 프로퍼티)을 Sort.by 에 넣으면 500 이 되므로 per 로 폴백해야 한다.
        ScreenerRequest request = new ScreenerRequest();
        request.setSortBy("garbage");

        Sort.Order order = capturePageable(request).getSort().iterator().next();

        assertThat(order.getProperty()).isEqualTo("per");
    }

    @Test
    void validSortByAndDirectionAreApplied() {
        ScreenerRequest request = new ScreenerRequest();
        request.setSortBy("roe");
        request.setSortDir("desc");

        Sort.Order order = capturePageable(request).getSort().getOrderFor("roe");

        assertThat(order).isNotNull();
        assertThat(order.getDirection()).isEqualTo(Sort.Direction.DESC);
    }

    @Test
    void oversizedPageIsClampedToPublicMax() {
        ScreenerRequest request = new ScreenerRequest();
        request.setSize(999);

        assertThat(capturePageable(request).getPageSize()).isEqualTo(50);
    }

    @Test
    void negativePageBecomesZero() {
        ScreenerRequest request = new ScreenerRequest();
        request.setPage(-1);

        assertThat(capturePageable(request).getPageNumber()).isEqualTo(0);
    }
}
