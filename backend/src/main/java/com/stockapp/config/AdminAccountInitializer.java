package com.stockapp.config;

import com.stockapp.domain.user.entity.AppUser;
import com.stockapp.domain.user.entity.UserRole;
import com.stockapp.domain.user.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Slf4j
@Component
@RequiredArgsConstructor
public class AdminAccountInitializer implements ApplicationRunner {

    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.bootstrap-admin.username:}")
    private String adminUsername;

    @Value("${app.bootstrap-admin.password:}")
    private String adminPassword;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!StringUtils.hasText(adminUsername) || !StringUtils.hasText(adminPassword)) {
            log.warn("초기 관리자 계정이 설정되지 않았습니다. ADMIN_USERNAME과 ADMIN_PASSWORD를 설정하세요.");
            return;
        }
        if (adminPassword.length() < 12) {
            throw new IllegalStateException("ADMIN_PASSWORD는 12자 이상이어야 합니다");
        }

        String normalizedUsername = adminUsername.trim().toLowerCase();
        if (userRepository.existsByUsername(normalizedUsername)) {
            log.info("초기 관리자 계정이 이미 존재합니다: {}", normalizedUsername);
            return;
        }

        userRepository.save(AppUser.create(
                normalizedUsername,
                passwordEncoder.encode(adminPassword),
                UserRole.ADMIN
        ));
        log.info("초기 관리자 계정을 생성했습니다: {}", normalizedUsername);
    }
}
