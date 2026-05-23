package com.stockapp.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.support.NoOpCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RedisConfig {

    // Spring Boot 3.x + GenericJackson2JsonRedisSerializer 의 폴리모픽 직렬화 이슈로
    // Redis 캐싱은 임시 비활성화. @Cacheable 어노테이션은 그대로 둬도 NoOp으로 동작함.
    @Bean
    public CacheManager cacheManager() {
        return new NoOpCacheManager();
    }
}
