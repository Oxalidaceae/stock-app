package com.stockapp.domain.company.service;

import com.stockapp.common.exception.BusinessException;
import com.stockapp.common.exception.ErrorCode;
import com.stockapp.domain.company.dto.CompanyDetailResponse;
import com.stockapp.domain.company.dto.CompanySearchResponse;
import com.stockapp.domain.company.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CompanyService {

    private final CompanyRepository companyRepository;

    @Cacheable(value = "companies", key = "'search:' + #query + ':' + #market")
    public List<CompanySearchResponse> search(String query, String market) {
        return companyRepository.search(query, market).stream()
                .map(CompanySearchResponse::from)
                .toList();
    }

    @Cacheable(value = "companies", key = "'detail:' + #ticker")
    public CompanyDetailResponse getByTicker(String ticker) {
        return companyRepository.findByTicker(ticker)
                .map(CompanyDetailResponse::from)
                .orElseThrow(() -> new BusinessException(ErrorCode.COMPANY_NOT_FOUND));
    }
}
