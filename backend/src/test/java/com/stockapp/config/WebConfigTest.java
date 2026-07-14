package com.stockapp.config;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class WebConfigTest {

    @Test
    void trimsWhitespaceAndTrailingSlash() {
        String[] result = WebConfig.normalizeOrigins(new String[]{
                "https://jipyo.net",
                " http://localhost:3000",     // 쉼표 뒤 공백
                "https://www.jipyo.net/",     // 후행 슬래시
        });

        assertThat(result).containsExactly(
                "https://jipyo.net",
                "http://localhost:3000",
                "https://www.jipyo.net"
        );
    }

    @Test
    void dropsEmptyEntries() {
        String[] result = WebConfig.normalizeOrigins(new String[]{
                "https://jipyo.net",
                "  ",     // 공백만
                "/",      // 슬래시만 → 빈 값
        });

        assertThat(result).containsExactly("https://jipyo.net");
    }

    @Test
    void handlesNullInput() {
        assertThat(WebConfig.normalizeOrigins(null)).isEmpty();
    }
}
