package com.stockapp.common.util;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;

class ClientIpTest {

    @Test
    void cloudflareHeaderTakesPrecedence() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("CF-Connecting-IP", "203.0.113.7");
        request.addHeader("X-Forwarded-For", "198.51.100.1");
        request.setRemoteAddr("10.0.0.1");

        assertThat(ClientIp.resolve(request)).isEqualTo("203.0.113.7");
    }

    @Test
    void forwardedForUsesFirstEntryWhenNoCloudflareHeader() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-Forwarded-For", "198.51.100.1, 10.0.0.2, 10.0.0.3");
        request.setRemoteAddr("10.0.0.1");

        assertThat(ClientIp.resolve(request)).isEqualTo("198.51.100.1");
    }

    @Test
    void fallsBackToRemoteAddr() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("192.0.2.55");

        assertThat(ClientIp.resolve(request)).isEqualTo("192.0.2.55");
    }

    @Test
    void blankForwardedForFallsBackToRemoteAddr() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-Forwarded-For", "   ");
        request.setRemoteAddr("192.0.2.55");

        assertThat(ClientIp.resolve(request)).isEqualTo("192.0.2.55");
    }

    @Test
    void hashIsDeterministicAnd64HexChars() {
        String a = ClientIp.hash("203.0.113.7", "salt");
        String b = ClientIp.hash("203.0.113.7", "salt");

        assertThat(a).isEqualTo(b);
        assertThat(a).hasSize(64).matches("[0-9a-f]{64}");
    }

    @Test
    void differentSaltProducesDifferentHash() {
        assertThat(ClientIp.hash("203.0.113.7", "saltA"))
                .isNotEqualTo(ClientIp.hash("203.0.113.7", "saltB"));
    }

    @Test
    void nullIpDoesNotThrow() {
        assertThat(ClientIp.hash(null, "salt")).hasSize(64);
    }
}
