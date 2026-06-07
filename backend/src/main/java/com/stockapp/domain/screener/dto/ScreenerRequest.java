package com.stockapp.domain.screener.dto;

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
    private String sortBy = "per";       // per, pbr, roe, dividendYield 등
    private String sortDir = "asc";      // asc, desc
    private int page = 0;
    private int size = 20;

    // 적자 종목(PER/PBR 음수) 포함 여부 — 기본은 제외하여 일반적 의미의 저평가 분석에 집중
    private boolean includeNegativeValuation = false;
}
