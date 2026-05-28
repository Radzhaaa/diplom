package com.gamifiedpm.service;

import com.gamifiedpm.dto.request.CreateProjectRequest;
import com.gamifiedpm.exception.AccessDeniedException;
import com.gamifiedpm.model.entity.Project;
import com.gamifiedpm.model.entity.ProjectMember;
import com.gamifiedpm.model.entity.User;
import com.gamifiedpm.repository.ProjectMemberRepository;
import com.gamifiedpm.repository.ProjectRepository;
import com.gamifiedpm.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock private ProjectRepository        projectRepository;
    @Mock private UserRepository           userRepository;
    @Mock private GamificationActionService gamificationActionService;
    @Mock private PermissionService        permissionService;
    @Mock private ProjectMemberRepository  projectMemberRepository;

    @InjectMocks private ProjectService projectService;

    private User    user;
    private Project project;

    @BeforeEach
    void setUp() {
        user = User.builder()
            .id(1L).email("owner@test.com")
            .firstName("Owner").lastName("User")
            .role(User.Role.PROJECT_MANAGER)
            .build();

        project = Project.builder()
            .id(10L).name("Test Project")
            .createdBy(user)
            .status(Project.ProjectStatus.ACTIVE)
            .build();
    }


    @Test
    void createProject_success_savesProjectAndAddsOwnerMember() {
        CreateProjectRequest req = new CreateProjectRequest();
        req.setName("New Project");
        req.setDescription("A project");

        when(userRepository.findByEmail("owner@test.com")).thenReturn(Optional.of(user));
        when(permissionService.canCreateProject(user)).thenReturn(true);
        when(projectRepository.save(any(Project.class))).thenReturn(project);
        when(projectMemberRepository.save(any(ProjectMember.class))).thenReturn(null);
        doNothing().when(gamificationActionService).onProjectCreated(any(User.class), any(Project.class));

        var result = projectService.createProject(req, "owner@test.com");

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(10L);

        // Creator must be saved as OWNER
        ArgumentCaptor<ProjectMember> memberCaptor = ArgumentCaptor.forClass(ProjectMember.class);
        verify(projectMemberRepository).save(memberCaptor.capture());
        assertThat(memberCaptor.getValue().getRole()).isEqualTo(ProjectMember.ProjectRole.OWNER);
        assertThat(memberCaptor.getValue().getUser()).isEqualTo(user);
    }

    @Test
    void createProject_noPermission_throwsAccessDeniedException() {
        CreateProjectRequest req = new CreateProjectRequest();
        req.setName("Forbidden Project");

        when(userRepository.findByEmail("owner@test.com")).thenReturn(Optional.of(user));
        when(permissionService.canCreateProject(user)).thenReturn(false);

        assertThatThrownBy(() -> projectService.createProject(req, "owner@test.com"))
            .isInstanceOf(AccessDeniedException.class);

        verify(projectRepository, never()).save(any());
    }

    @Test
    void createProject_userNotFound_throwsRuntimeException() {
        CreateProjectRequest req = new CreateProjectRequest();
        req.setName("Project");

        when(userRepository.findByEmail("ghost@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> projectService.createProject(req, "ghost@test.com"))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("User not found");
    }


    @Test
    void getProjectById_success_returnsDto() {
        when(userRepository.findByEmail("owner@test.com")).thenReturn(Optional.of(user));
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(permissionService.canViewProject(user, project)).thenReturn(true);

        var result = projectService.getProjectById(10L, "owner@test.com");

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(10L);
        assertThat(result.getName()).isEqualTo("Test Project");
    }

    @Test
    void getProjectById_notFound_throwsRuntimeException() {
        when(userRepository.findByEmail("owner@test.com")).thenReturn(Optional.of(user));
        when(projectRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> projectService.getProjectById(999L, "owner@test.com"))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("Project not found");
    }

    @Test
    void getProjectById_noPermission_throwsAccessDeniedException() {
        when(userRepository.findByEmail("owner@test.com")).thenReturn(Optional.of(user));
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(permissionService.canViewProject(user, project)).thenReturn(false);

        assertThatThrownBy(() -> projectService.getProjectById(10L, "owner@test.com"))
            .isInstanceOf(AccessDeniedException.class);
    }


    @Test
    void getUserProjects_returnsProjectsForUser() {
        when(userRepository.findByEmail("owner@test.com")).thenReturn(Optional.of(user));
        when(projectRepository.findUserProjects(user, null)).thenReturn(List.of(project));

        var result = projectService.getUserProjects("owner@test.com");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Test Project");
    }

    @Test
    void getUserProjects_noProjects_returnsEmptyList() {
        when(userRepository.findByEmail("owner@test.com")).thenReturn(Optional.of(user));
        when(projectRepository.findUserProjects(user, null)).thenReturn(List.of());

        var result = projectService.getUserProjects("owner@test.com");

        assertThat(result).isEmpty();
    }


    @Test
    void createProject_setsStatusActive_byDefault() {
        CreateProjectRequest req = new CreateProjectRequest();
        req.setName("Active Project");

        when(userRepository.findByEmail("owner@test.com")).thenReturn(Optional.of(user));
        when(permissionService.canCreateProject(user)).thenReturn(true);
        when(projectMemberRepository.save(any())).thenReturn(null);
        doNothing().when(gamificationActionService).onProjectCreated(any(User.class), any(Project.class));

        ArgumentCaptor<Project> projectCaptor = ArgumentCaptor.forClass(Project.class);
        when(projectRepository.save(projectCaptor.capture())).thenReturn(project);

        projectService.createProject(req, "owner@test.com");

        assertThat(projectCaptor.getValue().getStatus()).isEqualTo(Project.ProjectStatus.ACTIVE);
    }
}
