package com.gamifiedpm.dto.response;

import com.gamifiedpm.model.entity.Sprint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SprintDto {
    private Long id;
    private Long projectId;
    private String name;
    private String goal;
    private LocalDate startDate;
    private LocalDate endDate;
    private Sprint.SprintStatus status;
    private LocalDateTime createdAt;
    private int totalTasks;
    private int completedTasks;

    public static SprintDto fromEntity(Sprint sprint) {
        int total = sprint.getTasks() != null ? sprint.getTasks().size() : 0;
        int completed = sprint.getTasks() != null
            ? (int) sprint.getTasks().stream()
                .filter(t -> t.getStatus() == com.gamifiedpm.model.entity.Task.TaskStatus.COMPLETED)
                .count()
            : 0;
        return SprintDto.builder()
            .id(sprint.getId())
            .projectId(sprint.getProject().getId())
            .name(sprint.getName())
            .goal(sprint.getGoal())
            .startDate(sprint.getStartDate())
            .endDate(sprint.getEndDate())
            .status(sprint.getStatus())
            .createdAt(sprint.getCreatedAt())
            .totalTasks(total)
            .completedTasks(completed)
            .build();
    }
}
