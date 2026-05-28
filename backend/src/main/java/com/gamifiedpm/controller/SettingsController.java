package com.gamifiedpm.controller;

import com.gamifiedpm.dto.request.UpdateUserSettingsRequest;
import com.gamifiedpm.dto.response.UserSettingsDto;
import com.gamifiedpm.service.SettingsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final SettingsService settingsService;

    @GetMapping
    public ResponseEntity<UserSettingsDto> getUserSettings(Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(settingsService.getUserSettings(userEmail));
    }

    @PutMapping
    public ResponseEntity<UserSettingsDto> updateUserSettings(
            @Valid @RequestBody UpdateUserSettingsRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(settingsService.updateUserSettings(request, userEmail));
    }
}
