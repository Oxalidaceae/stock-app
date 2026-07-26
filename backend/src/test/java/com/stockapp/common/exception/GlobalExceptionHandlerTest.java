package com.stockapp.common.exception;

import com.stockapp.common.response.ApiResponse;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void businessExceptionUsesErrorCodeStatusAndMessage() {
        ResponseEntity<ApiResponse<Void>> response =
                handler.handleBusinessException(new BusinessException(ErrorCode.COMPANY_NOT_FOUND));

        assertThat(response.getStatusCode().value()).isEqualTo(404);
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).isEqualTo("기업을 찾을 수 없습니다");
    }

    @Test
    void typeMismatchReturns400WithParamName() {
        MethodArgumentTypeMismatchException ex = mock(MethodArgumentTypeMismatchException.class);
        when(ex.getName()).thenReturn("size");

        ResponseEntity<ApiResponse<Void>> response = handler.handleTypeMismatch(ex);

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(response.getBody().getMessage()).contains("size");
    }

    @Test
    void malformedBodyReturns400() {
        HttpMessageNotReadableException ex = mock(HttpMessageNotReadableException.class);
        when(ex.getMostSpecificCause()).thenReturn(new RuntimeException("broken json"));

        ResponseEntity<ApiResponse<Void>> response = handler.handleNotReadable(ex);

        assertThat(response.getStatusCode().value()).isEqualTo(400);
    }

    @Test
    void illegalArgumentReturns400() {
        ResponseEntity<ApiResponse<Void>> response =
                handler.handleIllegalArgument(new IllegalArgumentException("bad page"));

        assertThat(response.getStatusCode().value()).isEqualTo(400);
    }

    @Test
    void missingParamReturns400WithName() {
        ResponseEntity<ApiResponse<Void>> response =
                handler.handleMissingParam(new MissingServletRequestParameterException("q", "String"));

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(response.getBody().getMessage()).contains("q");
    }

    @Test
    void validationErrorReturns400WithFieldMessage() {
        BindingResult bindingResult = mock(BindingResult.class);
        when(bindingResult.getFieldErrors())
                .thenReturn(List.of(new FieldError("screenerRequest", "size", "size는 50 이하여야 합니다")));
        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        when(ex.getBindingResult()).thenReturn(bindingResult);

        ResponseEntity<ApiResponse<Void>> response = handler.handleValidationException(ex);

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(response.getBody().getMessage()).contains("size");
    }

    @Test
    void unexpectedExceptionReturns500WithGenericMessage() {
        ResponseEntity<ApiResponse<Void>> response =
                handler.handleException(new RuntimeException("boom"));

        assertThat(response.getStatusCode().value()).isEqualTo(500);
        assertThat(response.getBody().getMessage()).isEqualTo("서버 내부 오류가 발생했습니다");
    }
}
