package com.gamifiedpm.dto.request;

import jakarta.validation.constraints.NotBlank;

public record CreateProjectFromTemplateRequest(
        @NotBlank(message = "Название проекта обязательно") String name,
        String description) {
}
