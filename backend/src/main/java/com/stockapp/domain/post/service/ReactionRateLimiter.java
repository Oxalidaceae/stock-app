package com.stockapp.domain.post.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 따봉/비추 엔드포인트의 IP 기준 요청 속도 제한 (고정 1분 창).
 * 인메모리(단일 인스턴스 운영)라 LoginAttemptService 와 같은 방식.
 */
@Service
public class ReactionRateLimiter {

    private static final Duration WINDOW = Duration.ofMinutes(1);
    private static final int CLEANUP_THRESHOLD = 10_000;

    private final int maxPerWindow;
    private final Map<String, Window> counters = new ConcurrentHashMap<>();

    public ReactionRateLimiter(@Value("${app.reaction.rate-limit-per-minute:30}") int maxPerMinute) {
        this.maxPerWindow = maxPerMinute;
    }

    /** 허용되면 true, 한도 초과면 false. */
    public boolean allow(String ip) {
        String key = ip == null ? "" : ip;
        Instant now = Instant.now();

        // IP 가 많아지면 만료된 항목 정리 (메모리 무한 증가 방지)
        if (counters.size() > CLEANUP_THRESHOLD) {
            counters.entrySet().removeIf(e -> now.isAfter(e.getValue().resetAt));
        }

        Window window = counters.compute(key, (k, existing) ->
                (existing == null || now.isAfter(existing.resetAt))
                        ? new Window(now.plus(WINDOW))
                        : existing);

        return window.count.incrementAndGet() <= maxPerWindow;
    }

    private static final class Window {
        private final Instant resetAt;
        private final AtomicInteger count = new AtomicInteger(0);

        private Window(Instant resetAt) {
            this.resetAt = resetAt;
        }
    }
}
