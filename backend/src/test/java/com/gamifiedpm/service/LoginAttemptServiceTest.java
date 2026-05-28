package com.gamifiedpm.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class LoginAttemptServiceTest {

    private LoginAttemptService service;

    @BeforeEach
    void setUp() {
        service = new LoginAttemptService();
        ReflectionTestUtils.setField(service, "maxAttempts", 3);
        ReflectionTestUtils.setField(service, "blockDurationMinutes", 15);
    }

    @Test
    void notBlocked_initially() {
        assertThat(service.isBlocked("1.2.3.4", "user@test.com")).isFalse();
    }

    @Test
    void notBlocked_belowMaxAttempts() {
        service.recordFailure("1.2.3.4", "user@test.com");
        service.recordFailure("1.2.3.4", "user@test.com");
        assertThat(service.isBlocked("1.2.3.4", "user@test.com")).isFalse();
    }

    @Test
    void blocked_afterMaxAttempts() {
        service.recordFailure("1.2.3.4", "user@test.com");
        service.recordFailure("1.2.3.4", "user@test.com");
        service.recordFailure("1.2.3.4", "user@test.com");
        assertThat(service.isBlocked("1.2.3.4", "user@test.com")).isTrue();
    }

    @Test
    void unblocked_afterSuccessfulLogin() {
        service.recordFailure("1.2.3.4", "user@test.com");
        service.recordFailure("1.2.3.4", "user@test.com");
        service.recordFailure("1.2.3.4", "user@test.com");
        assertThat(service.isBlocked("1.2.3.4", "user@test.com")).isTrue();

        service.recordSuccess("1.2.3.4", "user@test.com");
        assertThat(service.isBlocked("1.2.3.4", "user@test.com")).isFalse();
    }

    @Test
    void blockedByEmail_differentIp() {
        service.recordFailure("1.1.1.1", "user@test.com");
        service.recordFailure("2.2.2.2", "user@test.com");
        service.recordFailure("3.3.3.3", "user@test.com");

        assertThat(service.isBlocked("9.9.9.9", "user@test.com")).isTrue();
    }

    @Test
    void blockedByIp_differentEmail() {
        service.recordFailure("1.2.3.4", "a@test.com");
        service.recordFailure("1.2.3.4", "b@test.com");
        service.recordFailure("1.2.3.4", "c@test.com");

        assertThat(service.isBlocked("1.2.3.4", "new@test.com")).isTrue();
    }

    @Test
    void retryAfterSeconds_positive_whenBlocked() {
        service.recordFailure("1.2.3.4", "user@test.com");
        service.recordFailure("1.2.3.4", "user@test.com");
        service.recordFailure("1.2.3.4", "user@test.com");
        assertThat(service.getBlockedSecondsRemaining("1.2.3.4", "user@test.com")).isGreaterThan(0);
    }

    @Test
    void retryAfterSeconds_zero_whenNotBlocked() {
        assertThat(service.getBlockedSecondsRemaining("1.2.3.4", "user@test.com")).isEqualTo(0);
    }
}
