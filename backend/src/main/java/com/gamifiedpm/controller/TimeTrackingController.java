package com.gamifiedpm.controller;

import com.gamifiedpm.dto.request.LogTimeRequest;
import com.gamifiedpm.dto.response.TimeEntryDto;
import com.gamifiedpm.service.TimeTrackingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Time Tracking", description = "Учёт времени по задачам")
@RestController
@RequestMapping("/api/tasks/{taskId}/time")
@RequiredArgsConstructor
public class TimeTrackingController {

    private final TimeTrackingService timeTrackingService;

    @PostMapping("/start")
    public ResponseEntity<TimeEntryDto> startTimer(
            @PathVariable Long taskId,
            Authentication auth) {
        return ResponseEntity.ok(timeTrackingService.startTimer(taskId, auth.getName()));
    }

    @PostMapping("/stop")
    public ResponseEntity<TimeEntryDto> stopTimer(
            @PathVariable Long taskId,
            @RequestParam(required = false) String note,
            Authentication auth) {
        return ResponseEntity.ok(timeTrackingService.stopTimer(taskId, auth.getName(), note));
    }

    @PostMapping("/log")
    public ResponseEntity<TimeEntryDto> logTime(
            @PathVariable Long taskId,
            @Valid @RequestBody LogTimeRequest request,
            Authentication auth) {
        return ResponseEntity.ok(timeTrackingService.logTime(taskId, auth.getName(), request));
    }

    @DeleteMapping("/{entryId}")
    public ResponseEntity<Void> deleteEntry(
            @PathVariable Long taskId,
            @PathVariable Long entryId,
            Authentication auth) {
        timeTrackingService.deleteEntry(entryId, auth.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<TimeEntryDto>> getEntries(@PathVariable Long taskId) {
        return ResponseEntity.ok(timeTrackingService.getTaskEntries(taskId));
    }

    @GetMapping("/active")
    public ResponseEntity<TimeEntryDto> getActiveTimer(
            @PathVariable Long taskId,
            Authentication auth) {
        TimeEntryDto active = timeTrackingService.getActiveTimer(taskId, auth.getName());
        return active != null ? ResponseEntity.ok(active) : ResponseEntity.noContent().build();
    }

    @GetMapping("/total")
    public ResponseEntity<Map<String, Object>> getTotalTime(@PathVariable Long taskId) {
        return ResponseEntity.ok(timeTrackingService.getTaskTotalTime(taskId));
    }
}
