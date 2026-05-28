package com.gamifiedpm.dto.response;

import com.gamifiedpm.model.entity.Project;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectDto {
    private Long id;
    private String name;
    private String description;
    private Project.ProjectStatus status;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private UserDto createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Double progress;
    private Long totalTasks;
    private Long completedTasks;
    private Long organizationId;
    private Long memberCount;
    
    public static ProjectDto fromEntity(Project project, long totalTasks, long completedTasks) {
        if (project == null) return null;
        UserDto createdByDto = project.getCreatedBy() != null
            ? UserDto.fromEntity(project.getCreatedBy())
            : null;
        return ProjectDto.builder()
            .id(project.getId())
            .name(project.getName())
            .description(project.getDescription())
            .status(project.getStatus())
            .startDate(project.getStartDate())
            .endDate(project.getEndDate())
            .createdBy(createdByDto)
            .createdAt(project.getCreatedAt())
            .updatedAt(project.getUpdatedAt())
            .progress(0.0)
            .totalTasks(totalTasks)
            .completedTasks(completedTasks)
            .organizationId(project.getOrganization() != null ? project.getOrganization().getId() : null)
            .build();
    }

    public static ProjectDto fromEntity(Project project) {
        if (project == null) return null;
        UserDto createdByDto = project.getCreatedBy() != null
            ? UserDto.fromEntity(project.getCreatedBy())
            : null;
        double progress = 0.0;
        long totalTasks = 0;
        long completedTasks = 0;
        try {
            progress = project.calculateProgress();
            if (project.getTasks() != null) {
                totalTasks = project.getTasks().size();
                completedTasks = project.getTasks().stream()
                    .filter(task -> task.getStatus() == com.gamifiedpm.model.entity.Task.TaskStatus.COMPLETED)
                    .count();
            }
        } catch (Exception e) {
        }
        return ProjectDto.builder()
            .id(project.getId())
            .name(project.getName())
            .description(project.getDescription())
            .status(project.getStatus())
            .startDate(project.getStartDate())
            .endDate(project.getEndDate())
            .createdBy(createdByDto)
            .createdAt(project.getCreatedAt())
            .updatedAt(project.getUpdatedAt())
            .progress(progress)
            .totalTasks(totalTasks)
            .completedTasks(completedTasks)
            .organizationId(project.getOrganization() != null ? project.getOrganization().getId() : null)
            .build();
    }
}
