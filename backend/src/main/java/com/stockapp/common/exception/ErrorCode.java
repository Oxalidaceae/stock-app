package com.stockapp.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    // 공통
    NOT_FOUND(HttpStatus.NOT_FOUND, "리소스를 찾을 수 없습니다"),
    INVALID_PARAMETER(HttpStatus.BAD_REQUEST, "잘못된 요청 파라미터입니다"),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 내부 오류가 발생했습니다"),

    // Company
    COMPANY_NOT_FOUND(HttpStatus.NOT_FOUND, "기업을 찾을 수 없습니다"),

    // Stock
    STOCK_PRICE_NOT_FOUND(HttpStatus.NOT_FOUND, "주가 데이터를 찾을 수 없습니다"),

    // Disclosure
    DISCLOSURE_NOT_FOUND(HttpStatus.NOT_FOUND, "공시를 찾을 수 없습니다"),

    // Financial
    FINANCIAL_NOT_FOUND(HttpStatus.NOT_FOUND, "재무 데이터를 찾을 수 없습니다"),

    // Economic
    INDICATOR_NOT_FOUND(HttpStatus.NOT_FOUND, "경제지표를 찾을 수 없습니다");

    private final HttpStatus status;
    private final String message;

    ErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }
}
