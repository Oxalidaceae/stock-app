package com.stockapp.security;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtTokenServiceTest {

    @Test
    void createsAndParsesToken() {
        JwtTokenService service = new JwtTokenService(
                "test-secret-that-is-at-least-32-bytes-long",
                60_000
        );

        String token = service.create(42L, "admin", "ADMIN");

        assertThat(service.parseUserId(token)).isEqualTo(42L);
    }

    @Test
    void rejectsShortSecret() {
        assertThatThrownBy(() -> new JwtTokenService("too-short", 60_000))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
