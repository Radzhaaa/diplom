package com.gamifiedpm.service;

import com.gamifiedpm.model.entity.Task;
import com.gamifiedpm.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecurringTaskService {

    private final TaskRepository taskRepository;

    @Transactional
    public void generateRecurringTasks() {
        LocalDateTime now = LocalDateTime.now();
        List<Task> recurringTasks = taskRepository.findAll().stream()
            .filter(t -> t.getRecurrenceRule() != null
                && t.getRecurrenceRule() != Task.RecurrenceRule.NONE
                && t.getDeletedAt() == null
                && (t.getRecurrenceEndDate() == null || t.getRecurrenceEndDate().isAfter(now)))
            .toList();

        int created = 0;
        for (Task template : recurringTasks) {
            if (shouldCreateToday(template, now)) {
                Task copy = Task.builder()
                    .project(template.getProject())
                    .title(template.getTitle())
                    .description(template.getDescription())
                    .status(Task.TaskStatus.NEW)
                    .priority(template.getPriority())
                    .category(template.getCategory())
                    .assignedTo(template.getAssignedTo())
                    .createdBy(template.getCreatedBy())
                    .xpReward(template.getXpReward())
                    .estimatedHours(template.getEstimatedHours())
                    .recurrenceRule(Task.RecurrenceRule.NONE)
                    .build();
                taskRepository.save(copy);
                created++;
            }
        }
        if (created > 0) {
            log.info("Created {} recurring task copies", created);
        }
    }

    private boolean shouldCreateToday(Task task, LocalDateTime now) {
        LocalDateTime base = task.getCreatedAt();
        if (base == null) return false;
        return switch (task.getRecurrenceRule()) {
            case DAILY -> true;
            case WEEKLY -> base.getDayOfWeek() == now.getDayOfWeek();
            case MONTHLY -> base.getDayOfMonth() == now.getDayOfMonth();
            default -> false;
        };
    }
}
