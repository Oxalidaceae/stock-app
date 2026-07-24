package com.stockapp.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.filter.ShallowEtagHeaderFilter;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    // 운영 도메인은 APP_CORS_ALLOWED_ORIGINS 로 주입. 기본값에 운영/로컬 origin 모두 포함.
    @Value("${app.cors.allowed-origins}")
    private String[] allowedOrigins;

    private final CacheControlInterceptor cacheControlInterceptor;

    public WebConfig(CacheControlInterceptor cacheControlInterceptor) {
        this.cacheControlInterceptor = cacheControlInterceptor;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(normalizeOrigins(allowedOrigins))
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(cacheControlInterceptor).addPathPatterns("/api/**");
    }

    /**
     * 응답 본문 해시로 ETag 를 붙이고, {@code If-None-Match} 가 일치하면 304(빈 본문)로 응답한다.
     * 대시보드·소식 등 폴링성 조회에서 본문 미변경 시 전송 바이트를 없앤다.
     * (2xx GET 에만 ETag 를 부여하므로 에러 응답은 영향받지 않는다.)
     */
    @Bean
    public ShallowEtagHeaderFilter shallowEtagHeaderFilter() {
        return new ShallowEtagHeaderFilter();
    }

    /**
     * CORS origin 은 브라우저 Origin 헤더와 문자열이 정확히 일치해야 한다.
     * .env 에 " http://localhost:3000" (공백)이나 "https://jipyo.net/" (후행 슬래시)처럼
     * 쓰면 조용히 매칭에 실패하므로, 여기서 정규화해 설정 실수를 흡수한다.
     */
    static String[] normalizeOrigins(String[] origins) {
        if (origins == null) {
            return new String[0];
        }
        return Arrays.stream(origins)
                .filter(origin -> origin != null)
                .map(String::trim)
                .map(origin -> origin.endsWith("/") ? origin.substring(0, origin.length() - 1) : origin)
                .filter(origin -> !origin.isEmpty())
                .toArray(String[]::new);
    }
}
