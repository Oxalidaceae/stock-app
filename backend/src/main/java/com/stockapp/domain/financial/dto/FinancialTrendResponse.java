package com.stockapp.domain.financial.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.io.Serializable;

/**
 * 연도별 재무 펀더멘털 추이 1건.
 * financial_statements 를 회계연도별로 집계해 생성한다.
 * 마진/ROE 는 원본 계정에서 파생 계산한다.
 */
@Getter
@AllArgsConstructor
public class FinancialTrendResponse implements Serializable {

    private final Short fiscalYear;
    private final Long revenue;          // 매출액
    private final Long operatingIncome;  // 영업이익
    private final Long netIncome;        // 당기순이익
    private final Long totalAssets;      // 자산총계
    private final Long totalEquity;      // 자본총계
    private final Long eps;              // 주당순이익
    private final Double operatingMargin; // 영업이익률 (%)
    private final Double netMargin;       // 순이익률 (%)
    private final Double roe;             // 자기자본이익률 (%)
}
