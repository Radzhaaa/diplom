package com.gamifiedpm.service;

import com.gamifiedpm.model.entity.Project;
import com.gamifiedpm.model.entity.ProjectMember;
import com.gamifiedpm.model.entity.Task;
import com.gamifiedpm.model.entity.TeamMember;
import com.gamifiedpm.model.entity.User;
import com.gamifiedpm.repository.ProjectMemberRepository;
import com.gamifiedpm.repository.TeamMemberRepository;
import com.gamifiedpm.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PermissionService {

    private final TeamMemberRepository teamMemberRepository;
    private final TeamRepository teamRepository;
    private final ProjectMemberRepository projectMemberRepository;

    private Optional<ProjectMember.ProjectRole> getProjectRole(User user, Project project) {
        return projectMemberRepository.findByProjectAndUser(project, user)
            .map(ProjectMember::getRole);
    }

    private boolean hasProjectRole(User user, Project project, ProjectMember.ProjectRole... roles) {
        Optional<ProjectMember.ProjectRole> role = getProjectRole(user, project);
        if (role.isEmpty()) return false;
        for (ProjectMember.ProjectRole r : roles) {
            if (role.get() == r) return true;
        }
        return false;
    }

    public boolean canCreateProject(User user) {
        return true;
    }

    public boolean canEditProject(User user, Project project) {
        if (user.getRole() == User.Role.ADMIN) return true;
        if (hasProjectRole(user, project, ProjectMember.ProjectRole.OWNER, ProjectMember.ProjectRole.MANAGER)) return true;
        if (project.getCreatedBy().getId().equals(user.getId())) return true;
        Optional<TeamMember> membership = teamMemberRepository.findByProjectAndUser(project, user);
        if (membership.isPresent() && membership.get().getRole() == TeamMember.TeamRole.LEADER) return true;
        return false;
    }

    public boolean canDeleteProject(User user, Project project) {
        if (user.getRole() == User.Role.ADMIN) return true;
        return project.getCreatedBy().getId().equals(user.getId());
    }

    public boolean canCreateTask(User user, Project project) {
        if (user.getRole() == User.Role.ADMIN) return true;
        if (hasProjectRole(user, project,
                ProjectMember.ProjectRole.OWNER,
                ProjectMember.ProjectRole.MANAGER,
                ProjectMember.ProjectRole.DEVELOPER)) return true;
        if (project.getCreatedBy().getId().equals(user.getId())) return true;
        if (teamMemberRepository.existsByProjectAndUser(project, user)) return true;
        return false;
    }

    public boolean canEditTask(User user, Task task) {
        if (user.getRole() == User.Role.ADMIN) return true;
        Project project = task.getProject();
        if (hasProjectRole(user, project, ProjectMember.ProjectRole.VIEWER)) return false;
        if (projectMemberRepository.existsByProjectAndUser(project, user)) return true;
        if (task.getCreatedBy().getId().equals(user.getId())) return true;
        if (task.getAssignedTo() != null && task.getAssignedTo().getId().equals(user.getId())) return true;
        if (project.getCreatedBy().getId().equals(user.getId())) return true;
        if (teamMemberRepository.existsByProjectAndUser(project, user)) return true;
        return false;
    }

    public boolean canCompleteTask(User user, Task task) {
        if (user.getRole() == User.Role.ADMIN) return true;
        if (task.getAssignedTo() != null && task.getAssignedTo().getId().equals(user.getId())) return true;
        if (task.getProject().getCreatedBy().getId().equals(user.getId())) return true;
        return false;
    }

    public boolean canDeleteTask(User user, Task task) {
        if (user.getRole() == User.Role.ADMIN) return true;
        if (task.getCreatedBy().getId().equals(user.getId())) return true;
        if (task.getProject().getCreatedBy().getId().equals(user.getId())) return true;
        return false;
    }

    public boolean canChangeTaskDeadline(User user, Task task) {
        return canEditTask(user, task);
    }

    public boolean canChangeTaskAssignee(User user, Task task) {
        return canEditTask(user, task);
    }

    public boolean canManageProjectMembers(User user, Project project) {
        return canEditProject(user, project);
    }

    public boolean canViewProject(User user, Project project) {
        if (user.getRole() == User.Role.ADMIN) return true;
        if (projectMemberRepository.existsByProjectAndUser(project, user)) return true;
        if (project.getCreatedBy().getId().equals(user.getId())) return true;
        if (teamMemberRepository.existsByProjectAndUser(project, user)) return true;
        if (user.getDepartment() != null && user.getOrganization() != null
            && project.getCreatedBy().getOrganization() != null
            && project.getCreatedBy().getOrganization().getId().equals(user.getOrganization().getId())) {
            if (teamRepository.existsByProjectIdAndDepartmentId(project.getId(), user.getDepartment().getId())) return true;
        }
        return false;
    }
}
