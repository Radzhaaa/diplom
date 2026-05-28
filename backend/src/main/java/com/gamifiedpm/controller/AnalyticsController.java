package com.gamifiedpm.controller;

import com.gamifiedpm.dto.response.AnalyticsDto;
import com.gamifiedpm.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Analytics", description = "Статистика и отчёты")
@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping
    public ResponseEntity<AnalyticsDto> getUserAnalytics(Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(analyticsService.getUserAnalytics(userEmail));
    }
}
