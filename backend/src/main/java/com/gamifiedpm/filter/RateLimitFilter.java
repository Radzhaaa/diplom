package com.gamifiedpm.filter;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.distributed.proxy.ProxyManager;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;
import java.util.function.Supplier;

@Component
@Order(1)
@Slf4j
public class RateLimitFilter implements Filter {

    private final ProxyManager<byte[]> proxyManager;

    @Value("${app.rate-limit.enabled:true}")
    private boolean rateLimitEnabled;

    public RateLimitFilter(
            @Autowired(required = false) ProxyManager<byte[]> proxyManager) {
        this.proxyManager = proxyManager;
    }

    @Override
    public void doFilter(jakarta.servlet.ServletRequest request,
                         jakarta.servlet.ServletResponse response,
                         FilterChain chain) throws IOException, ServletException {

        if (!rateLimitEnabled || proxyManager == null) {
            chain.doFilter(request, response);
            return;
        }

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        String path = httpRequest.getRequestURI();

        if (path.startsWith("/api/auth/")
                || path.startsWith("/actuator/")
                || path.startsWith("/swagger-ui/")
                || path.startsWith("/v3/api-docs/")) {
            chain.doFilter(request, response);
            return;
        }

        int limit;
        String clientKey;

        if (path.startsWith("/api/ai") || path.contains("/ai-chat")) {
            limit = 10;
            clientKey = "ai:" + getClientIdentifier(httpRequest);
        } else if (path.contains("/export") || path.contains("/import")) {
            limit = 5;
            clientKey = "export:" + getClientIdentifier(httpRequest);
        } else {
            String userEmail = extractEmailFromHeader(httpRequest);
            if (userEmail != null) {
                limit = 100;
                clientKey = "auth:" + userEmail;
            } else {
                limit = 20;
                clientKey = "anon:" + getIp(httpRequest);
            }
        }

        try {
            Bucket bucket = proxyManager.builder()
                    .build(clientKey.getBytes(), buildConfig(limit));

            if (bucket.tryConsume(1)) {
                long remaining = bucket.getAvailableTokens();
                httpResponse.setHeader("X-RateLimit-Limit", String.valueOf(limit));
                httpResponse.setHeader("X-RateLimit-Remaining", String.valueOf(remaining));
                chain.doFilter(request, response);
            } else {
                httpResponse.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                httpResponse.setHeader("Retry-After", "60");
                httpResponse.setHeader("X-RateLimit-Limit", String.valueOf(limit));
                httpResponse.setHeader("X-RateLimit-Remaining", "0");
                httpResponse.setContentType("application/json;charset=UTF-8");
                httpResponse.getWriter().write(
                        "{\"error\":\"Too Many Requests\"," +
                        "\"message\":\"Превышен лимит запросов. Попробуйте через 60 секунд.\"}");
                log.warn("Rate limit exceeded: client={}, path={}", clientKey, path);
            }
        } catch (Exception e) {
            log.error("Rate limit check failed, passing request through", e);
            chain.doFilter(request, response);
        }
    }

    private Supplier<BucketConfiguration> buildConfig(int limit) {
        return () -> BucketConfiguration.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(limit)
                        .refillIntervally(limit, Duration.ofMinutes(1))
                        .build())
                .build();
    }

    private String getClientIdentifier(HttpServletRequest request) {
        String email = extractEmailFromHeader(request);
        return email != null ? email : getIp(request);
    }

    private String extractEmailFromHeader(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        try {
            String token = authHeader.substring(7);
            String[] parts = token.split("\\.");
            if (parts.length < 2) return null;
            String payload = new String(java.util.Base64.getUrlDecoder().decode(parts[1]));
            int subIdx = payload.indexOf("\"sub\":\"");
            if (subIdx < 0) return null;
            int start = subIdx + 7;
            int end = payload.indexOf("\"", start);
            if (end < 0) return null;
            return payload.substring(start, end);
        } catch (Exception e) {
            return null;
        }
    }

    private String getIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            String[] parts = forwarded.split(",");
            return parts[parts.length - 1].trim();
        }
        return request.getRemoteAddr();
    }
}
