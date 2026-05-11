package com.stockapp.domain.company.controller;

import com.stockapp.common.response.ApiResponse;
import com.stockapp.domain.company.dto.CompanyDetailResponse;
import com.stockapp.domain.company.dto.CompanySearchResponse;
import com.stockapp.domain.company.service.CompanyService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/companies")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyService companyService;

    @GetMapping("/search")
    public ApiResponse<List<CompanySearchResponse>> search(
            @RequestParam String q,
            @RequestParam(required = false) String market) {
        return ApiResponse.success(companyService.search(q, market));
    }

    @GetMapping("/{ticker}")
    public ApiResponse<CompanyDetailResponse> getByTicker(@PathVariable String ticker) {
        return ApiResponse.success(companyService.getByTicker(ticker));
    }
}
