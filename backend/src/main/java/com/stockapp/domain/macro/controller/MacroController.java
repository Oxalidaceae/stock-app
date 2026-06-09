package com.stockapp.domain.macro.controller;

import com.stockapp.common.response.ApiResponse;
import com.stockapp.domain.macro.dto.MacroKeystatResponse;
import com.stockapp.domain.macro.service.MacroKeystatService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/macro")
@RequiredArgsConstructor
public class MacroController {

    private final MacroKeystatService macroKeystatService;

    @GetMapping("/keystats")
    public ApiResponse<List<MacroKeystatResponse>> getKeystats() {
        return ApiResponse.success(macroKeystatService.getAll());
    }
}
