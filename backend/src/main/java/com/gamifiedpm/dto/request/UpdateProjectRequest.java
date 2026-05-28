package com.gamifiedpm.dto.request;

import com.gamifiedpm.model.entity.Project;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateProjectRequest {
    private String name;
    private String description;
    private Project.ProjectStatus status;
    private LocalDate startDate;
    private LocalDate endDate;
}
