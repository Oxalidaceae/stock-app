package com.stockapp.domain.dividend.dto;

import com.stockapp.domain.dividend.entity.Dividend;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@AllArgsConstructor
public class DividendResponse implements Serializable {

    private final Long id;
    private final String ticker;
    private final String companyName;
    private final Short fiscalYear;
    private final String dividendType;
    private final LocalDate exDividendDate;
    private final LocalDate paymentDate;
    private final Integer dividendPerShare;
    private final Long totalDividend;
    private final BigDecimal dividendYield;

    public static DividendResponse from(Dividend d) {
        return new DividendResponse(
                d.getId(),
                d.getCompany().getTicker(),
                d.getCompany().getCompanyName(),
                d.getFiscalYear(),
                d.getDividendType(),
                d.getExDividendDate(),
                d.getPaymentDate(),
                d.getDividendPerShare(),
                d.getTotalDividend(),
                d.getDividendYield()
        );
    }
}
