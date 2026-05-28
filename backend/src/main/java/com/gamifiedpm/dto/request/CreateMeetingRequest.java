package com.gamifiedpm.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class CreateMeetingRequest {
    @NotBlank(message = "Название встречи обязательно")
    private String title;
    private String description;
    private Long projectId;
    @NotNull(message = "Дата и время встречи обязательны")
    private LocalDateTime dateTime;
    private int durationMinutes = 60;
    private List<Long> participantIds;
}
