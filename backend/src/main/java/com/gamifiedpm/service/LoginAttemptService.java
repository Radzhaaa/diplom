package com.gamifiedpm.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class LoginAttemptService {

    @Value("${app.login.max-attempts:5}")
    private int maxAttempts;

    @Value("${app.login.block-duration-minutes:15}")
    private int blockDurationMinutes;

    private final Map<String, AttemptInfo> attempts = new ConcurrentHashMap<>();

    public void recordFailure(String ip, String email) {
        String ipKey = "ip:" + ip;
        String emailKey = "email:" + email.toLowerCase();
        increment(ipKey);
        increment(emailKey);
    }

    public void recordSuccess(String ip, String email) {
        attempts.remove("ip:" + ip);
        attempts.remove("email:" + email.toLowerCase());
    }

    public boolean isBlocked(String ip, String email) {
        return isKeyBlocked("ip:" + ip) || isKeyBlocked("email:" + email.toLowerCase());
    }

    public long getBlockedSecondsRemaining(String ip, String email) {
        long ipRemaining = getSecondsRemaining("ip:" + ip);
        long emailRemaining = getSecondsRemaining("email:" + email.toLowerCase());
        return Math.max(ipRemaining, emailRemaining);
    }

    private void increment(String key) {
        attempts.compute(key, (k, info) -> {
            if (info == null) {
                return new AttemptInfo(1, Instant.now());
            }
            if (Instant.now().isAfter(info.firstAttempt.plusSeconds((long) blockDurationMinutes * 60))) {
                return new AttemptInfo(1, Instant.now());
            }
            return new AttemptInfo(info.count + 1, info.firstAttempt);
        });
    }

    private boolean isKeyBlocked(String key) {
        AttemptInfo info = attempts.get(key);
        if (info == null || info.count < maxAttempts) return false;
        if (Instant.now().isAfter(info.firstAttempt.plusSeconds((long) blockDurationMinutes * 60))) {
            attempts.remove(key);
            return false;
        }
        return true;
    }

    private long getSecondsRemaining(String key) {
        AttemptInfo info = attempts.get(key);
        if (info == null || info.count < maxAttempts) return 0;
        long blockUntil = info.firstAttempt.getEpochSecond() + (long) blockDurationMinutes * 60;
        long remaining = blockUntil - Instant.now().getEpochSecond();
        return Math.max(0, remaining);
    }

    @Scheduled(fixedDelay = 1800000)
    public void cleanup() {
        Instant cutoff = Instant.now().minusSeconds((long) blockDurationMinutes * 60);
        attempts.entrySet().removeIf(e -> e.getValue().firstAttempt.isBefore(cutoff));
        log.debug("Login attempt cache cleaned, {} entries remaining", attempts.size());
    }

    private record AttemptInfo(int count, Instant firstAttempt) {}
}
