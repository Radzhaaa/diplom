package com.gamifiedpm.service;

import com.gamifiedpm.model.entity.Achievement;
import com.gamifiedpm.model.entity.User;
import com.gamifiedpm.model.entity.UserAchievement;
import com.gamifiedpm.repository.AchievementRepository;
import com.gamifiedpm.repository.TaskRepository;
import com.gamifiedpm.repository.UserAchievementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AchievementService {

    private final AchievementRepository achievementRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final TaskRepository taskRepository;
    private final NotificationService notificationService;
    private final com.gamifiedpm.repository.UserRepository userRepository;

    private final ConcurrentHashMap<Long, Set<Long>> userAchievementsCache = new ConcurrentHashMap<>();

    @Transactional
    public void checkAchievements(User user, String actionType) {
        log.debug("Checking achievements for user: {} action: {}", user.getEmail(), actionType);
        List<Achievement> relevantAchievements = getRelevantAchievements(actionType);
        Set<Long> unlockedAchievementIds = getUnlockedAchievements(user);
        for (Achievement achievement : relevantAchievements) {
            if (unlockedAchievementIds.contains(achievement.getId())) {
                continue;
            }
            
            if (checkAchievementCondition(user, achievement)) {
                unlockAchievement(user, achievement);
                unlockedAchievementIds.add(achievement.getId());
            }
        }
    }

    @Transactional
    public void checkAllAchievements(User user) {
        List<Achievement> allAchievements = achievementRepository.findAll();
        Set<Long> unlockedAchievementIds = getUnlockedAchievements(user);
        
        for (Achievement achievement : allAchievements) {
            if (unlockedAchievementIds.contains(achievement.getId())) {
                continue;
            }
            
            if (checkAchievementCondition(user, achievement)) {
                unlockAchievement(user, achievement);
                unlockedAchievementIds.add(achievement.getId());
            }
        }
    }

    private List<Achievement> getRelevantAchievements(String actionType) {
        return switch (actionType) {
            case "TASK_COMPLETED" -> achievementRepository.findByConditionTypeIn(
                List.of("FIRST_TASK_COMPLETED", "TASKS_COMPLETED_10", "TASKS_COMPLETED_50", "TASKS_COMPLETED_100")
            );
            case "LEVEL_UP" -> achievementRepository.findByConditionTypeIn(
                List.of("LEVEL_REACHED_10", "LEVEL_REACHED_20")
            );
            case "STREAK_UPDATE" -> achievementRepository.findByConditionTypeIn(
                List.of("STREAK_30_DAYS")
            );
            default -> achievementRepository.findAll();
        };
    }

    private Set<Long> getUnlockedAchievements(User user) {
        if (userAchievementsCache.containsKey(user.getId())) {
            return userAchievementsCache.get(user.getId());
        }
        Set<Long> unlocked = loadUnlockedAchievements(user);
        userAchievementsCache.put(user.getId(), unlocked);
        return unlocked;
    }

    private Set<Long> loadUnlockedAchievements(User user) {
        return userAchievementRepository.findByUser(user)
            .stream()
            .map(ua -> ua.getAchievement().getId())
            .collect(Collectors.toSet());
    }

    @CacheEvict(value = "userAchievements", key = "#user.id")
    public void invalidateCache(User user) {
        userAchievementsCache.remove(user.getId());
    }

    private boolean checkAchievementCondition(User user, Achievement achievement) {
        String conditionType = achievement.getConditionType();
        
        return switch (conditionType) {
            case "FIRST_TASK_COMPLETED" -> {
                Set<Long> unlocked = getUnlockedAchievements(user);
                yield unlocked.isEmpty() && taskRepository.countCompletedTasksByUser(user) >= 1;
            }
            case "TASKS_COMPLETED_10" -> taskRepository.countCompletedTasksByUser(user) >= 10;
            case "TASKS_COMPLETED_50" -> taskRepository.countCompletedTasksByUser(user) >= 50;
            case "TASKS_COMPLETED_100" -> taskRepository.countCompletedTasksByUser(user) >= 100;
            case "LEVEL_REACHED_10" -> user.getLevel() >= 10;
            case "LEVEL_REACHED_20" -> user.getLevel() >= 20;
            case "STREAK_30_DAYS" -> user.getCurrentStreak() >= 30;
            default -> false;
        };
    }

    @Transactional
    public void unlockAchievement(User user, Achievement achievement) {
        UserAchievement userAchievement = UserAchievement.builder()
            .user(user)
            .achievement(achievement)
            .unlockedAt(java.time.LocalDateTime.now())
            .build();
        userAchievementRepository.save(userAchievement);
        user.setTotalXp(user.getTotalXp() + achievement.getXpReward());
        int oldLevel = user.getLevel();
        int newLevel = user.calculateLevel();
        user.setLevel(newLevel);
        userRepository.save(user);
        if (newLevel > oldLevel) {
            notificationService.createNotification(
                user,
                com.gamifiedpm.model.entity.Notification.NotificationType.LEVEL_UP,
                "Новый уровень!",
                String.format("Поздравляем! Вы достигли уровня %d!", newLevel),
                null,
                null
            );
        }
        invalidateCache(user);
        notificationService.createNotification(
            user,
            com.gamifiedpm.model.entity.Notification.NotificationType.ACHIEVEMENT_UNLOCKED,
            "Новое достижение!",
            String.format("Вы получили достижение: %s", achievement.getName()),
            achievement.getId(),
            "ACHIEVEMENT"
        );
        
        log.info("Achievement unlocked: {} for user: {}", achievement.getName(), user.getEmail());
    }

    @Transactional(readOnly = true)
    public List<com.gamifiedpm.dto.response.AchievementDto> getUserAchievementsWithStatus(User user) {
        Set<Long> unlockedIds = getUnlockedAchievements(user);
        return achievementRepository.findAll().stream()
            .map(achievement -> {
                boolean unlocked = unlockedIds.contains(achievement.getId());
                return com.gamifiedpm.dto.response.AchievementDto.builder()
                    .id(achievement.getId())
                    .name(achievement.getName())
                    .description(achievement.getDescription())
                    .icon(achievement.getIcon())
                    .xpReward(achievement.getXpReward())
                    .rarity(achievement.getRarity())
                    .unlocked(unlocked)
                    .build();
            })
            .collect(Collectors.toList());
    }
}
