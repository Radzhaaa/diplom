package com.gamifiedpm.controller;

import com.gamifiedpm.dto.request.AddProjectMemberRequest;
import com.gamifiedpm.dto.request.CreateProjectRequest;
import com.gamifiedpm.dto.request.SuggestRoadmapRequest;
import com.gamifiedpm.dto.request.UpdateProjectRequest;
import com.gamifiedpm.dto.response.PageResponse;
import com.gamifiedpm.dto.response.ProjectDto;
import com.gamifiedpm.dto.response.ProjectMemberDto;
import com.gamifiedpm.dto.response.SuggestedMilestoneDto;
import com.gamifiedpm.dto.response.UserDto;
import com.gamifiedpm.model.entity.Project;
import com.gamifiedpm.model.entity.ProjectMember;
import com.gamifiedpm.model.entity.User;
import com.gamifiedpm.repository.ProjectRepository;
import com.gamifiedpm.repository.UserRepository;
import com.gamifiedpm.service.AiAgentService;
import com.gamifiedpm.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "Projects", description = "Управление проектами и участниками")
@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;
    private final AiAgentService aiAgentService;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getUserProjects(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "0") int size) {
        String userEmail = authentication.getName();
        if (size > 0) {
            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            Long orgId = (user.getOrganization() != null) ? user.getOrganization().getId() : null;
            PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<ProjectDto> paged = projectRepository.findUserProjectsPaged(user, orgId, pageable)
                    .map(ProjectDto::fromEntity);
            return ResponseEntity.ok(PageResponse.of(paged));
        }
        return ResponseEntity.ok(projectService.getUserProjects(userEmail));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectDto> getProject(@PathVariable Long id, Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(projectService.getProjectById(id, userEmail));
    }

    @GetMapping("/{id}/members/roles")
    public ResponseEntity<List<ProjectMemberDto>> getProjectMembersWithRoles(
            @PathVariable Long id, Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(projectService.getProjectMembersWithRoles(id, userEmail));
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<List<UserDto>> getProjectMembers(@PathVariable Long id, Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(projectService.getProjectMembers(id, userEmail));
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<ProjectMemberDto> addProjectMember(
            @PathVariable Long id,
            @Valid @RequestBody AddProjectMemberRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        Long userId = request.getUserId();
        if (userId == null && request.getEmail() != null) {
            userId = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Пользователь с email " + request.getEmail() + " не найден"))
                .getId();
        }
        if (userId == null) {
            throw new IllegalArgumentException("Укажите userId или email участника");
        }
        ProjectMember.ProjectRole role = request.getRole() != null
            ? request.getRole() : ProjectMember.ProjectRole.DEVELOPER;
        return ResponseEntity.ok(projectService.addProjectMember(id, userId, role, userEmail));
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<Void> removeProjectMember(
            @PathVariable Long id,
            @PathVariable Long userId,
            Authentication authentication) {
        String userEmail = authentication.getName();
        projectService.removeProjectMember(id, userId, userEmail);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/members/{userId}/role")
    public ResponseEntity<ProjectMemberDto> updateMemberRole(
            @PathVariable Long id,
            @PathVariable Long userId,
            @RequestParam ProjectMember.ProjectRole role,
            Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(projectService.updateMemberRole(id, userId, role, userEmail));
    }

    @PostMapping("/{id}/invite-link")
    public ResponseEntity<Map<String, Object>> generateInviteLink(
            @PathVariable Long id, Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(projectService.generateInviteLink(id, userEmail));
    }

    @PostMapping("/join/{token}")
    public ResponseEntity<ProjectMemberDto> joinByInviteLink(
            @PathVariable String token, Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(projectService.joinByInviteLink(token, userEmail));
    }

    @PostMapping
    public ResponseEntity<ProjectDto> createProject(
            @Valid @RequestBody CreateProjectRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(projectService.createProject(request, userEmail));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProjectDto> updateProject(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProjectRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(projectService.updateProject(id, request, userEmail));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id, Authentication authentication) {
        String userEmail = authentication.getName();
        projectService.deleteProject(id, userEmail);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/deleted")
    public ResponseEntity<List<ProjectDto>> getDeletedProjects(Authentication authentication) {
        return ResponseEntity.ok(projectService.getDeletedProjects(authentication.getName()));
    }

    @PostMapping("/{id}/restore")
    public ResponseEntity<ProjectDto> restoreProject(@PathVariable Long id, Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(projectService.restoreProject(id, userEmail));
    }

    @PostMapping("/{id}/ai/suggest-roadmap")
    public ResponseEntity<List<SuggestedMilestoneDto>> suggestRoadmap(
            @PathVariable Long id,
            @RequestBody(required = false) SuggestRoadmapRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        String projectDescription = request != null ? request.getProjectDescription() : null;
        return ResponseEntity.ok(aiAgentService.suggestRoadmap(id, projectDescription, userEmail));
    }
}
