package com.stockapp.domain.briefing.controller;

import com.stockapp.common.response.ApiResponse;
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

    /** 선택한 날짜의 소식 목록. */
    @GetMapping
    public ApiResponse<List<PolicyBriefingResponse>> getBriefings(
            @RequestParam(required = false) String ministry,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ApiResponse.success(briefingService.getBriefingsByDate(ministry, date));
    }
}
