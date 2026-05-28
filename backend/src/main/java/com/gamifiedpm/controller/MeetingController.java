package com.gamifiedpm.controller;

import com.gamifiedpm.dto.request.CreateMeetingRequest;
import com.gamifiedpm.dto.request.UpdateAvailabilityRequest;
import com.gamifiedpm.dto.response.MeetingDto;
import com.gamifiedpm.dto.response.TaskDto;
import com.gamifiedpm.service.MeetingService;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Meetings", description = "Встречи и расписание")
@RestController
@RequiredArgsConstructor
public class MeetingController {

    private final MeetingService meetingService;


    @GetMapping("/api/projects/{projectId}/meetings")
    public ResponseEntity<List<MeetingDto>> getProjectMeetings(
            @PathVariable Long projectId,
            Authentication auth) {
        return ResponseEntity.ok(meetingService.getProjectMeetings(projectId, auth.getName()));
    }

    @GetMapping("/api/meetings/my")
    public ResponseEntity<List<MeetingDto>> getMyMeetings(Authentication auth) {
        return ResponseEntity.ok(meetingService.getMyMeetings(auth.getName()));
    }

    @PostMapping("/api/meetings")
    public ResponseEntity<MeetingDto> createMeeting(
            @Valid @RequestBody CreateMeetingRequest req,
            Authentication auth) {
        return ResponseEntity.ok(meetingService.createMeeting(req, auth.getName()));
    }

    @PatchMapping("/api/meetings/{id}/cancel")
    public ResponseEntity<MeetingDto> cancelMeeting(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(meetingService.cancelMeeting(id, auth.getName()));
    }

    @PatchMapping("/api/meetings/{id}/complete")
    public ResponseEntity<MeetingDto> completeMeeting(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(meetingService.completeMeeting(id, auth.getName()));
    }

    @DeleteMapping("/api/meetings/{id}")
    public ResponseEntity<Void> deleteMeeting(@PathVariable Long id, Authentication auth) {
        meetingService.deleteMeeting(id, auth.getName());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/meetings/{id}/generate-tasks")
    public ResponseEntity<List<TaskDto>> generateTasksFromMeeting(
            @PathVariable Long id,
            Authentication auth) {
        return ResponseEntity.ok(meetingService.generateTasksFromMeeting(id, auth.getName()));
    }


    @GetMapping("/api/availability")
    public ResponseEntity<Map<String, List<Integer>>> getMyAvailability(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart,
            Authentication auth) {
        return ResponseEntity.ok(meetingService.getMyAvailability(auth.getName(), weekStart));
    }

    @PutMapping("/api/availability")
    public ResponseEntity<Void> saveMyAvailability(
            @Valid @RequestBody UpdateAvailabilityRequest req,
            Authentication auth) {
        meetingService.saveMyAvailability(req, auth.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/projects/{projectId}/availability")
    public ResponseEntity<Map<String, Map<Integer, Integer>>> getProjectHeatmap(
            @PathVariable Long projectId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart) {
        return ResponseEntity.ok(meetingService.getProjectHeatmap(projectId, weekStart));
    }

    @GetMapping("/api/projects/{projectId}/meetings/suggest")
    public ResponseEntity<List<Map<String, Object>>> suggestMeetingSlots(
            @PathVariable Long projectId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart,
            @RequestParam(defaultValue = "60") int durationMinutes) {
        return ResponseEntity.ok(meetingService.suggestMeetingSlots(projectId, weekStart, durationMinutes));
    }
}
