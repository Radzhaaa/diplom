package com.gamifiedpm.service;

import com.gamifiedpm.model.entity.*;
import com.gamifiedpm.repository.ActivityLogRepository;
import com.gamifiedpm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class GamificationService {

    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AchievementService achievementService;
    private final ActivityLogRepository activityLogRepository;

    @Transactional
    public void awardXpForTask(User user, Task task) {
        int xpToAward = task.getXpReward();
        if (task.isCompletedOnTime()) {
            xpToAward += 10;
        }
        user.setTotalXp(user.getTotalXp() + xpToAward);
        int oldLevel = user.getLevel();
        int newLevel = user.calculateLevel();
        user.setLevel(newLevel);
        userRepository.save(user);
        logXpEarned(user, xpToAward, "TASK", task.getTitle());
        notificationService.createNotification(
            user,
            Notification.NotificationType.TASK_COMPLETED,
            "Задача выполнена!",
            task.isCompletedOnTime()
                ? String.format("Вы получили %d XP (%d + 10 бонус за срок) за задачу \"%s\"", xpToAward, task.getXpReward(), task.getTitle())
                : String.format("Вы получили %d XP за выполнение задачи \"%s\"", xpToAward, task.getTitle()),
            task.getId(),
            "TASK"
        );
        if (newLevel > oldLevel) {
            notificationService.createNotification(
                user,
                Notification.NotificationType.LEVEL_UP,
                "Новый уровень!",
                String.format("Поздравляем! Вы достигли уровня %d!", newLevel),
                null,
                null
            );
            checkAchievements(user, "LEVEL_UP");
        }
        checkAchievements(user, "TASK_COMPLETED");
    }

    @Transactional
    public void awardXpForComment(User user) {
        awardXpWithSource(user, 5, "COMMENT", "Комментарий к задаче");
    }

    @Transactional
    public void awardXp(User user, int amount) {
        awardXpWithSource(user, amount, "OTHER", null);
    }

    @Transactional
    public void awardXpWithSource(User user, int amount, String source, String description) {
        user.setTotalXp(user.getTotalXp() + amount);
        int oldLevel = user.getLevel();
        int newLevel = user.calculateLevel();
        user.setLevel(newLevel);
        userRepository.save(user);
        logXpEarned(user, amount, source, description);
        if (newLevel > oldLevel) {
            notificationService.createNotification(
                user,
                Notification.NotificationType.LEVEL_UP,
                "Новый уровень!",
                String.format("Поздравляем! Вы достигли уровня %d!", newLevel),
                null,
                null
            );
            checkAchievements(user, "LEVEL_UP");
        }
    }

    private void logXpEarned(User user, int amount, String source, String description) {
        String meta = String.format("{\"xp\":%d,\"source\":\"%s\"}", amount, source);
        activityLogRepository.save(ActivityLog.builder()
            .user(user)
            .activityType("XP_EARNED")
            .description(description != null ? description : source)
            .metadata(meta)
            .build());
    }

    @Transactional
    public void checkAchievements(User user) {
        achievementService.checkAllAchievements(user);
    }

    @Transactional
    public void checkAchievements(User user, String actionType) {
        achievementService.checkAchievements(user, actionType);
    }

    @Transactional
    public void unlockAchievement(User user, Achievement achievement) {
        achievementService.unlockAchievement(user, achievement);
    }

    @Transactional
    public void updateStreak(User user) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime lastActivity = user.getLastActivityDate();
        
        if (lastActivity == null) {
            user.setCurrentStreak(1);
        } else {
            long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(
                lastActivity.toLocalDate(), 
                now.toLocalDate()
            );
            
            if (daysBetween == 1) {
                user.setCurrentStreak(user.getCurrentStreak() + 1);
            } else if (daysBetween > 1) {
                user.setCurrentStreak(1);
            }
        }
        
        user.setLastActivityDate(now);
        userRepository.save(user);
        checkAchievements(user, "STREAK_UPDATE");
    }
}

