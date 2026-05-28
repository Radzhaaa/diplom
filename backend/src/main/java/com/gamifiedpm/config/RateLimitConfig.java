package com.gamifiedpm.config;

import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.distributed.proxy.ProxyManager;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
import java.util.function.Supplier;

@Configuration
@Slf4j
public class RateLimitConfig {

    @Value("${app.rate-limit.enabled:true}")
    private boolean rateLimitEnabled;

    @Value("${app.rate-limit.requests-per-minute:60}")
    private int requestsPerMinute;

    @Value("${spring.redis.host:localhost}")
    private String redisHost;

    @Value("${spring.redis.port:6379}")
    private int redisPort;

    @Value("${spring.redis.password:}")
    private String redisPassword;

    @Bean
    public ProxyManager<byte[]> proxyManager() {
        if (!rateLimitEnabled) {
            log.warn("Rate limiting is disabled");
            return null;
        }

        try {
            String redisUrl = redisPassword != null && !redisPassword.isEmpty()
                ? String.format("redis://:%s@%s:%d", redisPassword, redisHost, redisPort)
                : String.format("redis://%s:%d", redisHost, redisPort);

            RedisClient redisClient = RedisClient.create(redisUrl);
            StatefulRedisConnection<byte[], byte[]> connection = redisClient.connect(
                io.lettuce.core.codec.ByteArrayCodec.INSTANCE);

            return LettuceBasedProxyManager.builderFor(connection)
                .withExpirationStrategy(io.github.bucket4j.distributed.ExpirationAfterWriteStrategy
                    .basedOnTimeForRefillingBucketUpToMax(Duration.ofMinutes(1)))
                .build();
        } catch (Exception e) {
            log.error("Failed to create ProxyManager for rate limiting, rate limiting disabled", e);
            return null;
        }
    }

    @Bean
    public Supplier<BucketConfiguration> bucketConfiguration() {
        return () -> BucketConfiguration.builder()
            .addLimit(io.github.bucket4j.Bandwidth.builder()
                .capacity(requestsPerMinute)
                .refillIntervally(requestsPerMinute, Duration.ofMinutes(1))
                .build())
            .build();
    }
}
