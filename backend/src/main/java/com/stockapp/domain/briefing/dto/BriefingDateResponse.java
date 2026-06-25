package com.stockapp.domain.briefing.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.io.Serializable;
import java.time.LocalDate;

@Getter
@AllArgsConstructor
public class BriefingDateResponse implements Serializable {

    private final LocalDate date;
    private final long count;
}
