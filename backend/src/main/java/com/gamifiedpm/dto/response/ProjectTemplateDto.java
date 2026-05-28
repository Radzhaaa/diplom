package com.gamifiedpm.dto.response;

import java.util.List;

public record ProjectTemplateDto(
        String id,
        String name,
        String description,
        String icon,
        String category,
        List<TemplateTaskDto> tasks) {

    public record TemplateTaskDto(
            String title,
            String description,
            String priority,
            int daysOffset) {
    }
}
