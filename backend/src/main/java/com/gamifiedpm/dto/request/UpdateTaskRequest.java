package com.gamifiedpm.dto.request;

import com.gamifiedpm.model.entity.Task;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class UpdateTaskRequest {
    private String title;
    private String description;
    private Task.TaskStatus status;
    private Task.Priority priority;
    private Task.TaskCategory category;
    private LocalDateTime deadline;
    private Long assignedToId;
    private List<Long> coExecutorIds;
    private List<Long> observerIds;
    private Integer xpReward;
    private List<String> tags;
    private Integer estimatedHours;
    private com.gamifiedpm.model.entity.Task.RecurrenceRule recurrenceRule;
    private java.time.LocalDateTime recurrenceEndDate;
}
