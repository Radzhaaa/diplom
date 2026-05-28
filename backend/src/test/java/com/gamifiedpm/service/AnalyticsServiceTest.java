package com.gamifiedpm.service;

import com.gamifiedpm.dto.response.AnalyticsDto;
import com.gamifiedpm.model.entity.Project;
import com.gamifiedpm.model.entity.Task;
import com.gamifiedpm.model.entity.User;
import com.gamifiedpm.repository.ActivityLogRepository;
import com.gamifiedpm.repository.ProjectRepository;
import com.gamifiedpm.repository.TaskRepository;
import com.gamifiedpm.repository.UserRepository;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private ProjectRepository projectRepository;
    @Mock private TaskRepository taskRepository;
    @Mock private ActivityLogRepository activityLogRepository;

    @InjectMocks private AnalyticsService analyticsService;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(1L).email("user@test.com")
                .firstName("Alice").lastName("Smith")
                .role(User.Role.TEAM_MEMBER)
                .level(3).totalXp(1500).currentStreak(5)
                .build();
    }

    @Test
    void getUserAnalytics_returnsDto_withCorrectUserStats() {
        Project activeProject = Project.builder()
                .id(10L).name("P1")
                .status(Project.ProjectStatus.ACTIVE)
                .createdBy(user)
                .tasks(new java.util.ArrayList<>())
                .build();

        given(userRepository.findByEmail("user@test.com")).willReturn(Optional.of(user));
        given(taskRepository.countCompletedTasksByUser(user)).willReturn(10L);
        given(projectRepository.findByCreatedBy(user)).willReturn(List.of(activeProject));
        given(projectRepository.findUserProjects(user)).willReturn(List.of(activeProject));
        given(taskRepository.findByAssignedTo(user)).willReturn(Collections.emptyList());
        given(userRepository.findAllOrderByTotalXpDesc()).willReturn(List.of(user));
        given(activityLogRepository.findXpEventsByUserAndPeriod(eq(user), any(), any()))
                .willReturn(Collections.emptyList());

        AnalyticsDto result = analyticsService.getUserAnalytics("user@test.com");

        assertThat(result).isNotNull();
        assertThat(result.getUserStats().getLevel()).isEqualTo(3);
        assertThat(result.getUserStats().getTotalXp()).isEqualTo(1500);
        assertThat(result.getUserStats().getTotalTasksCompleted()).isEqualTo(10L);
        assertThat(result.getProjectStats().getTotalProjects()).isEqualTo(1L);
        assertThat(result.getProjectStats().getActiveProjects()).isEqualTo(1L);
    }

    @Test
    void getUserAnalytics_throwsRuntime_whenUserNotFound() {
        given(userRepository.findByEmail("ghost@test.com")).willReturn(Optional.empty());

        assertThatThrownBy(() -> analyticsService.getUserAnalytics("ghost@test.com"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    void getUserAnalytics_handlesEmptyProjectsAndTasks() {
        given(userRepository.findByEmail("user@test.com")).willReturn(Optional.of(user));
        given(taskRepository.countCompletedTasksByUser(user)).willReturn(0L);
        given(projectRepository.findByCreatedBy(user)).willReturn(Collections.emptyList());
        given(projectRepository.findUserProjects(user)).willReturn(Collections.emptyList());
        given(taskRepository.findByAssignedTo(user)).willReturn(Collections.emptyList());
        given(userRepository.findAllOrderByTotalXpDesc()).willReturn(Collections.emptyList());
        given(activityLogRepository.findXpEventsByUserAndPeriod(eq(user), any(), any()))
                .willReturn(Collections.emptyList());

        AnalyticsDto result = analyticsService.getUserAnalytics("user@test.com");

        assertThat(result.getProjectStats().getTotalProjects()).isEqualTo(0L);
        assertThat(result.getTaskStats().getTotalTasks()).isEqualTo(0L);
        assertThat(result.getProjectStats().getAverageProgress()).isEqualTo(0.0);
    }
}
