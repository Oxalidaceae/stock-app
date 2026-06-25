package com.stockapp.domain.briefing.controller;

import com.stockapp.common.response.ApiResponse;
import com.stockapp.common.response.PageResponse;
import com.stockapp.domain.briefing.dto.AdminBriefingResponse;
import com.stockapp.domain.briefing.dto.UpdateBriefingEditorialRequest;
import com.stockapp.domain.briefing.entity.EditorialStatus;
import com.stockapp.domain.briefing.service.AdminBriefingService;
import com.stockapp.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/briefings")
@RequiredArgsConstructor
public class AdminBriefingController {

    private final AdminBriefingService adminBriefingService;

    @GetMapping
    public ApiResponse<PageResponse<AdminBriefingResponse>> getBriefings(
            @RequestParam(required = false) EditorialStatus status,
            @RequestParam(required = false) String ministry,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(
                adminBriefingService.getBriefings(status, ministry, q, page, size)
        );
    }

    @PutMapping("/{id}")
    public ApiResponse<AdminBriefingResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateBriefingEditorialRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(
                adminBriefingService.update(id, request, principal.getId())
        );
    }
}
