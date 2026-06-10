package com.stockapp.domain.disclosure.controller;

import com.stockapp.common.response.ApiResponse;
import com.stockapp.common.response.PageResponse;
import com.stockapp.domain.disclosure.dto.DisclosureResponse;
import com.stockapp.domain.disclosure.service.DisclosureService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/disclosures")
@RequiredArgsConstructor
public class DisclosureController {

    private final DisclosureService disclosureService;

    @GetMapping
    public ApiResponse<PageResponse<DisclosureResponse>> getByTicker(
            @RequestParam String ticker,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(disclosureService.getByTicker(ticker, type, page, size));
    }

    @GetMapping("/recent")
    public ApiResponse<PageResponse<DisclosureResponse>> getRecent(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(disclosureService.getRecent(q, page, size));
    }
}
