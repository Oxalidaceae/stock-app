package com.stockapp.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Set;

@Service
public class JwtTokenService {

    // 저장소에 공개된 값들 — 길이 검증(32바이트)은 통과하므로 명시적으로 거부해야 한다.
    private static final Set<String> PUBLICLY_KNOWN_SECRETS = Set.of(
            "default-dev-secret-change-in-production",    // application.yml fallback 기본값
            "replace-with-at-least-32-random-characters"  // .env.example placeholder
    );

    private final SecretKey signingKey;
    private final long expirationMs;

    public JwtTokenService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms}") long expirationMs) {
        if (secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalArgumentException("JWT_SECRET은 32바이트 이상이어야 합니다");
        }
        if (PUBLICLY_KNOWN_SECRETS.contains(secret)) {
            throw new IllegalArgumentException(
                    "JWT_SECRET이 저장소에 공개된 기본값입니다 — .env에 32자 이상 랜덤값을 설정하세요 (.env.example 참고)");
        }
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String create(UserPrincipal principal) {
        return create(principal.getId(), principal.getUsername(), principal.getRole().name());
    }

    String create(Long userId, String username, String role) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(userId.toString())
                .claim("username", username)
                .claim("role", role)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(expirationMs)))
                .signWith(signingKey)
                .compact();
    }

    public Long parseUserId(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return Long.valueOf(claims.getSubject());
    }

    public long getExpirationSeconds() {
        return expirationMs / 1000;
    }
}
