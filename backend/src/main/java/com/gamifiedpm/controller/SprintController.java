package com.gamifiedpm.controller;

import com.gamifiedpm.dto.request.CreateSprintRequest;
import com.gamifiedpm.dto.response.SprintDto;
import com.gamifiedpm.dto.response.TaskDto;
import com.gamifiedpm.service.SprintService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Sprints", description = "Управление спринтами")
@RestController
@RequiredArgsConstructor
public class SprintController {

    private final SprintService sprintService;

    @GetMapping("/api/projects/{projectId}/sprints")
    public ResponseEntity<List<SprintDto>> getProjectSprints(
            @PathVariable Long projectId, Authentication auth) {
        return ResponseEntity.ok(sprintService.getProjectSprints(projectId, auth.getName()));
    }

    @GetMapping("/api/projects/{projectId}/sprints/active")
    public ResponseEntity<SprintDto> getActiveSprint(
            @PathVariable Long projectId, Authentication auth) {
        SprintDto active = sprintService.getActiveSprint(projectId, auth.getName());
        return active != null ? ResponseEntity.ok(active) : ResponseEntity.noContent().build();
    }

    @PostMapping("/api/projects/{projectId}/sprints")
    public ResponseEntity<SprintDto> createSprint(
            @PathVariable Long projectId,
            @Valid @RequestBody CreateSprintRequest request,
            Authentication auth) {
        return ResponseEntity.ok(sprintService.createSprint(projectId, request, auth.getName()));
    }

    @PostMapping("/api/sprints/{sprintId}/start")
    public ResponseEntity<SprintDto> startSprint(
            @PathVariable Long sprintId, Authentication auth) {
        return ResponseEntity.ok(sprintService.startSprint(sprintId, auth.getName()));
    }

    @PostMapping("/api/sprints/{sprintId}/close")
    public ResponseEntity<SprintDto> closeSprint(
            @PathVariable Long sprintId, Authentication auth) {
        return ResponseEntity.ok(sprintService.closeSprint(sprintId, auth.getName()));
    }

    @PatchMapping("/api/tasks/{taskId}/sprint")
    public ResponseEntity<TaskDto> assignTaskToSprint(
            @PathVariable Long taskId,
            @RequestParam(required = false) Long sprintId,
            Authentication auth) {
        return ResponseEntity.ok(sprintService.assignTaskToSprint(taskId, sprintId, auth.getName()));
    }
}
