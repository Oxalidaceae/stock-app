package com.stockapp.domain.post.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ReactionRateLimiterTest {

    @Test
    void allowsUpToLimitThenBlocks() {
        ReactionRateLimiter limiter = new ReactionRateLimiter(3);

        assertThat(limiter.allow("1.2.3.4")).isTrue();
        assertThat(limiter.allow("1.2.3.4")).isTrue();
        assertThat(limiter.allow("1.2.3.4")).isTrue();
        assertThat(limiter.allow("1.2.3.4")).isFalse();  // 4번째부터 차단
    }

    @Test
    void tracksIpsIndependently() {
        ReactionRateLimiter limiter = new ReactionRateLimiter(1);

        assertThat(limiter.allow("1.1.1.1")).isTrue();
        assertThat(limiter.allow("1.1.1.1")).isFalse();
        assertThat(limiter.allow("2.2.2.2")).isTrue();   // 다른 IP는 별도 카운트
    }

    @Test
    void nullIpIsStillRateLimited() {
        ReactionRateLimiter limiter = new ReactionRateLimiter(1);

        assertThat(limiter.allow(null)).isTrue();
        assertThat(limiter.allow(null)).isFalse();
    }
}
