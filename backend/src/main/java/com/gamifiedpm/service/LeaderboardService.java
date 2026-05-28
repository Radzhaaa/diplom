package com.gamifiedpm.service;

import com.gamifiedpm.dto.response.LeaderboardEntryDto;
import com.gamifiedpm.dto.response.ProjectCompetitionEntry;
import com.gamifiedpm.dto.response.UserDto;
import com.gamifiedpm.model.entity.LeaderboardSnapshot;
import com.gamifiedpm.model.entity.Project;
import com.gamifiedpm.model.entity.Task;
import com.gamifiedpm.model.entity.User;
import com.gamifiedpm.repository.LeaderboardSnapshotRepository;
import com.gamifiedpm.repository.ProjectMemberRepository;
import com.gamifiedpm.repository.ProjectRepository;
import com.gamifiedpm.repository.TaskRepository;
import com.gamifiedpm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final LeaderboardSnapshotRepository snapshotRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;

    @Cacheable(value = "leaderboard", key = "#limit")
    @Transactional(readOnly = true)
    public List<LeaderboardEntryDto> getLeaderboard(int limit) {
        List<User> users = userRepository.findAllOrderByTotalXpDesc();

        List<LeaderboardEntryDto> entries = users.stream()
            .limit(limit > 0 ? limit : 100)
            .map(user -> {
                long completedTasks = taskRepository.countCompletedTasksByUser(user);
                int change = calculateChange(user, users.indexOf(user) + 1);
                return LeaderboardEntryDto.builder()
                    .user(UserDto.fromEntity(user))
                    .totalXp(user.getTotalXp())
                    .level(user.getLevel())
                    .completedTasks(completedTasks)
                    .streak(user.getCurrentStreak())
                    .change(change)
                    .build();
            })
            .collect(Collectors.toList());

        for (int i = 0; i < entries.size(); i++) {
            entries.get(i).setRank(i + 1);
        }

        return entries;
    }

    @Transactional(readOnly = true)
    public Integer getUserRank(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));

        List<User> users = userRepository.findAllOrderByTotalXpDesc();
        for (int i = 0; i < users.size(); i++) {
            if (users.get(i).getId().equals(user.getId())) {
                return i + 1;
            }
        }
        return null;
    }

    @Transactional(readOnly = true)
    public List<ProjectCompetitionEntry> getProjectCompetition() {
        LocalDateTime monthStart = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);

        List<Project> projects = projectRepository.findAll();
        List<ProjectCompetitionEntry> result = new ArrayList<>();

        for (Project project : projects) {
            List<Task> tasks = taskRepository.findByProject(project);
            long completedThisMonth = tasks.stream()
                    .filter(t -> t.getStatus() == Task.TaskStatus.COMPLETED
                            && t.getCompletedAt() != null
                            && !t.getCompletedAt().isBefore(monthStart))
                    .count();
            long totalXp = tasks.stream()
                    .filter(t -> t.getStatus() == Task.TaskStatus.COMPLETED
                            && t.getCompletedAt() != null
                            && !t.getCompletedAt().isBefore(monthStart)
                            && t.getXpReward() != null)
                    .mapToLong(t -> t.getXpReward())
                    .sum();
            int memberCount = projectMemberRepository.findByProjectOrderByJoinedAtAsc(project).size();

            result.add(ProjectCompetitionEntry.builder()
                    .projectId(project.getId())
                    .projectName(project.getName())
                    .completedTasks(completedThisMonth)
                    .totalXp(totalXp)
                    .memberCount(memberCount)
                    .build());
        }

        result.sort(Comparator.comparingLong(ProjectCompetitionEntry::getTotalXp).reversed());
        for (int i = 0; i < result.size(); i++) {
            result.get(i).setRank(i + 1);
        }
        return result;
    }

    private int calculateChange(User user, int currentRank) {
        return snapshotRepository.findTopByUserOrderBySnapshotDateDesc(user)
            .map(LeaderboardSnapshot::getRankPosition)
            .map(previousRank -> previousRank - currentRank)
            .orElse(0);
    }
}
