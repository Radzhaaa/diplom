package com.gamifiedpm.dto.request;

import com.gamifiedpm.model.entity.Task;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class CreateTaskRequest {
    
    @NotNull(message = "ID проекта обязателен")
    private Long projectId;
    
    @NotBlank(message = "Название задачи обязательно")
    @Size(min = 3, max = 200, message = "Название должно содержать от 3 до 200 символов")
    private String title;
    
    @Size(max = 2000, message = "Описание не должно превышать 2000 символов")
    private String description;
    
    @NotNull(message = "Приоритет обязателен")
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
