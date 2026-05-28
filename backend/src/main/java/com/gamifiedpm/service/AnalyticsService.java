package com.gamifiedpm.service;

import com.gamifiedpm.dto.response.AnalyticsDto;
import com.gamifiedpm.dto.response.UserStatsDto;
import com.gamifiedpm.dto.response.ProjectStatsDto;
import com.gamifiedpm.dto.response.TaskStatsDto;
import com.gamifiedpm.dto.response.XpHistoryDto;
import com.gamifiedpm.dto.response.TaskCompletionDto;
import com.gamifiedpm.dto.response.ActivityHeatmapDto;
import com.gamifiedpm.model.entity.*;
import com.gamifiedpm.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final ActivityLogRepository activityLogRepository;

    @Cacheable(value = "analytics", key = "#userEmail")
    @Transactional(readOnly = true)
    public AnalyticsDto getUserAnalytics(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));

        UserStatsDto userStats = UserStatsDto.builder()
            .totalXp(user.getTotalXp())
            .level(user.getLevel())
            .currentStreak(user.getCurrentStreak())
            .totalTasksCompleted(taskRepository.countCompletedTasksByUser(user))
            .totalProjectsCompleted(projectRepository.findByCreatedBy(user).stream()
                .filter(p -> p.getStatus() == Project.ProjectStatus.COMPLETED)
                .count())
            .rank(calculateUserRank(user))
            .build();

        List<Project> userProjects = projectRepository.findUserProjects(user);
        ProjectStatsDto projectStats = ProjectStatsDto.builder()
            .totalProjects((long) userProjects.size())
            .activeProjects(userProjects.stream()
                .filter(p -> p.getStatus() == Project.ProjectStatus.ACTIVE)
                .count())
            .completedProjects(userProjects.stream()
                .filter(p -> p.getStatus() == Project.ProjectStatus.COMPLETED)
                .count())
            .averageProgress(userProjects.stream()
                .mapToDouble(Project::calculateProgress)
                .average()
                .orElse(0.0))
            .build();

        List<Task> userTasks = taskRepository.findByAssignedTo(user);
        long completedTasks = userTasks.stream()
            .filter(t -> t.getStatus() == Task.TaskStatus.COMPLETED)
            .count();
        long overdueTasks = userTasks.stream()
            .filter(Task::isOverdue)
            .count();

        TaskStatsDto taskStats = TaskStatsDto.builder()
            .totalTasks((long) userTasks.size())
            .completedTasks(completedTasks)
            .inProgressTasks(userTasks.stream()
                .filter(t -> t.getStatus() == Task.TaskStatus.IN_PROGRESS)
                .count())
            .overdueTasks(overdueTasks)
            .completionRate(userTasks.isEmpty() ? 0.0 : (double) completedTasks / userTasks.size() * 100)
            .averageCompletionTime(calculateAverageCompletionTime(userTasks))
            .build();

        List<XpHistoryDto> xpHistory = generateXpHistory(user, 30);
        List<TaskCompletionDto> taskCompletionHistory = generateTaskCompletionHistory(user, 30);
        Map<String, Long> tasksByPriority = userTasks.stream()
            .collect(Collectors.groupingBy(
                task -> task.getPriority().name(),
                Collectors.counting()
            ));

        Map<String, Long> tasksByStatus = userTasks.stream()
            .collect(Collectors.groupingBy(
                task -> task.getStatus().name(),
                Collectors.counting()
            ));

        List<ActivityHeatmapDto> activityHeatmap = generateActivityHeatmap(user, 12);

        return AnalyticsDto.builder()
            .userStats(userStats)
            .projectStats(projectStats)
            .taskStats(taskStats)
            .xpHistory(xpHistory)
            .taskCompletionHistory(taskCompletionHistory)
            .tasksByPriority(tasksByPriority)
            .tasksByStatus(tasksByStatus)
            .activityHeatmap(activityHeatmap)
            .build();
    }

    private Integer calculateUserRank(User user) {
        List<User> users = userRepository.findAllOrderByTotalXpDesc();
        for (int i = 0; i < users.size(); i++) {
            if (users.get(i).getId().equals(user.getId())) {
                return i + 1;
            }
        }
        return null;
    }

    private Double calculateAverageCompletionTime(List<Task> tasks) {
        return tasks.stream()
            .filter(t -> t.getStatus() == Task.TaskStatus.COMPLETED && t.getCompletedAt() != null)
            .mapToDouble(t -> {
                long days = java.time.temporal.ChronoUnit.DAYS.between(
                    t.getCreatedAt(),
                    t.getCompletedAt()
                );
                return days;
            })
            .average()
            .orElse(0.0);
    }

    private List<XpHistoryDto> generateXpHistory(User user, int days) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days - 1);

        List<ActivityLog> xpEvents = activityLogRepository.findXpEventsByUserAndPeriod(
            user,
            startDate.atStartOfDay(),
            endDate.atTime(23, 59, 59)
        );

        Map<LocalDate, Integer> xpByDate = new java.util.LinkedHashMap<>();
        for (ActivityLog event : xpEvents) {
            LocalDate date = event.getCreatedAt().toLocalDate();
            int xp = parseXpFromMetadata(event.getMetadata());
            xpByDate.merge(date, xp, Integer::sum);
        }

        List<XpHistoryDto> history = new ArrayList<>();
        for (int i = 0; i < days; i++) {
            LocalDate date = startDate.plusDays(i);
            history.add(XpHistoryDto.builder()
                .date(date.format(DateTimeFormatter.ISO_LOCAL_DATE))
                .xp(xpByDate.getOrDefault(date, 0))
                .source("TASK")
                .build());
        }
        return history;
    }

    private int parseXpFromMetadata(String metadata) {
        if (metadata == null) return 0;
        try {
            int start = metadata.indexOf("\"xp\":");
            if (start < 0) return 0;
            start += 5;
            int end = metadata.indexOf(',', start);
            if (end < 0) end = metadata.indexOf('}', start);
            return Integer.parseInt(metadata.substring(start, end).trim());
        } catch (Exception e) {
            return 0;
        }
    }

    private List<TaskCompletionDto> generateTaskCompletionHistory(User user, int days) {
        List<TaskCompletionDto> history = new ArrayList<>();
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days);

        List<Task> tasks = taskRepository.findByAssignedTo(user);

        for (int i = 0; i < days; i++) {
            LocalDate date = startDate.plusDays(i);
            LocalDateTime dateStart = date.atStartOfDay();
            LocalDateTime dateEnd = date.plusDays(1).atStartOfDay();

            long completed = tasks.stream()
                .filter(t -> t.getStatus() == Task.TaskStatus.COMPLETED
                    && t.getCompletedAt() != null
                    && t.getCompletedAt().isAfter(dateStart)
                    && t.getCompletedAt().isBefore(dateEnd))
                .count();

            long created = tasks.stream()
                .filter(t -> t.getCreatedAt().isAfter(dateStart)
                    && t.getCreatedAt().isBefore(dateEnd))
                .count();

            history.add(TaskCompletionDto.builder()
                .date(date.format(DateTimeFormatter.ISO_LOCAL_DATE))
                .completed(completed)
                .created(created)
                .build());
        }

        return history;
    }

    private List<ActivityHeatmapDto> generateActivityHeatmap(User user, int weeks) {
        List<ActivityHeatmapDto> heatmap = new ArrayList<>();
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusWeeks(weeks);

        List<ActivityLog> activities = activityLogRepository.findByUserAndCreatedAtBetween(
            user,
            startDate.atStartOfDay(),
            endDate.atTime(23, 59, 59)
        );

        Map<LocalDate, Long> activityByDate = activities.stream()
            .collect(Collectors.groupingBy(
                activity -> activity.getCreatedAt().toLocalDate(),
                Collectors.counting()
            ));

        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            long count = activityByDate.getOrDefault(date, 0L);
            heatmap.add(ActivityHeatmapDto.builder()
                .date(date.format(DateTimeFormatter.ISO_LOCAL_DATE))
                .count((int) count)
                .build());
        }

        return heatmap;
    }
}
