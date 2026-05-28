package com.gamifiedpm.config;

import com.gamifiedpm.service.QuestService;
import com.gamifiedpm.service.RecurringTaskService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ScheduledTasksConfig {

    private final QuestService questService;
    private final RecurringTaskService recurringTaskService;

    @Scheduled(cron = "0 5 0 * * *")
    public void generateRecurringTasks() {
        log.info("Generating recurring tasks");
        try {
            recurringTaskService.generateRecurringTasks();
        } catch (Exception e) {
            log.error("Error generating recurring tasks", e);
        }
    }

    @Scheduled(cron = "0 0 0 * * *")
    public void generateDailyQuests() {
        log.info("Starting daily quests generation");
        try {
            questService.generateDailyQuests();
            log.info("Daily quests generation completed");
        } catch (Exception e) {
            log.error("Error generating daily quests", e);
        }
    }

    @Scheduled(cron = "0 0 0 * * MON")
    public void generateWeeklyQuests() {
        log.info("Starting weekly quests generation");
        try {
            questService.generateWeeklyQuests();
            log.info("Weekly quests generation completed");
        } catch (Exception e) {
            log.error("Error generating weekly quests", e);
        }
    }

    @Scheduled(cron = "0 0 * * * *")
    public void checkExpiredQuests() {
        log.debug("Checking for expired quests");
        try {
            questService.checkExpiredQuests();
        } catch (Exception e) {
            log.error("Error checking expired quests", e);
        }
    }

    @Scheduled(cron = "0 0 1 * * *")
    public void cleanupOldExpiredQuests() {
        log.info("Cleaning up old expired quests");
        try {
            questService.cleanupOldExpiredQuests();
        } catch (Exception e) {
            log.error("Error cleaning up expired quests", e);
        }
    }
}
