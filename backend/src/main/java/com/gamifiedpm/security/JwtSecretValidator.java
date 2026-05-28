package com.gamifiedpm.security;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Set;

@Component
public class JwtSecretValidator {

    private static final Logger log = LoggerFactory.getLogger(JwtSecretValidator.class);

    private static final int MIN_SECRET_BYTES = 32; // 256 bits

    private static final Set<String> KNOWN_PLACEHOLDERS = Set.of(
        "your-secret-key-change-in-production-min-256-bits",
        "your_very_long_and_secure_secret_key_min_256_bits_change_this_in_production",
        "REPLACE_ME_generate_with__openssl_rand_-base64_64",
        "secret",
        "changeme",
        "password"
    );

    @Value("${app.jwt.secret}")
    private String secret;

    @PostConstruct
    public void validate() {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                "\n\n[SECURITY ERROR] JWT secret is not configured!\n" +
                "Set the JWT_SECRET environment variable.\n" +
                "Generate a secure secret with: openssl rand -base64 64\n"
            );
        }

        if (KNOWN_PLACEHOLDERS.contains(secret.trim())) {
            throw new IllegalStateException(
                "\n\n[SECURITY ERROR] JWT secret is using a known placeholder value!\n" +
                "The application refuses to start with an insecure secret.\n" +
                "Generate a secure secret with: openssl rand -base64 64\n" +
                "Then set it via JWT_SECRET environment variable.\n"
            );
        }

        int byteLength = secret.getBytes(StandardCharsets.UTF_8).length;
        if (byteLength < MIN_SECRET_BYTES) {
            throw new IllegalStateException(
                "\n\n[SECURITY ERROR] JWT secret is too short (" + byteLength + " bytes)!\n" +
                "Minimum required: " + MIN_SECRET_BYTES + " bytes (256 bits).\n" +
                "Generate a secure secret with: openssl rand -base64 64\n" +
                "Then set it via JWT_SECRET environment variable.\n"
            );
        }

        log.info("[Security] JWT secret validation passed ({} bytes)", byteLength);
    }
}