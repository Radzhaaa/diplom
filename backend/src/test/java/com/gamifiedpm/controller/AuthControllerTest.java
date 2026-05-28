package com.gamifiedpm.controller;

import com.gamifiedpm.dto.request.LoginRequest;
import com.gamifiedpm.dto.request.RegisterRequest;
import com.gamifiedpm.dto.response.AuthResponse;
import com.gamifiedpm.model.entity.User;
import com.gamifiedpm.repository.UserRepository;
import com.gamifiedpm.security.JwtTokenProvider;
import com.gamifiedpm.service.AuditService;
import com.gamifiedpm.service.EmailVerificationService;
import com.gamifiedpm.service.LoginAttemptService;
import com.gamifiedpm.service.PasswordResetService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtTokenProvider jwtTokenProvider;
    @Mock private EmailVerificationService emailVerificationService;
    @Mock private PasswordResetService passwordResetService;
    @Mock private LoginAttemptService loginAttemptService;
    @Mock private AuditService auditService;
    @Mock private HttpServletRequest httpRequest;

    @InjectMocks
    private AuthController authController;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authController, "emailVerificationRequired", false);
    }


    @Test
    void register_returns400_whenEmailAlreadyExists() {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("existing@test.com");
        req.setPassword("Secret1!");
        req.setFirstName("Test");
        req.setLastName("User");

        given(userRepository.existsByEmail("existing@test.com")).willReturn(true);

        ResponseEntity<?> response = authController.register(req);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isInstanceOf(Map.class);
        assertThat(((Map<?, ?>) response.getBody()).get("message").toString())
                .contains("Email");
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_returns200_withToken_whenEmailIsNew() {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("new@test.com");
        req.setPassword("Secret1!");
        req.setFirstName("Alice");
        req.setLastName("Smith");

        User saved = User.builder()
                .id(1L).email("new@test.com").passwordHash("encoded")
                .firstName("Alice").lastName("Smith")
                .role(User.Role.TEAM_MEMBER).level(1).totalXp(0)
                .currentStreak(0).emailVerified(false)
                .build();

        given(userRepository.existsByEmail("new@test.com")).willReturn(false);
        given(passwordEncoder.encode("Secret1!")).willReturn("encoded");
        given(userRepository.save(any(User.class))).willReturn(saved);
        given(jwtTokenProvider.generateToken(saved)).willReturn("access-token");
        given(jwtTokenProvider.generateRefreshToken(saved)).willReturn("refresh-token");
        doNothing().when(emailVerificationService).sendVerificationEmail(any());

        ResponseEntity<?> response = authController.register(req);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isInstanceOf(AuthResponse.class);
        AuthResponse body = (AuthResponse) response.getBody();
        assertThat(body.getToken()).isEqualTo("access-token");
    }


    @Test
    void login_returns429_whenBlocked() {
        LoginRequest req = new LoginRequest();
        req.setEmail("user@test.com");
        req.setPassword("pass");

        given(httpRequest.getHeader("X-Forwarded-For")).willReturn(null);
        given(httpRequest.getRemoteAddr()).willReturn("1.2.3.4");
        given(loginAttemptService.isBlocked("1.2.3.4", "user@test.com")).willReturn(true);
        given(loginAttemptService.getBlockedSecondsRemaining("1.2.3.4", "user@test.com")).willReturn(600L);

        ResponseEntity<?> response = authController.login(req, httpRequest);

        assertThat(response.getStatusCodeValue()).isEqualTo(429);
        verify(auditService).log(eq("user@test.com"), eq("LOGIN_BLOCKED"), anyString(), eq("1.2.3.4"), eq(false));
    }

    @Test
    void login_returns401_whenUserNotFound() {
        LoginRequest req = new LoginRequest();
        req.setEmail("ghost@test.com");
        req.setPassword("pass");

        given(httpRequest.getHeader("X-Forwarded-For")).willReturn(null);
        given(httpRequest.getRemoteAddr()).willReturn("1.2.3.4");
        given(loginAttemptService.isBlocked(anyString(), anyString())).willReturn(false);
        given(userRepository.findByEmail("ghost@test.com")).willReturn(Optional.empty());

        ResponseEntity<?> response = authController.login(req, httpRequest);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verify(loginAttemptService).recordFailure("1.2.3.4", "ghost@test.com");
        verify(auditService).log(eq("ghost@test.com"), eq("LOGIN_FAILURE"), anyString(), anyString(), eq(false));
    }

    @Test
    void login_returns401_whenPasswordWrong() {
        LoginRequest req = new LoginRequest();
        req.setEmail("user@test.com");
        req.setPassword("wrongpass");

        User user = User.builder().id(1L).email("user@test.com").passwordHash("hashed").build();

        given(httpRequest.getHeader("X-Forwarded-For")).willReturn(null);
        given(httpRequest.getRemoteAddr()).willReturn("1.2.3.4");
        given(loginAttemptService.isBlocked(anyString(), anyString())).willReturn(false);
        given(userRepository.findByEmail("user@test.com")).willReturn(Optional.of(user));
        given(passwordEncoder.matches("wrongpass", "hashed")).willReturn(false);

        ResponseEntity<?> response = authController.login(req, httpRequest);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verify(loginAttemptService).recordFailure("1.2.3.4", "user@test.com");
    }

    @Test
    void login_returns200_withToken_onSuccess() {
        LoginRequest req = new LoginRequest();
        req.setEmail("user@test.com");
        req.setPassword("correctpass");

        User user = User.builder()
                .id(1L).email("user@test.com").passwordHash("hashed")
                .firstName("Bob").role(User.Role.TEAM_MEMBER)
                .level(1).totalXp(0).currentStreak(0).emailVerified(true)
                .build();

        given(httpRequest.getHeader("X-Forwarded-For")).willReturn(null);
        given(httpRequest.getRemoteAddr()).willReturn("1.2.3.4");
        given(loginAttemptService.isBlocked(anyString(), anyString())).willReturn(false);
        given(userRepository.findByEmail("user@test.com")).willReturn(Optional.of(user));
        given(passwordEncoder.matches("correctpass", "hashed")).willReturn(true);
        given(jwtTokenProvider.generateToken(user)).willReturn("jwt-access");
        given(jwtTokenProvider.generateRefreshToken(user)).willReturn("jwt-refresh");

        ResponseEntity<?> response = authController.login(req, httpRequest);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        AuthResponse body = (AuthResponse) response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.getToken()).isEqualTo("jwt-access");
        verify(loginAttemptService).recordSuccess("1.2.3.4", "user@test.com");
        verify(auditService).log(eq("user@test.com"), eq("LOGIN_SUCCESS"), anyString(), eq("1.2.3.4"), eq(true));
    }


    @Test
    void login_extractsRightmostIp_fromXForwardedFor() {
        // "1.1.1.1, 2.2.2.2, 3.3.3.3" — rightmost trusted proxy IP should be 3.3.3.3
        LoginRequest req = new LoginRequest();
        req.setEmail("user@test.com");
        req.setPassword("any");

        given(httpRequest.getHeader("X-Forwarded-For")).willReturn("1.1.1.1, 2.2.2.2, 3.3.3.3");
        given(loginAttemptService.isBlocked("3.3.3.3", "user@test.com")).willReturn(true);
        given(loginAttemptService.getBlockedSecondsRemaining("3.3.3.3", "user@test.com")).willReturn(60L);

        authController.login(req, httpRequest);

        verify(loginAttemptService).isBlocked("3.3.3.3", "user@test.com");
    }


    @Test
    void resetPassword_returns400_whenPasswordTooShort() {
        ResponseEntity<?> response = authController.resetPassword(
                Map.of("token", "tok", "password", "Ab1!"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        verify(passwordResetService, never()).resetPassword(any(), any());
    }

    @Test
    void resetPassword_returns400_whenNoUppercase() {
        ResponseEntity<?> response = authController.resetPassword(
                Map.of("token", "tok", "password", "allower123!"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void resetPassword_returns200_onSuccess() {
        given(passwordResetService.resetPassword("valid-tok", "Secure1!")).willReturn(true);

        ResponseEntity<?> response = authController.resetPassword(
                Map.of("token", "valid-tok", "password", "Secure1!"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }
}
