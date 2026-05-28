package com.gamifiedpm.service;

import com.gamifiedpm.security.JwtSecretValidator;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThatNoException;

class JwtSecretValidatorTest {

    private JwtSecretValidator validator() {
        return new JwtSecretValidator();
    }

    @Test
    void throws_whenSecretIsNull() {
        JwtSecretValidator v = validator();
        ReflectionTestUtils.setField(v, "secret", null);
        assertThatThrownBy(v::validate).isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("not configured");
    }

    @Test
    void throws_whenSecretIsBlank() {
        JwtSecretValidator v = validator();
        ReflectionTestUtils.setField(v, "secret", "   ");
        assertThatThrownBy(v::validate).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void throws_whenSecretIsKnownPlaceholder() {
        JwtSecretValidator v = validator();
        ReflectionTestUtils.setField(v, "secret", "your-secret-key-change-in-production-min-256-bits");
        assertThatThrownBy(v::validate).isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("placeholder");
    }

    @Test
    void throws_whenSecretIsTooShort() {
        JwtSecretValidator v = validator();
        ReflectionTestUtils.setField(v, "secret", "short");
        assertThatThrownBy(v::validate).isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("too short");
    }

    @Test
    void passes_withValidSecret() {
        JwtSecretValidator v = validator();
        ReflectionTestUtils.setField(v, "secret",
            "this-is-a-valid-secret-key-that-is-at-least-32-bytes-long-definitely");
        assertThatNoException().isThrownBy(v::validate);
    }
}
