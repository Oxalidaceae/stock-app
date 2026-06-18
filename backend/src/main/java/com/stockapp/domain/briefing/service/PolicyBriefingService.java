package com.stockapp.domain.briefing.service;

import com.stockapp.common.response.PageResponse;
import com.stockapp.domain.briefing.dto.PolicyBriefingResponse;
import com.stockapp.domain.briefing.repository.PolicyBriefingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PolicyBriefingService {

    private final PolicyBriefingRepository repository;

    public PageResponse<PolicyBriefingResponse> getBriefings(String ministry, int page, int size) {
        var result = repository.findAllByMinistry(ministry, PageRequest.of(page, size))
                .map(PolicyBriefingResponse::from);
        return PageResponse.from(result);
    }
}
