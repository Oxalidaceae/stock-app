package com.stockapp.domain.guide.service;

import com.stockapp.common.exception.BusinessException;
import com.stockapp.common.exception.ErrorCode;
import com.stockapp.domain.guide.dto.GuideResponse;
import com.stockapp.domain.guide.dto.GuideSummaryResponse;
import com.stockapp.domain.guide.entity.GuideStatus;
import com.stockapp.domain.guide.repository.GuideRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GuideService {

    private final GuideRepository guideRepository;

    @Transactional(readOnly = true)
    public List<GuideSummaryResponse> getGuides() {
        return guideRepository.findByStatusOrderByPublishedAtDesc(GuideStatus.PUBLISHED)
                .stream()
                .map(GuideSummaryResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public GuideResponse getGuide(String slug) {
        return guideRepository.findBySlugAndStatus(slug, GuideStatus.PUBLISHED)
                .map(GuideResponse::from)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "가이드를 찾을 수 없습니다"));
    }
}
