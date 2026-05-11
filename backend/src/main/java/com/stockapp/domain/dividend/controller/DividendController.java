package com.stockapp.domain.dividend.controller;

import com.stockapp.common.response.ApiResponse;
import com.stockapp.domain.dividend.dto.DividendResponse;
import com.stockapp.domain.dividend.service.DividendService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dividends")
@RequiredArgsConstructor
public class DividendController {

    private final DividendService dividendService;

    @GetMapping("/calendar")
    public ApiResponse<List<DividendResponse>> getCalendar(
            @RequestParam int year,
            @RequestParam int month) {
        return ApiResponse.success(dividendService.getCalendar(year, month));
    }
}
