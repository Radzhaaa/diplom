package com.gamifiedpm.controller;

import com.gamifiedpm.dto.request.UpdateUserRoleRequest;
import com.gamifiedpm.dto.response.UserDto;
import com.gamifiedpm.model.entity.User;
import com.gamifiedpm.repository.UserRepository;
import com.gamifiedpm.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Users", description = "Профили пользователей, аватары, настройки")
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(Authentication authentication) {
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(UserDto.fromEntity(user));
    }

    @PutMapping("/me")
    public ResponseEntity<UserDto> updateCurrentUser(
            @RequestBody UserDto updateRequest,
            Authentication authentication) {
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (updateRequest.getFirstName() != null) user.setFirstName(updateRequest.getFirstName());
        if (updateRequest.getLastName() != null) user.setLastName(updateRequest.getLastName());
        if (updateRequest.getAvatarUrl() != null) user.setAvatarUrl(updateRequest.getAvatarUrl());
        if (updateRequest.getBio() != null) user.setBio(updateRequest.getBio());
        if (updateRequest.getPosition() != null) user.setPosition(updateRequest.getPosition());
        if (updateRequest.getPhone() != null) user.setPhone(updateRequest.getPhone());
        if (updateRequest.getTelegramUsername() != null) user.setTelegramUsername(updateRequest.getTelegramUsername());
        if (updateRequest.getGithubUrl() != null) user.setGithubUrl(updateRequest.getGithubUrl());
        if (updateRequest.getEmail() != null && !updateRequest.getEmail().isBlank()
                && !updateRequest.getEmail().equalsIgnoreCase(user.getEmail())) {
            if (userRepository.findByEmail(updateRequest.getEmail()).isPresent()) {
                return ResponseEntity.badRequest().build();
            }
            user.setEmail(updateRequest.getEmail());
        }

        user = userRepository.save(user);
        return ResponseEntity.ok(UserDto.fromEntity(user));
    }

    @PostMapping("/me/avatar")
    public ResponseEntity<UserDto> uploadAvatar(
            @RequestParam("avatar") MultipartFile file,
            Authentication authentication) throws IOException {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(userService.uploadAvatar(file, userEmail));
    }

    @GetMapping
    public ResponseEntity<List<UserDto>> listUsers(Authentication authentication) {
        User current = userRepository.findByEmail(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        if (current.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).build();
        }
        List<UserDto> users = userRepository.findAll().stream()
            .map(UserDto::fromEntity)
            .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @PatchMapping("/{userId}/role")
    public ResponseEntity<UserDto> updateUserRole(
            @PathVariable Long userId,
            @Valid @RequestBody UpdateUserRoleRequest request,
            Authentication authentication) {
        User current = userRepository.findByEmail(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));

        if (current.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).build();
        }

        User target = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        if (Boolean.TRUE.equals(target.getSelfRegisteredAdmin())) {
            return ResponseEntity.status(403).build();
        }

        boolean currentIsSysAdmin = Boolean.TRUE.equals(current.getSelfRegisteredAdmin());
        if (!currentIsSysAdmin) {
            boolean isSelf = current.getId().equals(target.getId());
            boolean isInvitedByMe = target.getInvitedBy() != null && current.getId().equals(target.getInvitedBy());
            if (!isSelf && !isInvitedByMe) {
                return ResponseEntity.status(403).build();
            }
        }

        target.setRole(request.getRole());
        target = userRepository.save(target);
        return ResponseEntity.ok(UserDto.fromEntity(target));
    }
}
