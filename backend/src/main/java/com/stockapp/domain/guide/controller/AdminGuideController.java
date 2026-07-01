package com.stockapp.domain.guide.controller;

import com.stockapp.common.response.ApiResponse;
import com.stockapp.common.response.PageResponse;
import com.stockapp.domain.guide.dto.AdminGuideResponse;
import com.stockapp.domain.guide.dto.GuideRequest;
import com.stockapp.domain.guide.entity.GuideStatus;
import com.stockapp.domain.guide.service.AdminGuideService;
import com.stockapp.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/guides")
@RequiredArgsConstructor
public class AdminGuideController {

    private final AdminGuideService adminGuideService;

    @GetMapping
    public ApiResponse<PageResponse<AdminGuideResponse>> getGuides(
            @RequestParam(required = false) GuideStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(adminGuideService.getGuides(status, page, size));
    }

    @PostMapping
    public ApiResponse<AdminGuideResponse> create(
            @Valid @RequestBody GuideRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(adminGuideService.create(request, principal.getId()));
    }

    @PutMapping("/{id}")
    public ApiResponse<AdminGuideResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody GuideRequest request) {
        return ApiResponse.success(adminGuideService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        adminGuideService.delete(id);
        return ApiResponse.success();
    }
}
