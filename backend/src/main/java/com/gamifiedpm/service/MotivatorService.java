package com.gamifiedpm.service;

import com.gamifiedpm.dto.response.AiChatResponse;
import com.gamifiedpm.dto.response.EngagementDto;
import com.gamifiedpm.model.entity.ActivityLog;
import com.gamifiedpm.model.entity.Task;
import com.gamifiedpm.model.entity.User;
import com.gamifiedpm.repository.ActivityLogRepository;
import com.gamifiedpm.repository.TaskRepository;
import com.gamifiedpm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class MotivatorService {

    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final ActivityLogRepository activityLogRepository;
    private final LlmClient llmClient;

    @Transactional(readOnly = true)
    public EngagementDto getEngagementMetrics(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));

        List<Task> tasks = taskRepository.findByAssignedTo(user);
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        LocalDateTime twoDaysAgo = LocalDateTime.now().minusDays(2);
        LocalDateTime now = LocalDateTime.now();

        long completedLast7Days = tasks.stream()
            .filter(t -> t.getStatus() == Task.TaskStatus.COMPLETED
                && t.getCompletedAt() != null
                && t.getCompletedAt().isAfter(sevenDaysAgo))
            .count();

        long overdueCount = tasks.stream()
            .filter(t -> t.getStatus() != Task.TaskStatus.COMPLETED
                && t.getDeadline() != null
                && t.getDeadline().isBefore(now))
            .count();

        boolean inactiveFor2Days = user.getLastActivityDate() == null
            || user.getLastActivityDate().isBefore(twoDaysAgo);

        List<ActivityLog> xpLogs = activityLogRepository.findXpEventsByUserAndPeriod(
            user, sevenDaysAgo, now);
        int xpLast7Days = xpLogs.stream()
            .mapToInt(l -> parseXp(l.getMetadata()))
            .sum();

        LocalDateTime fourWeeksAgo = LocalDateTime.now().minusWeeks(4);
        long completedLast4Weeks = tasks.stream()
            .filter(t -> t.getStatus() == Task.TaskStatus.COMPLETED
                && t.getCompletedAt() != null
                && t.getCompletedAt().isAfter(fourWeeksAgo))
            .count();
        double avgPerWeek = completedLast4Weeks / 4.0;

        String dayOfWeek = now.getDayOfWeek().name();

        return EngagementDto.builder()
            .tasksCompletedLast7Days((int) completedLast7Days)
            .averageTasksPerWeek(avgPerWeek)
            .currentStreak(user.getCurrentStreak() != null ? user.getCurrentStreak() : 0)
            .overdueTasksCount((int) overdueCount)
            .totalTasksCount(tasks.size())
            .overdueRate(tasks.isEmpty() ? 0.0 : (double) overdueCount / tasks.size() * 100)
            .xpLast7Days(xpLast7Days)
            .totalXp(user.getTotalXp() != null ? user.getTotalXp() : 0)
            .level(user.getLevel() != null ? user.getLevel() : 1)
            .inactiveFor2Days(inactiveFor2Days)
            .dayOfWeek(dayOfWeek)
            .firstName(user.getFirstName())
            .build();
    }

    @Transactional(readOnly = true)
    public AiChatResponse generateMotivatorMessage(String userEmail, String userMessage) {
        EngagementDto metrics = getEngagementMetrics(userEmail);

        String systemPrompt = buildMotivatorSystemPrompt(metrics);

        String messageToSend = userMessage.isBlank()
            ? buildProactiveMessage(metrics)
            : userMessage;

        String llmResponse = llmClient.chat(systemPrompt,
            List.of(Map.of("role", "user", "content", messageToSend)));

        if (llmResponse == null || llmResponse.isBlank()) {
            llmResponse = buildFallbackMessage(metrics);
        }

        return AiChatResponse.builder()
            .message(llmResponse)
            .suggestions(buildSuggestions(metrics))
            .build();
    }

    private String buildMotivatorSystemPrompt(EngagementDto m) {
        return String.format("""
            Ты — дружелюбный агент-мотиватор для платформы управления проектами XProject.
            Твоя роль: поддерживать, мотивировать и помогать разработчикам оставаться продуктивными.
            Говори кратко, тепло и по-человечески. Используй конкретные цифры из метрик.

            Текущие метрики пользователя %s:
            - Задач выполнено за 7 дней: %d (среднее %.1f/нед)
            - Стрик активности: %d дней подряд
            - Просроченных задач: %d (%.0f%% от всех)
            - XP за 7 дней: %d
            - Уровень: %d, всего XP: %d
            - Неактивен 2+ дней: %s
            - День недели: %s

            Отвечай на русском языке. Будь конкретным и воодушевляющим.
            """,
            m.getFirstName(),
            m.getTasksCompletedLast7Days(), m.getAverageTasksPerWeek(),
            m.getCurrentStreak(),
            m.getOverdueTasksCount(), m.getOverdueRate(),
            m.getXpLast7Days(),
            m.getLevel(), m.getTotalXp(),
            m.isInactiveFor2Days() ? "да" : "нет",
            m.getDayOfWeek()
        );
    }

    private String buildProactiveMessage(EngagementDto m) {
        if (m.isInactiveFor2Days()) {
            return String.format("Привет, %s! Я заметил, что ты не был активен пару дней. Как дела? Давай проверим твои задачи.", m.getFirstName());
        }
        if (m.getTasksCompletedLast7Days() > m.getAverageTasksPerWeek() * 1.5) {
            return String.format("Расскажи мне о своей продуктивности! Ты выполнил %d задач за последнюю неделю — это отлично!", m.getTasksCompletedLast7Days());
        }
        if (m.getOverdueTasksCount() > 2) {
            return String.format("Привет, %s! У тебя есть %d просроченных задач. Хочешь обсудить, как их приоритизировать?", m.getFirstName(), m.getOverdueTasksCount());
        }
        if ("FRIDAY".equals(m.getDayOfWeek())) {
            return String.format("Пятница! Отличный момент для недельного check-in. %s, как прошла эта неделя?", m.getFirstName());
        }
        return String.format("Привет, %s! Чем могу помочь сегодня?", m.getFirstName());
    }

    private String buildFallbackMessage(EngagementDto m) {
        if (m.getTasksCompletedLast7Days() > 5) {
            return String.format("Отличная работа, %s! %d задач за неделю — ты в ударе! 🚀", m.getFirstName(), m.getTasksCompletedLast7Days());
        }
        if (m.getCurrentStreak() > 3) {
            return String.format("Привет, %s! Стрик %d дней — так держать! Каждый день приближает к цели.", m.getFirstName(), m.getCurrentStreak());
        }
        if (m.getOverdueTasksCount() > 0) {
            return String.format("Привет, %s! Давай разберёмся с %d просроченными задачами — выбери одну и начни с неё.", m.getFirstName(), m.getOverdueTasksCount());
        }
        return String.format("Привет, %s! Готов помочь тебе быть продуктивным сегодня. Что тебя беспокоит?", m.getFirstName());
    }

    private List<String> buildSuggestions(EngagementDto m) {
        java.util.List<String> suggestions = new java.util.ArrayList<>();
        if (m.getOverdueTasksCount() > 0) suggestions.add("Как приоритизировать просроченные задачи?");
        if (m.getCurrentStreak() > 0) suggestions.add("Как поддержать стрик активности?");
        suggestions.add("Что сделать сегодня для роста продуктивности?");
        suggestions.add("Как заработать больше XP?");
        return suggestions.subList(0, Math.min(4, suggestions.size()));
    }

    private int parseXp(String metadata) {
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
}
