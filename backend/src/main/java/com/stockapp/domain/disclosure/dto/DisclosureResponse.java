package com.stockapp.domain.disclosure.dto;

import com.stockapp.domain.disclosure.entity.Disclosure;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.io.Serializable;
import java.time.LocalDate;

@Getter
@AllArgsConstructor
public class DisclosureResponse implements Serializable {

    private final Long id;
    private final String ticker;
    private final String companyName;
    private final String receptNo;
    private final String reportName;
    private final String disclosureType;
    private final LocalDate receptDate;
    private final String submitter;
    private final String dartUrl;

    public static DisclosureResponse from(Disclosure d) {
        return new DisclosureResponse(
                d.getId(),
                d.getCompany() != null ? d.getCompany().getTicker() : null,
                d.getCompany() != null ? d.getCompany().getCompanyName() : null,
                d.getReceptNo(),
                d.getReportName(),
                d.getDisclosureType(),
                d.getReceptDate(),
                d.getSubmitter(),
                d.getDartUrl()
        );
    }
}
