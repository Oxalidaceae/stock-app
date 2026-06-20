package com.stockapp.domain.briefing.controller;

import com.stockapp.common.response.ApiResponse;
import com.stockapp.common.response.PageResponse;
import com.stockapp.domain.briefing.dto.PolicyBriefingResponse;
import com.stockapp.domain.briefing.service.PolicyBriefingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/briefings")
@RequiredArgsConstructor
public class PolicyBriefingController {

    private final PolicyBriefingService briefingService;

    @GetMapping
    public ApiResponse<PageResponse<PolicyBriefingResponse>> getBriefings(
            @RequestParam(required = false) String ministry,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        return ApiResponse.success(briefingService.getBriefings(ministry, page, size));
    }
}
