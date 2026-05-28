package com.gamifiedpm.controller;

import com.gamifiedpm.dto.request.LoginRequest;
import com.gamifiedpm.dto.request.RegisterRequest;
import com.gamifiedpm.dto.response.AuthResponse;
import com.gamifiedpm.dto.response.UserDto;
import com.gamifiedpm.model.entity.User;
import com.gamifiedpm.repository.UserRepository;
import com.gamifiedpm.security.JwtTokenProvider;
import com.gamifiedpm.service.AuditService;
import com.gamifiedpm.service.LoginAttemptService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.Authentication;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "Auth", description = "Регистрация, вход")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final LoginAttemptService loginAttemptService;
    private final AuditService auditService;
    private final com.gamifiedpm.service.ProjectService projectService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest()
                .body(Map.of("message", "Email уже зарегистрирован"));
        }

        boolean hasInvite = request.getInviteToken() != null && !request.getInviteToken().isBlank();
        User.Role assignedRole = hasInvite ? User.Role.MEMBER : User.Role.ADMIN;

        User user = User.builder()
            .email(request.getEmail())
            .passwordHash(passwordEncoder.encode(request.getPassword()))
            .firstName(request.getFirstName())
            .lastName(request.getLastName())
            .role(assignedRole)
            .selfRegisteredAdmin(!hasInvite)
            .level(1)
            .totalXp(0)
            .currentStreak(0)
            .emailVerified(true)
            .build();

        user = userRepository.save(user);

        if (hasInvite) {
            try {
                projectService.joinByInviteLink(request.getInviteToken(), user.getEmail());
            } catch (Exception e) {
            }
            try {
                Long creatorId = projectService.getProjectCreatorIdByInviteToken(request.getInviteToken());
                if (creatorId != null) {
                    user.setInvitedBy(creatorId);
                    userRepository.save(user);
                }
            } catch (Exception e) {
            }
        }

        String token = jwtTokenProvider.generateToken(user);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user);

        return ResponseEntity.ok(AuthResponse.builder()
            .token(token)
            .refreshToken(refreshToken)
            .user(UserDto.fromEntity(user))
            .build());
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        String ip = getClientIp(httpRequest);
        String email = request.getEmail();

        if (loginAttemptService.isBlocked(ip, email)) {
            long retryAfter = loginAttemptService.getBlockedSecondsRemaining(ip, email);
            auditService.log(email, "LOGIN_BLOCKED", "Login blocked due to too many failures", ip, false);
            return ResponseEntity.status(429)
                .header("Retry-After", String.valueOf(retryAfter))
                .body(Map.of(
                    "message", "Слишком много неудачных попыток. Попробуйте через " + (retryAfter / 60 + 1) + " мин.",
                    "retryAfterSeconds", retryAfter
                ));
        }

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            loginAttemptService.recordFailure(ip, email);
            auditService.log(email, "LOGIN_FAILURE", "Invalid credentials", ip, false);
            return ResponseEntity.status(401)
                .body(Map.of("message", "Неверный email или пароль"));
        }

        loginAttemptService.recordSuccess(ip, email);
        auditService.log(email, "LOGIN_SUCCESS", "Successful login", ip, true);

        String token = jwtTokenProvider.generateToken(user);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user);

        return ResponseEntity.ok(AuthResponse.builder()
            .token(token)
            .refreshToken(refreshToken)
            .user(UserDto.fromEntity(user))
            .build());
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");

        if (refreshToken == null || refreshToken.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        try {
            if (!jwtTokenProvider.validateToken(refreshToken)) {
                return ResponseEntity.status(401).build();
            }

            String email = jwtTokenProvider.getEmailFromToken(refreshToken);
            User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

            String newToken = jwtTokenProvider.generateToken(user);
            String newRefreshToken = jwtTokenProvider.generateRefreshToken(user);

            return ResponseEntity.ok(AuthResponse.builder()
                .token(newToken)
                .refreshToken(newRefreshToken)
                .user(UserDto.fromEntity(user))
                .build());
        } catch (Exception e) {
            return ResponseEntity.status(401).build();
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        String oldPassword = body.get("oldPassword");
        String newPassword = body.get("newPassword");
        if (oldPassword == null || newPassword == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Укажите текущий и новый пароль"));
        }
        if (newPassword.length() < 8) {
            return ResponseEntity.badRequest().body(Map.of("message", "Новый пароль должен содержать минимум 8 символов"));
        }
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Неверный текущий пароль"));
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Пароль успешно изменён"));
    }

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            String[] parts = forwarded.split(",");
            return parts[parts.length - 1].trim();
        }
        return request.getRemoteAddr();
    }
}
