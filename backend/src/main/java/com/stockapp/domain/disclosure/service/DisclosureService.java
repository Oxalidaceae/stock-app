package com.stockapp.domain.disclosure.service;

import com.stockapp.common.response.PageResponse;
import com.stockapp.common.util.Pagination;
import com.stockapp.domain.disclosure.dto.DisclosureResponse;
import com.stockapp.domain.disclosure.repository.DisclosureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DisclosureService {

    private final DisclosureRepository disclosureRepository;

    @Cacheable(value = "disclosures", key = "'ticker:' + #ticker + ':' + #type + ':' + #page + ':' + #size")
    public PageResponse<DisclosureResponse> getByTicker(String ticker, String type, int page, int size) {
        var result = disclosureRepository.findByTickerAndType(ticker, type, Pagination.publicPage(page, size))
                .map(DisclosureResponse::from);
        return PageResponse.from(result);
    }

    @Cacheable(value = "disclosures", key = "'recent:' + #q + ':' + #page + ':' + #size")
    public PageResponse<DisclosureResponse> getRecent(String q, int page, int size) {
        var result = disclosureRepository.findAllRecent(q, Pagination.publicPage(page, size))
                .map(DisclosureResponse::from);
        return PageResponse.from(result);
    }
}
