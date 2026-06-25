package com.stockapp.domain.auth.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class LoginAttemptServiceTest {

    @Test
    void blocksAfterFiveFailuresAndClearsAfterSuccess() {
        LoginAttemptService service = new LoginAttemptService();
        String loginKey = "admin|127.0.0.1";

        for (int i = 0; i < 5; i++) {
            service.recordFailure(loginKey);
        }

        assertThat(service.isBlocked(loginKey)).isTrue();

        service.clear(loginKey);

        assertThat(service.isBlocked(loginKey)).isFalse();
    }

    @Test
    void tracksDifferentClientAddressesSeparately() {
        LoginAttemptService service = new LoginAttemptService();

        for (int i = 0; i < 5; i++) {
            service.recordFailure("admin|127.0.0.1");
        }

        assertThat(service.isBlocked("admin|127.0.0.1")).isTrue();
        assertThat(service.isBlocked("admin|127.0.0.2")).isFalse();
    }
}
