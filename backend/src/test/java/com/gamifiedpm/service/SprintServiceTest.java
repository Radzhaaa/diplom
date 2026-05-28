package com.gamifiedpm.service;

import com.gamifiedpm.dto.request.CreateSprintRequest;
import com.gamifiedpm.dto.response.SprintDto;
import com.gamifiedpm.exception.AccessDeniedException;
import com.gamifiedpm.exception.ResourceNotFoundException;
import com.gamifiedpm.model.entity.Project;
import com.gamifiedpm.model.entity.Sprint;
import com.gamifiedpm.model.entity.User;
import com.gamifiedpm.repository.ProjectRepository;
import com.gamifiedpm.repository.SprintRepository;
import com.gamifiedpm.repository.TaskRepository;
import com.gamifiedpm.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SprintServiceTest {

    @Mock private SprintRepository sprintRepository;
    @Mock private ProjectRepository projectRepository;
    @Mock private UserRepository userRepository;
    @Mock private TaskRepository taskRepository;
    @Mock private PermissionService permissionService;
    @Mock private WebhookFireService webhookFireService;

    @InjectMocks
    private SprintService sprintService;

    private Project project;
    private User user;
    private Sprint sprint;

    @BeforeEach
    void setUp() {
        project = new Project();
        project.setId(1L);
        project.setName("Test Project");

        user = new User();
        user.setId(10L);
        user.setEmail("dev@test.com");

        sprint = Sprint.builder()
                .id(100L)
                .project(project)
                .name("Sprint 1")
                .status(Sprint.SprintStatus.PLANNED)
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusWeeks(2))
                .build();
    }


    @Test
    void getProjectSprints_returnsList_whenAuthorized() {
        given(projectRepository.findById(1L)).willReturn(Optional.of(project));
        given(userRepository.findByEmail("dev@test.com")).willReturn(Optional.of(user));
        given(permissionService.canViewProject(user, project)).willReturn(true);
        given(sprintRepository.findByProjectOrderByStartDateAsc(project)).willReturn(List.of(sprint));

        List<SprintDto> result = sprintService.getProjectSprints(1L, "dev@test.com");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Sprint 1");
    }

    @Test
    void getProjectSprints_throws_whenAccessDenied() {
        given(projectRepository.findById(1L)).willReturn(Optional.of(project));
        given(userRepository.findByEmail("dev@test.com")).willReturn(Optional.of(user));
        given(permissionService.canViewProject(user, project)).willReturn(false);

        assertThatThrownBy(() -> sprintService.getProjectSprints(1L, "dev@test.com"))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void getProjectSprints_throws_whenProjectNotFound() {
        given(projectRepository.findById(99L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> sprintService.getProjectSprints(99L, "dev@test.com"))
                .isInstanceOf(ResourceNotFoundException.class);
    }


    @Test
    void getActiveSprint_returnsNull_whenNoneActive() {
        given(projectRepository.findById(1L)).willReturn(Optional.of(project));
        given(userRepository.findByEmail("dev@test.com")).willReturn(Optional.of(user));
        given(permissionService.canViewProject(user, project)).willReturn(true);
        given(sprintRepository.findByProjectAndStatus(project, Sprint.SprintStatus.ACTIVE))
                .willReturn(Optional.empty());

        SprintDto result = sprintService.getActiveSprint(1L, "dev@test.com");

        assertThat(result).isNull();
    }

    @Test
    void getActiveSprint_returnsSprint_whenActive() {
        sprint.setStatus(Sprint.SprintStatus.ACTIVE);
        given(projectRepository.findById(1L)).willReturn(Optional.of(project));
        given(userRepository.findByEmail("dev@test.com")).willReturn(Optional.of(user));
        given(permissionService.canViewProject(user, project)).willReturn(true);
        given(sprintRepository.findByProjectAndStatus(project, Sprint.SprintStatus.ACTIVE))
                .willReturn(Optional.of(sprint));

        SprintDto result = sprintService.getActiveSprint(1L, "dev@test.com");

        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("Sprint 1");
    }


    @Test
    void createSprint_savesAndReturnsSprint() {
        CreateSprintRequest req = new CreateSprintRequest();
        req.setName("Sprint 2");
        req.setStartDate(LocalDate.now());
        req.setEndDate(LocalDate.now().plusWeeks(2));

        Sprint saved = Sprint.builder()
                .id(101L).project(project).name("Sprint 2")
                .status(Sprint.SprintStatus.PLANNED)
                .startDate(req.getStartDate()).endDate(req.getEndDate())
                .build();

        given(projectRepository.findById(1L)).willReturn(Optional.of(project));
        given(userRepository.findByEmail("dev@test.com")).willReturn(Optional.of(user));
        given(permissionService.canEditProject(user, project)).willReturn(true);
        given(sprintRepository.save(any(Sprint.class))).willReturn(saved);

        SprintDto result = sprintService.createSprint(1L, req, "dev@test.com");

        assertThat(result.getName()).isEqualTo("Sprint 2");
        assertThat(result.getStatus()).isEqualTo(Sprint.SprintStatus.PLANNED);
        verify(sprintRepository).save(any(Sprint.class));
    }

    @Test
    void createSprint_throws_whenNoEditPermission() {
        CreateSprintRequest req = new CreateSprintRequest();
        req.setName("Sprint X");

        given(projectRepository.findById(1L)).willReturn(Optional.of(project));
        given(userRepository.findByEmail("dev@test.com")).willReturn(Optional.of(user));
        given(permissionService.canEditProject(user, project)).willReturn(false);

        assertThatThrownBy(() -> sprintService.createSprint(1L, req, "dev@test.com"))
                .isInstanceOf(AccessDeniedException.class);

        verify(sprintRepository, never()).save(any());
    }


    @Test
    void startSprint_changesStatusToActive() {
        given(sprintRepository.findById(100L)).willReturn(Optional.of(sprint));
        given(userRepository.findByEmail("dev@test.com")).willReturn(Optional.of(user));
        given(permissionService.canEditProject(user, project)).willReturn(true);
        given(sprintRepository.findByProjectAndStatus(project, Sprint.SprintStatus.ACTIVE))
                .willReturn(Optional.empty());
        given(sprintRepository.save(sprint)).willReturn(sprint);

        SprintDto result = sprintService.startSprint(100L, "dev@test.com");

        assertThat(sprint.getStatus()).isEqualTo(Sprint.SprintStatus.ACTIVE);
        assertThat(result).isNotNull();
        verify(webhookFireService).fire(eq("sprint.started"), eq(1L), anyMap());
    }

    @Test
    void startSprint_throws_whenAlreadyActiveSprintExists() {
        Sprint activeSprint = Sprint.builder().id(99L).project(project)
                .name("Current Sprint").status(Sprint.SprintStatus.ACTIVE).build();

        given(sprintRepository.findById(100L)).willReturn(Optional.of(sprint));
        given(userRepository.findByEmail("dev@test.com")).willReturn(Optional.of(user));
        given(permissionService.canEditProject(user, project)).willReturn(true);
        given(sprintRepository.findByProjectAndStatus(project, Sprint.SprintStatus.ACTIVE))
                .willReturn(Optional.of(activeSprint));

        assertThatThrownBy(() -> sprintService.startSprint(100L, "dev@test.com"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("active sprint");

        verify(sprintRepository, never()).save(any());
    }


    @Test
    void closeSprint_changesStatusToClosed() {
        sprint.setStatus(Sprint.SprintStatus.ACTIVE);

        given(sprintRepository.findById(100L)).willReturn(Optional.of(sprint));
        given(userRepository.findByEmail("dev@test.com")).willReturn(Optional.of(user));
        given(permissionService.canEditProject(user, project)).willReturn(true);
        given(taskRepository.findAll()).willReturn(Collections.emptyList());
        given(sprintRepository.save(sprint)).willReturn(sprint);

        SprintDto result = sprintService.closeSprint(100L, "dev@test.com");

        assertThat(sprint.getStatus()).isEqualTo(Sprint.SprintStatus.CLOSED);
        assertThat(result).isNotNull();
        verify(webhookFireService).fire(eq("sprint.closed"), eq(1L), anyMap());
    }


    @Test
    void assignTaskToSprint_withNullSprintId_clearsSprintFromTask() {
        com.gamifiedpm.model.entity.Task task = new com.gamifiedpm.model.entity.Task();
        task.setId(200L);
        task.setTitle("Task A");
        task.setProject(project);
        task.setSprint(sprint);

        given(taskRepository.findById(200L)).willReturn(Optional.of(task));
        given(taskRepository.save(task)).willReturn(task);

        sprintService.assignTaskToSprint(200L, null, "dev@test.com");

        assertThat(task.getSprint()).isNull();
    }

    @Test
    void assignTaskToSprint_throwsWhenSprintProjectMismatch() {
        Project otherProject = new Project();
        otherProject.setId(999L);

        Sprint otherSprint = Sprint.builder().id(200L).project(otherProject)
                .name("Other Sprint").status(Sprint.SprintStatus.PLANNED).build();

        com.gamifiedpm.model.entity.Task task = new com.gamifiedpm.model.entity.Task();
        task.setId(200L);
        task.setTitle("Task A");
        task.setProject(project); // task belongs to project 1

        given(taskRepository.findById(200L)).willReturn(Optional.of(task));
        given(sprintRepository.findById(200L)).willReturn(Optional.of(otherSprint)); // sprint belongs to project 999

        assertThatThrownBy(() -> sprintService.assignTaskToSprint(200L, 200L, "dev@test.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("project");
    }
}
