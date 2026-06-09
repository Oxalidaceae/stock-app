package com.stockapp.domain.status.controller;

import com.stockapp.common.response.ApiResponse;
import com.stockapp.domain.status.dto.SyncStatusResponse;
import com.stockapp.domain.status.service.SyncStatusService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/status")
@RequiredArgsConstructor
public class SyncStatusController {

    private final SyncStatusService syncStatusService;

    @GetMapping("/sync")
    public ApiResponse<List<SyncStatusResponse>> getAll() {
        return ApiResponse.success(syncStatusService.getAll());
    }
}
