package com.gamifiedpm.service;

import com.gamifiedpm.model.entity.Project;
import com.gamifiedpm.model.entity.Task;
import com.gamifiedpm.model.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class GamificationActionService {

    private final GamificationService gamificationService;
    private final QuestService questService;
    private final SkillService skillService;

    @Caching(evict = {
        @CacheEvict(value = "analytics", key = "#user.email"),
        @CacheEvict(value = "leaderboard", allEntries = true)
    })
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onTaskCompleted(User user, Task task) {
        gamificationService.awardXpForTask(user, task);
        questService.updateQuestProgress(user, "TASKS_COMPLETED", 1);
        String skillCategory = determineSkillCategory(task);
        skillService.awardSkillExperience(user, skillCategory, 10);
        if (task.getAssignedTo() != null && !task.getAssignedTo().getId().equals(user.getId())) {
            skillService.awardSkillExperience(user, "MANAGEMENT", 5);
        }
        gamificationService.updateStreak(user);
        log.info("Task completion processed for user: {} task: {}", user.getEmail(), task.getId());
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onProjectCreated(User user, Project project) {
        gamificationService.awardXp(user, 100);
        questService.updateQuestProgress(user, "PROJECTS_CREATED", 1);
        skillService.awardSkillExperience(user, "MANAGEMENT", 15);
        log.info("Project creation processed for user: {} project: {}", user.getEmail(), project.getId());
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onCommentAdded(User user) {
        gamificationService.awardXpForComment(user);
        questService.updateQuestProgress(user, "COMMENTS_ADDED", 1);
        skillService.awardSkillExperience(user, "COMMUNICATION", 5);
        log.info("Comment addition processed for user: {}", user.getEmail());
    }

    private String determineSkillCategory(Task task) {
        if (task.getCategory() != null) {
            return mapTaskCategoryToSkillCategory(task.getCategory());
        }
        return "DEVELOPMENT";
    }

    private String mapTaskCategoryToSkillCategory(Task.TaskCategory taskCategory) {
        return switch (taskCategory) {
            case DEVELOPMENT -> "DEVELOPMENT";
            case DESIGN -> "DESIGN";
            case MANAGEMENT -> "MANAGEMENT";
            case COMMUNICATION -> "COMMUNICATION";
            case TESTING -> "DEVELOPMENT";
            case DOCUMENTATION -> "COMMUNICATION";
            case OTHER -> "DEVELOPMENT";
        };
    }
}
