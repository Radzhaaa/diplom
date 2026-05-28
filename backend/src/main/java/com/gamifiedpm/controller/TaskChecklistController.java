package com.gamifiedpm.controller;

import com.gamifiedpm.dto.request.CreateTaskChecklistItemRequest;
import com.gamifiedpm.dto.request.UpdateTaskChecklistItemRequest;
import com.gamifiedpm.dto.response.TaskChecklistItemDto;
import com.gamifiedpm.service.TaskChecklistService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskChecklistController {

    private final TaskChecklistService taskChecklistService;

    @PostMapping("/{taskId}/checklist")
    public ResponseEntity<TaskChecklistItemDto> addChecklistItem(
            @PathVariable Long taskId,
            @Valid @RequestBody CreateTaskChecklistItemRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(taskChecklistService.addChecklistItem(taskId, request, userEmail));
    }

    @PutMapping("/checklist/{itemId}")
    public ResponseEntity<TaskChecklistItemDto> updateChecklistItem(
            @PathVariable Long itemId,
            @Valid @RequestBody UpdateTaskChecklistItemRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(taskChecklistService.updateChecklistItem(itemId, request, userEmail));
    }

    @DeleteMapping("/checklist/{itemId}")
    public ResponseEntity<Void> deleteChecklistItem(
            @PathVariable Long itemId,
            Authentication authentication) {
        String userEmail = authentication.getName();
        taskChecklistService.deleteChecklistItem(itemId, userEmail);
        return ResponseEntity.noContent().build();
    }
}
