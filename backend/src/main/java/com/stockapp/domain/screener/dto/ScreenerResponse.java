package com.stockapp.domain.screener.dto;

import com.stockapp.domain.financial.entity.FinancialMetric;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.io.Serializable;
import java.math.BigDecimal;

@Getter
@AllArgsConstructor
public class ScreenerResponse implements Serializable {

    private final String ticker;
    private final String companyName;
    private final String market;
    private final String sector;

    private final BigDecimal per;
    private final BigDecimal pbr;
    private final BigDecimal roe;
    private final BigDecimal roa;
    private final BigDecimal operatingMargin;
    private final BigDecimal debtRatio;
    private final BigDecimal dividendYield;
    private final Long eps;
    private final Long bps;
    private final Long revenue;
    private final Long netIncome;

    public static ScreenerResponse from(FinancialMetric fm) {
        return new ScreenerResponse(
                fm.getCompany().getTicker(),
                fm.getCompany().getCompanyName(),
                fm.getCompany().getMarket(),
                fm.getCompany().getSector(),
                fm.getPer(),
                fm.getPbr(),
                fm.getRoe(),
                fm.getRoa(),
                fm.getOperatingMargin(),
                fm.getDebtRatio(),
                fm.getDividendYield(),
                fm.getEps(),
                fm.getBps(),
                fm.getRevenue(),
                fm.getNetIncome()
        );
    }
}
