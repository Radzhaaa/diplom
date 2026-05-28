package com.gamifiedpm.controller;

import com.gamifiedpm.dto.request.BulkTaskUpdateRequest;
import com.gamifiedpm.dto.request.CreateTaskRequest;
import com.gamifiedpm.dto.request.UpdateTaskRequest;
import com.gamifiedpm.dto.response.ImportResultDto;
import com.gamifiedpm.dto.response.TaskDto;
import com.gamifiedpm.dto.response.TaskHistoryDto;
import com.gamifiedpm.model.entity.Task;
import com.gamifiedpm.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@Tag(name = "Tasks", description = "Управление задачами: CRUD, статус, приоритет, зависимости")
@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @GetMapping
    public ResponseEntity<List<TaskDto>> getTasks(
            @RequestParam(required = false) Long projectId,
            Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(taskService.getUserTasks(userEmail, projectId));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<TaskDto>> searchTasks(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Task.TaskStatus status,
            @RequestParam(required = false) Task.Priority priority,
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) Long assignedToId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(taskService.searchTasks(
            userEmail, search, status, priority, projectId, assignedToId, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskDto> getTask(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(taskService.getTaskById(id, authentication.getName()));
    }

    @PostMapping
    public ResponseEntity<TaskDto> createTask(
            @Valid @RequestBody CreateTaskRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(taskService.createTask(request, userEmail));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskDto> updateTask(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTaskRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(taskService.updateTask(id, request, userEmail));
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<TaskDto> completeTask(
            @PathVariable Long id,
            Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(taskService.completeTask(id, userEmail));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id, Authentication authentication) {
        String userEmail = authentication.getName();
        taskService.deleteTask(id, userEmail);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<TaskHistoryDto>> getTaskHistory(
            @PathVariable Long id,
            Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(taskService.getTaskHistory(id, userEmail));
    }

    @PostMapping("/{id}/dependencies/{blockingId}")
    public ResponseEntity<TaskDto> addDependency(
            @PathVariable Long id, @PathVariable Long blockingId, Authentication authentication) {
        return ResponseEntity.ok(taskService.addDependency(id, blockingId, authentication.getName()));
    }

    @DeleteMapping("/{id}/dependencies/{blockingId}")
    public ResponseEntity<TaskDto> removeDependency(
            @PathVariable Long id, @PathVariable Long blockingId, Authentication authentication) {
        return ResponseEntity.ok(taskService.removeDependency(id, blockingId, authentication.getName()));
    }

    @PatchMapping("/bulk")
    public ResponseEntity<Map<String, Integer>> bulkUpdate(
            @Valid @RequestBody BulkTaskUpdateRequest request, Authentication authentication) {
        int updated = taskService.bulkUpdate(request, authentication.getName());
        return ResponseEntity.ok(Map.of("updated", updated));
    }

    @GetMapping("/archived")
    public ResponseEntity<List<TaskDto>> getArchivedTasks(Authentication authentication) {
        return ResponseEntity.ok(taskService.getArchivedTasks(authentication.getName()));
    }

    @GetMapping("/completed")
    public ResponseEntity<List<TaskDto>> getCompletedTasks(Authentication authentication) {
        return ResponseEntity.ok(taskService.getCompletedTasks(authentication.getName()));
    }

    @PostMapping("/{id}/restore")
    public ResponseEntity<TaskDto> restoreTask(@PathVariable Long id, Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(taskService.restoreTask(id, userEmail));
    }

    @PostMapping("/import")
    public ResponseEntity<ImportResultDto> importCsv(
            @RequestParam Long projectId,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        return ResponseEntity.ok(taskService.importTasksFromCsv(file, projectId, authentication.getName()));
    }
}
