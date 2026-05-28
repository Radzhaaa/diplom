package com.gamifiedpm.service;

import com.gamifiedpm.dto.request.CreateQuestRequest;
import com.gamifiedpm.dto.response.QuestDto;
import com.gamifiedpm.model.entity.*;
import com.gamifiedpm.repository.*;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuestService {

    private final QuestRepository questRepository;
    private final UserQuestRepository userQuestRepository;
    private final UserRepository userRepository;
    private final GamificationService gamificationService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<QuestDto> getUserQuests(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDate today = LocalDate.now();

        List<Quest> activeQuests = questRepository.findActiveQuests(today).stream()
            .filter(q -> q.getAssignedToUser() == null || q.getAssignedToUser().getId().equals(user.getId()))
            .collect(Collectors.toList());

        return activeQuests.stream()
            .map(quest -> {
                UserQuest userQuest = userQuestRepository.findByUserAndQuest(user, quest)
                    .orElse(UserQuest.builder()
                        .user(user)
                        .quest(quest)
                        .currentProgress(0)
                        .isCompleted(false)
                        .build());

                return QuestDto.fromEntity(quest, userQuest);
            })
            .collect(Collectors.toList());
    }

    @Transactional
    public void updateQuestProgress(User user, String conditionType, int amount) {
        try {
            LocalDate today = LocalDate.now();
            List<Quest> activeQuests = questRepository.findActiveQuestsByCondition(conditionType, today).stream()
                .filter(q -> q.getAssignedToUser() == null || q.getAssignedToUser().getId().equals(user.getId()))
                .collect(Collectors.toList());

            if (activeQuests == null || activeQuests.isEmpty()) {
                return;
            }

            for (Quest quest : activeQuests) {
                UserQuest userQuest = userQuestRepository.findByUserAndQuest(user, quest)
                    .orElseGet(() -> {
                        UserQuest newUserQuest = UserQuest.builder()
                            .user(user)
                            .quest(quest)
                            .currentProgress(0)
                            .isCompleted(false)
                            .build();
                        return userQuestRepository.save(newUserQuest);
                    });

                if (!userQuest.getIsCompleted()) {
                    int newProgress = Math.min(
                        userQuest.getCurrentProgress() + amount,
                        quest.getTargetValue()
                    );
                    userQuest.setCurrentProgress(newProgress);

                    if (newProgress >= quest.getTargetValue() && !userQuest.getIsCompleted()) {
                        userQuest.setIsCompleted(true);
                        userQuest.setCompletedAt(java.time.LocalDateTime.now());

                        gamificationService.awardXp(user, quest.getXpReward());

                        notificationService.createNotification(
                            user,
                            Notification.NotificationType.QUEST_COMPLETED,
                            "Квест выполнен!",
                            String.format("Вы выполнили квест: %s. Получено %d XP!",
                                quest.getTitle(), quest.getXpReward()),
                            quest.getId(),
                            "QUEST"
                        );
                    }

                    userQuestRepository.save(userQuest);
                }
            }
        } catch (Exception e) {
            log.error("Error updating quest progress for user: {} conditionType: {}", user.getEmail(), conditionType, e);
        }
    }

    @Transactional
    public void generateDailyQuests() {
        LocalDate today = LocalDate.now();

        if (questRepository.existsByTypeAndStartDate(Quest.QuestType.DAILY, today)) {
            return;
        }

        List<Quest> oldDaily = questRepository.findExpiredByType(Quest.QuestType.DAILY, today);
        for (Quest old : oldDaily) {
            userQuestRepository.deleteByQuestId(old.getId());
            questRepository.delete(old);
        }
        if (!oldDaily.isEmpty()) {
            log.info("Deleted {} old expired daily quests", oldDaily.size());
        }

        Quest quest1 = createQuest("Ударный день",
            "Завершите 5 задач сегодня",
            Quest.QuestType.DAILY, 100, 5, "TASKS_COMPLETED", today,
            Quest.Difficulty.MEDIUM, "⚡");

        Quest quest2 = createQuest("Вовлечённый участник",
            "Оставьте 3 комментария к задачам",
            Quest.QuestType.DAILY, 60, 3, "COMMENTS_ADDED", today,
            Quest.Difficulty.EASY, "💬");

        Quest quest3 = createQuest("Запустить спринт",
            "Начните новый спринт",
            Quest.QuestType.DAILY, 150, 1, "SPRINT_STARTED", today,
            Quest.Difficulty.HARD, "🚀");

        List<User> activeUsers = userRepository.findAll();
        for (User user : activeUsers) {
            createUserQuestIfNotExists(user, quest1);
            createUserQuestIfNotExists(user, quest2);
            createUserQuestIfNotExists(user, quest3);
        }

        log.info("Daily quests generated for {} users", activeUsers.size());
    }

    @Transactional
    public void generateWeeklyQuests() {
        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.minusDays(today.getDayOfWeek().getValue() - 1);

        if (questRepository.existsByTypeAndStartDate(Quest.QuestType.WEEKLY, weekStart)) {
            return;
        }

        List<Quest> oldWeekly = questRepository.findExpiredByType(Quest.QuestType.WEEKLY, today);
        for (Quest old : oldWeekly) {
            userQuestRepository.deleteByQuestId(old.getId());
            questRepository.delete(old);
        }
        if (!oldWeekly.isEmpty()) {
            log.info("Deleted {} old expired weekly quests", oldWeekly.size());
        }

        Quest quest1 = createQuest("Командный результат",
            "Закройте 25 задач за неделю",
            Quest.QuestType.WEEKLY, 400, 25, "TASKS_COMPLETED", weekStart,
            Quest.Difficulty.HARD, "🎯");

        Quest quest2 = createQuest("Серийный игрок",
            "Будьте активны 5 дней подряд",
            Quest.QuestType.WEEKLY, 350, 5, "STREAK_DAYS", weekStart,
            Quest.Difficulty.MEDIUM, "🔥");

        List<User> activeUsers = userRepository.findAll();
        for (User user : activeUsers) {
            createUserQuestIfNotExists(user, quest1);
            createUserQuestIfNotExists(user, quest2);
        }

        log.info("Weekly quests generated for {} users", activeUsers.size());
    }

    @Transactional
    public QuestDto createAdminQuest(CreateQuestRequest req, String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        if (admin.getRole() != User.Role.ADMIN) {
            throw new com.gamifiedpm.exception.AccessDeniedException("Admin role required");
        }

        User assignedTo = null;
        if (req.getAssignedToUserEmail() != null && !req.getAssignedToUserEmail().isBlank()) {
            assignedTo = userRepository.findByEmail(req.getAssignedToUserEmail())
                .orElseThrow(() -> new RuntimeException("Assigned user not found: " + req.getAssignedToUserEmail()));
        }

        LocalDate startDate = LocalDate.now();
        LocalDate endDate = req.getEndDate() != null ? req.getEndDate() :
            (req.getType() == Quest.QuestType.DAILY ? startDate.plusDays(1) : startDate.plusWeeks(1));

        Quest quest = Quest.builder()
            .title(req.getTitle())
            .description(req.getDescription())
            .type(req.getType())
            .status(Quest.QuestStatus.ACTIVE)
            .xpReward(req.getXpReward())
            .targetValue(req.getTargetValue())
            .currentProgress(0)
            .conditionType(req.getConditionType())
            .startDate(startDate)
            .endDate(endDate)
            .difficulty(req.getDifficulty())
            .icon(req.getIcon())
            .assignedToUser(assignedTo)
            .build();

        quest = questRepository.save(quest);
        List<User> targets = assignedTo != null
            ? List.of(assignedTo)
            : userRepository.findAll();

        for (User u : targets) {
            createUserQuestIfNotExists(u, quest);
        }

        UserQuest uq = UserQuest.builder()
            .user(admin).quest(quest).currentProgress(0).isCompleted(false).build();
        return QuestDto.fromEntity(quest, uq);
    }

    @Transactional
    public void deleteQuest(Long questId, String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        if (admin.getRole() != User.Role.ADMIN) {
            throw new com.gamifiedpm.exception.AccessDeniedException("Admin role required");
        }

        Quest quest = questRepository.findById(questId)
            .orElseThrow(() -> new RuntimeException("Quest not found: " + questId));

        userQuestRepository.deleteByQuestId(questId);
        questRepository.delete(quest);
        log.info("Admin {} deleted quest {} ({})", adminEmail, questId, quest.getTitle());
    }

    @Transactional(readOnly = true)
    public List<AdminQuestEntry> getAllQuestsForAdmin(String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        if (admin.getRole() != User.Role.ADMIN) {
            throw new com.gamifiedpm.exception.AccessDeniedException("Admin role required");
        }

        return questRepository.findAll().stream()
            .map(q -> {
                AdminQuestEntry entry = new AdminQuestEntry();
                entry.setId(q.getId());
                entry.setTitle(q.getTitle());
                entry.setDescription(q.getDescription());
                entry.setType(q.getType() != null ? q.getType().name() : null);
                entry.setDifficulty(q.getDifficulty() != null ? q.getDifficulty().name() : null);
                entry.setStatus(q.getStatus() != null ? q.getStatus().name() : null);
                entry.setXpReward(q.getXpReward());
                entry.setTargetValue(q.getTargetValue());
                entry.setConditionType(q.getConditionType());
                entry.setStartDate(q.getStartDate());
                entry.setEndDate(q.getEndDate());
                entry.setIcon(q.getIcon());
                entry.setAssignedToUserEmail(
                    q.getAssignedToUser() != null ? q.getAssignedToUser().getEmail() : null);
                return entry;
            })
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<QuestDto> getUserQuestsForAdmin(Long targetUserId, String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        if (admin.getRole() != User.Role.ADMIN) {
            throw new com.gamifiedpm.exception.AccessDeniedException("Admin role required");
        }
        User target = userRepository.findById(targetUserId)
            .orElseThrow(() -> new RuntimeException("Target user not found"));

        return userQuestRepository.findByUserId(targetUserId).stream()
            .map(uq -> QuestDto.fromEntity(uq.getQuest(), uq))
            .collect(Collectors.toList());
    }

    @Transactional
    public void cleanupOldExpiredQuests() {
        LocalDate cutoff = LocalDate.now().minusDays(7);
        List<Quest> old = questRepository.findExpiredQuestsOlderThan(cutoff);
        for (Quest q : old) {
            userQuestRepository.deleteByQuestId(q.getId());
            questRepository.delete(q);
        }
        if (!old.isEmpty()) {
            log.info("Cleaned up {} old expired quests", old.size());
        }
    }

    private Quest createQuest(String title, String description, Quest.QuestType type,
                              int xpReward, int targetValue, String conditionType,
                              LocalDate startDate, Quest.Difficulty difficulty, String icon) {
        LocalDate endDate = type == Quest.QuestType.DAILY ? startDate.plusDays(1) : startDate.plusWeeks(1);

        Quest quest = Quest.builder()
            .title(title)
            .description(description)
            .type(type)
            .status(Quest.QuestStatus.ACTIVE)
            .xpReward(xpReward)
            .targetValue(targetValue)
            .currentProgress(0)
            .conditionType(conditionType)
            .startDate(startDate)
            .endDate(endDate)
            .difficulty(difficulty)
            .icon(icon)
            .build();

        return questRepository.save(quest);
    }

    private void createUserQuestIfNotExists(User user, Quest quest) {
        if (!userQuestRepository.findByUserAndQuest(user, quest).isPresent()) {
            UserQuest userQuest = UserQuest.builder()
                .user(user)
                .quest(quest)
                .currentProgress(0)
                .isCompleted(false)
                .build();
            userQuestRepository.save(userQuest);
        }
    }

    @Transactional
    public void checkExpiredQuests() {
        LocalDate today = LocalDate.now();
        List<Quest> expiredQuests = questRepository.findActiveQuestsWithExpiredEndDate(today);

        for (Quest quest : expiredQuests) {
            quest.setStatus(Quest.QuestStatus.EXPIRED);
            questRepository.save(quest);
            log.debug("Quest expired: {} (id: {})", quest.getTitle(), quest.getId());
        }

        if (!expiredQuests.isEmpty()) {
            log.info("Marked {} quests as expired", expiredQuests.size());
        }
    }

    @Data
    public static class AdminQuestEntry {
        private Long id;
        private String title;
        private String description;
        private String type;
        private String difficulty;
        private String status;
        private Integer xpReward;
        private Integer targetValue;
        private String conditionType;
        private LocalDate startDate;
        private LocalDate endDate;
        private String icon;
        private String assignedToUserEmail;
    }
}
