package com.stockapp.domain.dividend.service;

import com.stockapp.domain.dividend.dto.DividendResponse;
import com.stockapp.domain.dividend.repository.DividendRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DividendService {

    private final DividendRepository dividendRepository;

    @Cacheable(value = "dividends", key = "'calendar:' + #year + ':' + #month")
    public List<DividendResponse> getCalendar(int year, int month) {
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        return dividendRepository.findByExDividendDateBetween(startDate, endDate).stream()
                .map(DividendResponse::from)
                .toList();
    }
}
