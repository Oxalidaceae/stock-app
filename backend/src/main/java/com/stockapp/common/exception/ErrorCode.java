package com.stockapp.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    // 공통
    NOT_FOUND(HttpStatus.NOT_FOUND, "리소스를 찾을 수 없습니다"),
    INVALID_PARAMETER(HttpStatus.BAD_REQUEST, "잘못된 요청 파라미터입니다"),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 내부 오류가 발생했습니다"),
    AUTH_FAILED(HttpStatus.UNAUTHORIZED, "아이디 또는 비밀번호가 올바르지 않습니다"),
    TOO_MANY_LOGIN_ATTEMPTS(HttpStatus.TOO_MANY_REQUESTS, "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요"),

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
