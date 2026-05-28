package com.gamifiedpm.dto.request;

import com.gamifiedpm.model.entity.PersonalTask;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CreatePersonalTaskRequest {
    @NotBlank(message = "Название задачи обязательно")
    private String title;
    private String description;
    private PersonalTask.Priority priority;
    private PersonalTask.Status status;
    private LocalDateTime deadline;
}
