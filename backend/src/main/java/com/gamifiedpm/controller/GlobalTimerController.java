package com.gamifiedpm.controller;

import com.gamifiedpm.dto.response.TimeEntryDto;
import com.gamifiedpm.service.TimeTrackingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/time")
@RequiredArgsConstructor
public class GlobalTimerController {

    private final TimeTrackingService timeTrackingService;

    @GetMapping("/active")
    public ResponseEntity<TimeEntryDto> getGlobalActiveTimer(Authentication auth) {
        TimeEntryDto active = timeTrackingService.getGlobalActiveTimer(auth.getName());
        return active != null ? ResponseEntity.ok(active) : ResponseEntity.noContent().build();
    }
}
