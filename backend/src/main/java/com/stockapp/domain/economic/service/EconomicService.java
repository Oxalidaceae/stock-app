package com.stockapp.domain.economic.service;

import com.stockapp.domain.economic.dto.EconomicIndicatorResponse;
import com.stockapp.domain.economic.repository.EconomicIndicatorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EconomicService {

    private final EconomicIndicatorRepository repository;

    @Cacheable(value = "economic", key = "'indicators-list'")
    public List<Map<String, String>> getIndicatorList() {
        return repository.findDistinctIndicators().stream()
                .map(row -> {
                    Map<String, String> map = new LinkedHashMap<>();
                    map.put("statCode", (String) row[0]);
                    map.put("statName", (String) row[1]);
                    map.put("unit", (String) row[2]);
                    return map;
                })
                .toList();
    }

    @Cacheable(value = "economic", key = "'data:' + #statCode + ':' + #start + ':' + #end")
    public List<EconomicIndicatorResponse> getTimeSeries(String statCode, String start, String end) {
        return repository.findByStatCodeAndPeriodRange(statCode, start, end).stream()
                .map(EconomicIndicatorResponse::from)
                .toList();
    }
}
