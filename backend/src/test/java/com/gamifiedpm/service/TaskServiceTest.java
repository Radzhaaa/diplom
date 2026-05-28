package com.gamifiedpm.service;

import com.gamifiedpm.dto.request.CreateTaskRequest;
import com.gamifiedpm.exception.AccessDeniedException;
import com.gamifiedpm.exception.ResourceNotFoundException;
import com.gamifiedpm.model.entity.Project;
import com.gamifiedpm.model.entity.Task;
import com.gamifiedpm.model.entity.User;
import com.gamifiedpm.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock private TaskRepository              taskRepository;
    @Mock private ProjectRepository           projectRepository;
    @Mock private UserRepository              userRepository;
    @Mock private NotificationService         notificationService;
    @Mock private GamificationActionService   gamificationActionService;
    @Mock private TaskHistoryRepository       taskHistoryRepository;
    @Mock private PermissionService           permissionService;
    @Mock private WebSocketEventService       webSocketEventService;
    @Mock private TaskDependencyRepository    taskDependencyRepository;

    @InjectMocks private TaskService taskService;

    private User   user;
    private Project project;
    private Task   task;

    @BeforeEach
    void setUp() {
        user = User.builder()
            .id(1L).email("user@test.com")
            .firstName("Test").lastName("User")
            .role(User.Role.TEAM_MEMBER)
            .build();

        project = Project.builder()
            .id(10L).name("Test Project")
            .createdBy(user)
            .status(Project.ProjectStatus.ACTIVE)
            .build();

        task = Task.builder()
            .id(100L).title("Test Task")
            .status(Task.TaskStatus.NEW)
            .priority(Task.Priority.MEDIUM)
            .project(project)
            .createdBy(user)
            .xpReward(25)
            .tags(new java.util.ArrayList<>())
            .coExecutors(new java.util.HashSet<>())
            .observers(new java.util.HashSet<>())
            .build();
    }


    @Test
    void createTask_success_savesTaskAndReturnsDto() {
        CreateTaskRequest req = new CreateTaskRequest();
        req.setProjectId(10L);
        req.setTitle("New Task");
        req.setPriority(Task.Priority.HIGH);

        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(permissionService.canCreateTask(user, project)).thenReturn(true);
        when(taskRepository.save(any(Task.class))).thenReturn(task);
        when(taskHistoryRepository.save(any())).thenReturn(null);

        var result = taskService.createTask(req, "user@test.com");

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(100L);
        verify(taskRepository).save(any(Task.class));
        verify(webSocketEventService).notifyTaskUpdated(eq(10L), eq(100L), eq("CREATED"));
    }

    @Test
    void createTask_userNotFound_throwsResourceNotFoundException() {
        CreateTaskRequest req = new CreateTaskRequest();
        req.setProjectId(10L);
        req.setTitle("Task");
        req.setPriority(Task.Priority.LOW);

        when(userRepository.findByEmail("unknown@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.createTask(req, "unknown@test.com"))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("User not found");
    }

    @Test
    void createTask_projectNotFound_throwsResourceNotFoundException() {
        CreateTaskRequest req = new CreateTaskRequest();
        req.setProjectId(99L);
        req.setTitle("Task");
        req.setPriority(Task.Priority.LOW);

        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(projectRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.createTask(req, "user@test.com"))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("Project not found");
    }

    @Test
    void createTask_noPermission_throwsAccessDeniedException() {
        CreateTaskRequest req = new CreateTaskRequest();
        req.setProjectId(10L);
        req.setTitle("Task");
        req.setPriority(Task.Priority.LOW);

        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(permissionService.canCreateTask(user, project)).thenReturn(false);

        assertThatThrownBy(() -> taskService.createTask(req, "user@test.com"))
            .isInstanceOf(AccessDeniedException.class);
    }


    @Test
    void getTaskById_success_returnsDto() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(taskRepository.findById(100L)).thenReturn(Optional.of(task));
        when(permissionService.canViewProject(user, project)).thenReturn(true);
        when(taskDependencyRepository.findAllByTask(task)).thenReturn(Collections.emptyList());

        var result = taskService.getTaskById(100L, "user@test.com");

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(100L);
    }

    @Test
    void getTaskById_taskNotFound_throwsResourceNotFoundException() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(taskRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.getTaskById(999L, "user@test.com"))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("Task not found");
    }

    @Test
    void getTaskById_noPermission_throwsAccessDeniedException() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(taskRepository.findById(100L)).thenReturn(Optional.of(task));
        when(permissionService.canViewProject(user, project)).thenReturn(false);

        assertThatThrownBy(() -> taskService.getTaskById(100L, "user@test.com"))
            .isInstanceOf(AccessDeniedException.class);
    }


    @Test
    void completeTask_success_setsStatusAndTriggersGamification() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(taskRepository.findById(100L)).thenReturn(Optional.of(task));
        when(permissionService.canCompleteTask(user, task)).thenReturn(true);
        when(taskRepository.save(task)).thenReturn(task);

        taskService.completeTask(100L, "user@test.com");

        assertThat(task.getStatus()).isEqualTo(Task.TaskStatus.COMPLETED);
        assertThat(task.getCompletedAt()).isNotNull();
        verify(gamificationActionService).onTaskCompleted(user, task);
        verify(webSocketEventService).notifyTaskUpdated(10L, 100L, "COMPLETED");
    }

    @Test
    void completeTask_noPermission_throwsAccessDeniedException() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(taskRepository.findById(100L)).thenReturn(Optional.of(task));
        when(permissionService.canCompleteTask(user, task)).thenReturn(false);

        assertThatThrownBy(() -> taskService.completeTask(100L, "user@test.com"))
            .isInstanceOf(AccessDeniedException.class);

        verify(gamificationActionService, never()).onTaskCompleted(any(), any());
    }


    @Test
    void deleteTask_success_softDeletesSetsDeletedAt() {
        task.setDeletedAt(null);

        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(taskRepository.findByIdAndDeletedAtIsNull(100L)).thenReturn(Optional.of(task));
        when(permissionService.canDeleteTask(user, task)).thenReturn(true);
        when(taskRepository.save(task)).thenReturn(task);

        taskService.deleteTask(100L, "user@test.com");

        assertThat(task.getDeletedAt()).isNotNull();
        verify(taskRepository).save(task);
    }

    @Test
    void deleteTask_noPermission_throwsAccessDeniedException() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(taskRepository.findByIdAndDeletedAtIsNull(100L)).thenReturn(Optional.of(task));
        when(permissionService.canDeleteTask(user, task)).thenReturn(false);

        assertThatThrownBy(() -> taskService.deleteTask(100L, "user@test.com"))
            .isInstanceOf(AccessDeniedException.class);

        verify(taskRepository, never()).save(any());
    }

    @Test
    void deleteTask_alreadyDeleted_throwsResourceNotFoundException() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(taskRepository.findByIdAndDeletedAtIsNull(100L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.deleteTask(100L, "user@test.com"))
            .isInstanceOf(ResourceNotFoundException.class);
    }


    @Test
    void getUserTasks_withProject_filtersAndReturns() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(permissionService.canViewProject(user, project)).thenReturn(true);
        when(taskRepository.findByProject(project)).thenReturn(List.of(task));

        var result = taskService.getUserTasks("user@test.com", 10L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(100L);
    }

    @Test
    void getUserTasks_noProjectFilter_returnsAllUserTasks() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(taskRepository.findTasksByUserProjects(user)).thenReturn(List.of(task));

        var result = taskService.getUserTasks("user@test.com", null);

        assertThat(result).hasSize(1);
    }
}
