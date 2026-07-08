package com.stockapp.common.util;

import jakarta.servlet.http.HttpServletRequest;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * 요청의 실제 클라이언트 IP 추출·해시 유틸.
 * Cloudflare 터널 뒤라 CF-Connecting-IP 를 최우선으로 본다.
 */
public final class ClientIp {

    private ClientIp() {}

    public static String resolve(HttpServletRequest request) {
        String cloudflareIp = request.getHeader("CF-Connecting-IP");
        if (cloudflareIp != null && !cloudflareIp.isBlank()) {
            return cloudflareIp.trim();
        }
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    /** salt 를 섞은 SHA-256 hex. 원본 IP(PII)를 저장하지 않기 위한 단방향 해시. */
    public static String hash(String ip, String salt) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest((salt + "|" + (ip == null ? "" : ip)).getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(64);
            for (byte b : digest) {
                sb.append(Character.forDigit((b >> 4) & 0xF, 16));
                sb.append(Character.forDigit(b & 0xF, 16));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 미지원", e);
        }
    }
}
