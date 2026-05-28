package com.gamifiedpm.controller;

import com.gamifiedpm.dto.response.AchievementDto;
import com.gamifiedpm.exception.ResourceNotFoundException;
import com.gamifiedpm.model.entity.User;
import com.gamifiedpm.repository.UserRepository;
import com.gamifiedpm.service.AchievementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/achievements")
@RequiredArgsConstructor
public class AchievementController {

    private final AchievementService achievementService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<AchievementDto>> getAllAchievements(Authentication authentication) {
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return ResponseEntity.ok(achievementService.getUserAchievementsWithStatus(user));
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<List<AchievementDto>> getUserAchievements(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return ResponseEntity.ok(achievementService.getUserAchievementsWithStatus(user));
    }
}
