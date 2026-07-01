package com.stockapp.domain.guide.controller;

import com.stockapp.common.response.ApiResponse;
import com.stockapp.domain.guide.dto.GuideResponse;
import com.stockapp.domain.guide.dto.GuideSummaryResponse;
import com.stockapp.domain.guide.service.GuideService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/guides")
@RequiredArgsConstructor
public class GuideController {

    private final GuideService guideService;

    /** 가이드 목록 — 게시된 글만. */
    @GetMapping
    public ApiResponse<List<GuideSummaryResponse>> getGuides() {
        return ApiResponse.success(guideService.getGuides());
    }

    /** 가이드 상세 — slug 기준. */
    @GetMapping("/{slug}")
    public ApiResponse<GuideResponse> getGuide(@PathVariable String slug) {
        return ApiResponse.success(guideService.getGuide(slug));
    }
}
