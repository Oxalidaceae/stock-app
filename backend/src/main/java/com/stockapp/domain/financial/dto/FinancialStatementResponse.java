package com.stockapp.domain.financial.dto;

import com.stockapp.domain.financial.entity.FinancialStatement;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.io.Serializable;

@Getter
@AllArgsConstructor
public class FinancialStatementResponse implements Serializable {

    private final Long id;
    private final Short fiscalYear;
    private final String reportCode;
    private final String fsDiv;
    private final String accountId;
    private final String accountName;
    private final Long currentAmount;
    private final Long previousAmount;
    private final String currency;

    public static FinancialStatementResponse from(FinancialStatement fs) {
        return new FinancialStatementResponse(
                fs.getId(),
                fs.getFiscalYear(),
                fs.getReportCode(),
                fs.getFsDiv(),
                fs.getAccountId(),
                fs.getAccountName(),
                fs.getCurrentAmount(),
                fs.getPreviousAmount(),
                fs.getCurrency()
        );
    }
}
