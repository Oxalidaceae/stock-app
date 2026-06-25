package com.stockapp.domain.auth.dto;

import com.stockapp.security.UserPrincipal;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AuthUserResponse {

    private final Long id;
    private final String username;
    private final String role;

    public static AuthUserResponse from(UserPrincipal principal) {
        return new AuthUserResponse(
                principal.getId(),
                principal.getUsername(),
                principal.getRole().name()
        );
    }
}
