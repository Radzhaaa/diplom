package com.gamifiedpm.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskStatsDto {
    private Long totalTasks;
    private Long completedTasks;
    private Long inProgressTasks;
    private Long overdueTasks;
    private Double completionRate;
    private Double averageCompletionTime;
}
