package com.gamifiedpm.service;

import com.gamifiedpm.dto.request.CreateProjectRequest;
import com.gamifiedpm.dto.request.UpdateProjectRequest;
import com.gamifiedpm.dto.response.ProjectDto;
import com.gamifiedpm.dto.response.ProjectMemberDto;
import com.gamifiedpm.dto.response.UserDto;
import com.gamifiedpm.model.entity.Project;
import com.gamifiedpm.model.entity.ProjectMember;
import com.gamifiedpm.model.entity.Task;
import com.gamifiedpm.model.entity.Team;
import com.gamifiedpm.model.entity.TeamMember;
import com.gamifiedpm.model.entity.User;
import com.gamifiedpm.repository.ProjectMemberRepository;
import com.gamifiedpm.repository.ProjectRepository;
import com.gamifiedpm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final GamificationActionService gamificationActionService;
    private final PermissionService permissionService;
    private final ProjectMemberRepository projectMemberRepository;

    @Transactional(readOnly = true)
    public List<ProjectDto> getUserProjects(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        Long orgId = (user.getOrganization() != null) ? user.getOrganization().getId() : null;
        List<Project> projects = projectRepository.findUserProjects(user, orgId);
        return projects.stream()
            .map(p -> {
                ProjectDto dto = ProjectDto.fromEntity(p);
                dto.setMemberCount(projectMemberRepository.countByProject(p));
                return dto;
            })
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProjectDto getProjectById(Long projectId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new RuntimeException("Project not found"));
        
        if (!permissionService.canViewProject(user, project)) {
            throw new com.gamifiedpm.exception.AccessDeniedException("Access denied: You don't have permission to view this project");
        }
        
        return ProjectDto.fromEntity(project);
    }

    @Transactional
    public ProjectDto createProject(CreateProjectRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (!permissionService.canCreateProject(user)) {
            throw new com.gamifiedpm.exception.AccessDeniedException("Access denied: You don't have permission to create projects");
        }
        
        Project project = Project.builder()
            .name(request.getName())
            .description(request.getDescription())
            .status(Project.ProjectStatus.ACTIVE)
            .startDate(request.getStartDate() != null ? request.getStartDate().atStartOfDay() : null)
            .endDate(request.getEndDate() != null ? request.getEndDate().atStartOfDay() : null)
            .createdBy(user)
            .organization(user.getOrganization())
            .build();
        
        project = projectRepository.save(project);
        log.info("Project created: {} by user: {}", project.getId(), userEmail);

        projectMemberRepository.save(ProjectMember.builder()
            .project(project)
            .user(user)
            .role(ProjectMember.ProjectRole.OWNER)
            .build());

        try {
            gamificationActionService.onProjectCreated(user, project);
        } catch (Exception e) {
            log.error("Error processing gamification for project creation: {} by user: {}", project.getId(), userEmail, e);
        }
        return ProjectDto.fromEntity(project, 0L, 0L);
    }

    @Transactional
    public ProjectDto updateProject(Long projectId, UpdateProjectRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new RuntimeException("Project not found"));
        
        if (!permissionService.canEditProject(user, project)) {
            throw new com.gamifiedpm.exception.AccessDeniedException("Access denied: You don't have permission to edit this project");
        }
        
        if (request.getName() != null) project.setName(request.getName());
        if (request.getDescription() != null) project.setDescription(request.getDescription());
        if (request.getStatus() != null) project.setStatus(request.getStatus());
        if (request.getStartDate() != null) project.setStartDate(request.getStartDate().atStartOfDay());
        if (request.getEndDate() != null) project.setEndDate(request.getEndDate().atStartOfDay());
        
        project = projectRepository.save(project);
        return ProjectDto.fromEntity(project);
    }

    @Transactional(readOnly = true)
    public List<ProjectDto> getDeletedProjects(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return projectRepository.findDeletedUserProjects(user).stream()
            .map(ProjectDto::fromEntity)
            .collect(Collectors.toList());
    }

    @Transactional
    public void deleteProject(Long projectId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));

        Project project = projectRepository.findByIdAndDeletedAtIsNull(projectId)
            .orElseThrow(() -> new RuntimeException("Project not found"));

        if (!permissionService.canDeleteProject(user, project)) {
            throw new com.gamifiedpm.exception.AccessDeniedException("Access denied: You don't have permission to delete this project");
        }

        project.setDeletedAt(java.time.LocalDateTime.now());
        projectRepository.save(project);
        log.info("Project soft-deleted: {} by user: {}", projectId, userEmail);
    }

    @Transactional
    public ProjectDto restoreProject(Long projectId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));

        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new RuntimeException("Project not found"));

        if (project.getDeletedAt() == null) {
            throw new IllegalStateException("Project is not deleted");
        }
        if (!permissionService.canDeleteProject(user, project)) {
            throw new com.gamifiedpm.exception.AccessDeniedException("Access denied: You don't have permission to restore this project");
        }

        project.setDeletedAt(null);
        project = projectRepository.save(project);
        log.info("Project restored: {} by user: {}", projectId, userEmail);
        return ProjectDto.fromEntity(project);
    }

    @Transactional(readOnly = true)
    public List<UserDto> getProjectMembers(Long projectId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new RuntimeException("Project not found"));
        if (!permissionService.canViewProject(user, project)) {
            throw new com.gamifiedpm.exception.AccessDeniedException("Access denied: You don't have permission to view this project");
        }
        Set<Long> userIds = new LinkedHashSet<>();
        if (project.getCreatedBy() != null) {
            userIds.add(project.getCreatedBy().getId());
        }
        if (project.getTeams() != null) {
            for (Team team : project.getTeams()) {
                if (team.getMembers() != null) {
                    for (TeamMember member : team.getMembers()) {
                        if (member.getUser() != null) {
                            userIds.add(member.getUser().getId());
                        }
                    }
                }
            }
        }
        for (ProjectMember pm : projectMemberRepository.findByProjectOrderByJoinedAtAsc(project)) {
            if (pm.getUser() != null) {
                userIds.add(pm.getUser().getId());
            }
        }
        if (project.getTasks() != null) {
            for (Task task : project.getTasks()) {
                if (task.getAssignedTo() != null) userIds.add(task.getAssignedTo().getId());
                if (task.getCreatedBy() != null) userIds.add(task.getCreatedBy().getId());
            }
        }
        if (userIds.isEmpty()) {
            return new ArrayList<>();
        }
        List<User> users = userRepository.findAllById(userIds);
        return users.stream()
            .map(UserDto::fromEntity)
            .sorted(Comparator.comparing(UserDto::getLastName, Comparator.nullsLast(String::compareTo))
                .thenComparing(UserDto::getFirstName, Comparator.nullsLast(String::compareTo)))
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectMemberDto> getProjectMembersWithRoles(Long projectId, String userEmail) {
        User requester = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new RuntimeException("Project not found"));
        if (!permissionService.canViewProject(requester, project)) {
            throw new com.gamifiedpm.exception.AccessDeniedException("Access denied");
        }
        return projectMemberRepository.findByProjectOrderByJoinedAtAsc(project).stream()
            .map(ProjectMemberDto::fromEntity)
            .collect(Collectors.toList());
    }

    @Transactional
    public ProjectMemberDto addProjectMember(Long projectId, Long userId, ProjectMember.ProjectRole role, String requesterEmail) {
        User requester = userRepository.findByEmail(requesterEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new RuntimeException("Project not found"));
        if (!permissionService.canManageProjectMembers(requester, project)) {
            throw new com.gamifiedpm.exception.AccessDeniedException("Access denied: cannot manage project members");
        }
        User newMember = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        if (projectMemberRepository.existsByProjectAndUser(project, newMember)) {
            throw new IllegalStateException("User is already a member of this project");
        }
        ProjectMember member = projectMemberRepository.save(ProjectMember.builder()
            .project(project)
            .user(newMember)
            .role(role)
            .build());
        log.info("User {} added to project {} as {}", userId, projectId, role);
        return ProjectMemberDto.fromEntity(member);
    }

    @Transactional
    public void removeProjectMember(Long projectId, Long userId, String requesterEmail) {
        User requester = userRepository.findByEmail(requesterEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new RuntimeException("Project not found"));
        if (!permissionService.canManageProjectMembers(requester, project)) {
            throw new com.gamifiedpm.exception.AccessDeniedException("Access denied: cannot manage project members");
        }
        User target = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        ProjectMember membership = projectMemberRepository.findByProjectAndUser(project, target)
            .orElseThrow(() -> new RuntimeException("User is not a member of this project"));
        if (membership.getRole() == ProjectMember.ProjectRole.OWNER) {
            throw new com.gamifiedpm.exception.AccessDeniedException("Cannot remove project owner");
        }
        projectMemberRepository.delete(membership);
        log.info("User {} removed from project {}", userId, projectId);
    }

    @Transactional
    public Map<String, Object> generateInviteLink(Long projectId, String requesterEmail) {
        User requester = userRepository.findByEmail(requesterEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new RuntimeException("Project not found"));
        if (!permissionService.canManageProjectMembers(requester, project)) {
            throw new com.gamifiedpm.exception.AccessDeniedException("Access denied: cannot manage project members");
        }
        String token = UUID.randomUUID().toString();
        LocalDateTime expiresAt = LocalDateTime.now().plusDays(7);
        project.setInviteToken(token);
        project.setInviteTokenExpiresAt(expiresAt);
        projectRepository.save(project);
        log.info("Invite link generated for project {} by {}", projectId, requesterEmail);
        return Map.of("token", token, "expiresAt", expiresAt.toString(), "projectName", project.getName());
    }

    @Transactional
    public ProjectMemberDto joinByInviteLink(String token, String userEmail) {
        Project project = projectRepository.findByInviteToken(token)
            .orElseThrow(() -> new RuntimeException("Ссылка приглашения недействительна"));
        if (project.getInviteTokenExpiresAt() == null || project.getInviteTokenExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Срок действия ссылки истёк");
        }
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        if (projectMemberRepository.existsByProjectAndUser(project, user)) {
            throw new IllegalStateException("Вы уже являетесь участником этого проекта");
        }
        ProjectMember member = projectMemberRepository.save(ProjectMember.builder()
            .project(project)
            .user(user)
            .role(ProjectMember.ProjectRole.DEVELOPER)
            .build());
        log.info("User {} joined project {} via invite link", userEmail, project.getId());
        return ProjectMemberDto.fromEntity(member);
    }

    public java.util.Optional<Project> findProjectByInviteToken(String token) {
        return projectRepository.findByInviteToken(token);
    }

    @Transactional(readOnly = true)
    public Long getProjectCreatorIdByInviteToken(String token) {
        return projectRepository.findByInviteToken(token)
            .map(p -> p.getCreatedBy() != null ? p.getCreatedBy().getId() : null)
            .orElse(null);
    }

    @Transactional
    public ProjectMemberDto updateMemberRole(Long projectId, Long userId, ProjectMember.ProjectRole newRole, String requesterEmail) {
        User requester = userRepository.findByEmail(requesterEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new RuntimeException("Project not found"));
        if (!permissionService.canManageProjectMembers(requester, project)) {
            throw new com.gamifiedpm.exception.AccessDeniedException("Access denied: cannot manage project members");
        }
        User target = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        ProjectMember membership = projectMemberRepository.findByProjectAndUser(project, target)
            .orElseThrow(() -> new RuntimeException("User is not a member of this project"));
        if (membership.getRole() == ProjectMember.ProjectRole.OWNER) {
            throw new com.gamifiedpm.exception.AccessDeniedException("Cannot change owner role");
        }
        membership.setRole(newRole);
        membership = projectMemberRepository.save(membership);
        log.info("User {} role in project {} changed to {}", userId, projectId, newRole);
        return ProjectMemberDto.fromEntity(membership);
    }
}
