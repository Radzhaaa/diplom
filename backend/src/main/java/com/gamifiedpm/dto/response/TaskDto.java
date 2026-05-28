package com.gamifiedpm.dto.response;

import com.gamifiedpm.model.entity.Task;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskDto {
    private Long id;
    private Long projectId;
    private String title;
    private String description;
    private Task.TaskStatus status;
    private Task.Priority priority;
    private LocalDateTime deadline;
    private UserDto createdBy;
    private UserDto assignedTo;
    private List<UserDto> coExecutors;
    private List<UserDto> observers;
    private Integer xpReward;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean isOverdue;
    private Boolean isCompletedOnTime;
    private List<TaskChecklistItemDto> checklistItems;
    private Long sprintId;
    private List<Long> blockedBy;
    private List<Long> blocks;
    private List<String> tags;
    private Integer estimatedHours;
    private Task.RecurrenceRule recurrenceRule;
    private LocalDateTime recurrenceEndDate;

    public static TaskDto fromEntity(Task task) {
        return TaskDto.builder()
            .id(task.getId())
            .projectId(task.getProject().getId())
            .title(task.getTitle())
            .description(task.getDescription())
            .status(task.getStatus())
            .priority(task.getPriority())
            .deadline(task.getDeadline())
            .createdBy(UserDto.fromEntity(task.getCreatedBy()))
            .assignedTo(task.getAssignedTo() != null ? UserDto.fromEntity(task.getAssignedTo()) : null)
            .coExecutors(task.getCoExecutors() != null
                ? task.getCoExecutors().stream().map(UserDto::fromEntity).collect(Collectors.toList())
                : List.of())
            .observers(task.getObservers() != null
                ? task.getObservers().stream().map(UserDto::fromEntity).collect(Collectors.toList())
                : List.of())
            .xpReward(task.getXpReward())
            .completedAt(task.getCompletedAt())
            .createdAt(task.getCreatedAt())
            .updatedAt(task.getUpdatedAt())
            .isOverdue(task.isOverdue())
            .isCompletedOnTime(task.isCompletedOnTime())
            .checklistItems(task.getChecklistItems() != null
                ? task.getChecklistItems().stream()
                    .map(TaskChecklistItemDto::fromEntity)
                    .collect(Collectors.toList())
                : new ArrayList<>())
            .sprintId(task.getSprint() != null ? task.getSprint().getId() : null)
            .blockedBy(List.of())
            .blocks(List.of())
            .tags(task.getTags() != null ? new ArrayList<>(task.getTags()) : new ArrayList<>())
            .estimatedHours(task.getEstimatedHours())
            .recurrenceRule(task.getRecurrenceRule())
            .recurrenceEndDate(task.getRecurrenceEndDate())
            .build();
    }

    public static TaskDto fromEntityWithDeps(Task task, List<Long> blockedBy, List<Long> blocks) {
        TaskDto dto = fromEntity(task);
        dto.setBlockedBy(blockedBy);
        dto.setBlocks(blocks);
        return dto;
    }
}
