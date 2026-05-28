package com.gamifiedpm.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateProjectRequest {

    @NotBlank(message = "Название проекта обязательно")
    @Size(min = 3, max = 100, message = "Название должно содержать от 3 до 100 символов")
    private String name;

    @Size(max = 1000, message = "Описание не должно превышать 1000 символов")
    private String description;

    private LocalDate startDate;
    private LocalDate endDate;
}
