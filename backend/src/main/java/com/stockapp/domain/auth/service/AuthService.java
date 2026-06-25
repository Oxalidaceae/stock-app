package com.stockapp.domain.auth.service;

import com.stockapp.common.exception.BusinessException;
import com.stockapp.common.exception.ErrorCode;
import com.stockapp.domain.auth.dto.LoginRequest;
import com.stockapp.security.JwtTokenService;
import com.stockapp.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenService jwtTokenService;
    private final LoginAttemptService loginAttemptService;

    public LoginResult login(LoginRequest request, String clientAddress) {
        String username = request.getUsername().trim().toLowerCase();
        String loginKey = username + "|" + clientAddress;
        if (loginAttemptService.isBlocked(loginKey)) {
            throw new BusinessException(ErrorCode.TOO_MANY_LOGIN_ATTEMPTS);
        }

        try {
            var authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, request.getPassword())
            );
            UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
            loginAttemptService.clear(loginKey);
            return new LoginResult(principal, jwtTokenService.create(principal));
        } catch (AuthenticationException e) {
            loginAttemptService.recordFailure(loginKey);
            throw new BusinessException(ErrorCode.AUTH_FAILED);
        }
    }

    public record LoginResult(UserPrincipal principal, String token) {
    }
}
