package com.gamifiedpm.controller;

import com.gamifiedpm.dto.response.ProjectPermissionsDto;
import com.gamifiedpm.dto.response.TaskPermissionsDto;
import com.gamifiedpm.exception.AccessDeniedException;
import com.gamifiedpm.exception.ResourceNotFoundException;
import com.gamifiedpm.model.entity.Project;
import com.gamifiedpm.model.entity.Task;
import com.gamifiedpm.model.entity.User;
import com.gamifiedpm.repository.ProjectRepository;
import com.gamifiedpm.repository.TaskRepository;
import com.gamifiedpm.repository.UserRepository;
import com.gamifiedpm.service.PermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PermissionController {

    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final PermissionService permissionService;

    @GetMapping("/tasks/{taskId}/permissions")
    public ResponseEntity<TaskPermissionsDto> getTaskPermissions(
            @PathVariable Long taskId,
            Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        if (!permissionService.canViewProject(user, task.getProject())) {
            throw new AccessDeniedException("No access to this task");
        }
        TaskPermissionsDto dto = TaskPermissionsDto.builder()
                .canView(true)
                .canEdit(permissionService.canEditTask(user, task))
                .canDelete(permissionService.canDeleteTask(user, task))
                .canComplete(permissionService.canCompleteTask(user, task))
                .canChangeDeadline(permissionService.canChangeTaskDeadline(user, task))
                .canChangeAssignee(permissionService.canChangeTaskAssignee(user, task))
                .build();
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/projects/{projectId}/permissions")
    public ResponseEntity<ProjectPermissionsDto> getProjectPermissions(
            @PathVariable Long projectId,
            Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        if (!permissionService.canViewProject(user, project)) {
            throw new AccessDeniedException("No access to this project");
        }
        ProjectPermissionsDto dto = ProjectPermissionsDto.builder()
                .canView(true)
                .canEdit(permissionService.canEditProject(user, project))
                .canDelete(permissionService.canDeleteProject(user, project))
                .canCreateTask(permissionService.canCreateTask(user, project))
                .canManageMembers(permissionService.canManageProjectMembers(user, project))
                .build();
        return ResponseEntity.ok(dto);
    }
}
