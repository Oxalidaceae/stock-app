package com.stockapp.domain.screener.controller;

import com.stockapp.common.response.ApiResponse;
import com.stockapp.common.response.PageResponse;
import com.stockapp.domain.screener.dto.ScreenerRequest;
import com.stockapp.domain.screener.dto.ScreenerResponse;
import com.stockapp.domain.screener.service.ScreenerService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/screener")
@RequiredArgsConstructor
public class ScreenerController {

    private final ScreenerService screenerService;

    @PostMapping
    public ApiResponse<PageResponse<ScreenerResponse>> screen(@RequestBody ScreenerRequest request) {
        return ApiResponse.success(screenerService.screen(request));
    }
}
