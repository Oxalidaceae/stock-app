package com.stockapp.domain.auth.service;

import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LoginAttemptService {

    private static final int MAX_FAILURES = 5;
    private static final Duration WINDOW = Duration.ofMinutes(15);
    private static final Duration BLOCK_DURATION = Duration.ofMinutes(15);

    private final Map<String, AttemptState> attempts = new ConcurrentHashMap<>();

    public synchronized boolean isBlocked(String loginKey) {
        String key = normalize(loginKey);
        AttemptState state = attempts.get(key);
        if (state == null || state.blockedUntil == null) {
            return false;
        }
        if (Instant.now().isAfter(state.blockedUntil)) {
            attempts.remove(key);
            return false;
        }
        return true;
    }

    public synchronized void recordFailure(String loginKey) {
        String key = normalize(loginKey);
        Instant now = Instant.now();
        AttemptState state = attempts.get(key);
        if (state == null || Duration.between(state.firstFailureAt, now).compareTo(WINDOW) > 0) {
            state = new AttemptState(now);
            attempts.put(key, state);
        }
        state.failures++;
        if (state.failures >= MAX_FAILURES) {
            state.blockedUntil = now.plus(BLOCK_DURATION);
        }
    }

    public void clear(String loginKey) {
        attempts.remove(normalize(loginKey));
    }

    private String normalize(String loginKey) {
        return loginKey == null ? "" : loginKey.trim().toLowerCase();
    }

    private static class AttemptState {
        private final Instant firstFailureAt;
        private int failures;
        private Instant blockedUntil;

        private AttemptState(Instant firstFailureAt) {
            this.firstFailureAt = firstFailureAt;
        }
    }
}
