package com.stockapp.domain.screener.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class ScreenerRequest {

    private String market;        // KOSPI, KOSDAQ

    // 밸류에이션 필터
    private BigDecimal perMin;
    private BigDecimal perMax;
    private BigDecimal pbrMin;
    private BigDecimal pbrMax;

    // 수익성 필터
    private BigDecimal roeMin;
    private BigDecimal roeMax;
    private BigDecimal operatingMarginMin;

    // 배당 필터
    private BigDecimal dividendYieldMin;

    // 안전성 필터
    private BigDecimal debtRatioMax;

    // 정렬 및 페이징
    private String sortBy = "per";       // per, pbr, roe, dividendYield 등 (서비스에서 화이트리스트 검증)
    private String sortDir = "asc";      // asc, desc
    @Min(value = 0, message = "page는 0 이상이어야 합니다")
    private int page = 0;
    @Min(value = 1, message = "size는 1 이상이어야 합니다")
    @Max(value = 50, message = "size는 50 이하여야 합니다")
    private int size = 20;

    // 적자 종목(PER/PBR 음수) 포함 여부 — 기본은 제외하여 일반적 의미의 저평가 분석에 집중
    private boolean includeNegativeValuation = false;
}
