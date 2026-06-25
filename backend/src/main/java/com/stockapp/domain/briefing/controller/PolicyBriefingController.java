package com.stockapp.domain.briefing.controller;

import com.stockapp.common.response.ApiResponse;
import com.stockapp.common.response.PageResponse;
import com.stockapp.domain.briefing.dto.BriefingDateResponse;
import com.stockapp.domain.briefing.dto.PolicyBriefingResponse;
import com.stockapp.domain.briefing.service.PolicyBriefingService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/briefings")
@RequiredArgsConstructor
public class PolicyBriefingController {

    private final PolicyBriefingService briefingService;

    /** 날짜 탭 목록 (날짜 + 건수). */
    @GetMapping("/dates")
    public ApiResponse<List<BriefingDateResponse>> getDates(
            @RequestParam(required = false) String ministry) {
        return ApiResponse.success(briefingService.getDates(ministry));
    }

    /** 소식 목록 — date 지정 시 그 날짜만, 미지정 시 전체(최근순). */
    @GetMapping
    public ApiResponse<PageResponse<PolicyBriefingResponse>> getBriefings(
            @RequestParam(required = false) String ministry,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(defaultValue = "false") boolean curatedOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        return ApiResponse.success(briefingService.getBriefings(ministry, date, curatedOnly, page, size));
    }
}
