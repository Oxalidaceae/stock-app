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

    @Test
    void rejectsPubliclyKnownSecrets() {
        // 길이 검증(32바이트)은 통과하지만 저장소에 공개된 값들 — 반드시 거부되어야 한다
        assertThatThrownBy(() -> new JwtTokenService("default-dev-secret-change-in-production", 60_000))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new JwtTokenService("replace-with-at-least-32-random-characters", 60_000))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
