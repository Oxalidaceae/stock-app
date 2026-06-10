package com.stockapp.domain.company.dto;

import com.stockapp.domain.company.entity.Company;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.io.Serializable;
import java.time.LocalDate;

@Getter
@AllArgsConstructor
public class CompanyDetailResponse implements Serializable {

    private final Long id;
    private final String corpCode;
    private final String ticker;
    private final String companyName;
    private final String companyNameEn;
    private final String market;
    private final String sector;
    private final String industry;
    private final String ceoName;
    private final LocalDate listingDate;
    private final Short fiscalMonth;
    private final String homepage;

    public static CompanyDetailResponse from(Company company) {
        return new CompanyDetailResponse(
                company.getId(),
                company.getCorpCode(),
                company.getTicker(),
                company.getCompanyName(),
                company.getCompanyNameEn(),
                company.getMarket(),
                company.getSector(),
                company.getIndustry(),
                company.getCeoName(),
                company.getListingDate(),
                company.getFiscalMonth(),
                company.getHomepage()
        );
    }
}
