package com.stockapp.domain.company.dto;

import com.stockapp.domain.company.entity.Company;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.io.Serializable;

@Getter
@AllArgsConstructor
public class CompanySearchResponse implements Serializable {

    private final Long id;
    private final String ticker;
    private final String companyName;
    private final String market;
    private final String sector;

    public static CompanySearchResponse from(Company company) {
        return new CompanySearchResponse(
                company.getId(),
                company.getTicker(),
                company.getCompanyName(),
                company.getMarket(),
                company.getSector()
        );
    }
}
