package com.gamifiedpm.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserStatsDto {
    private Integer totalXp;
    private Integer level;
    private Integer currentStreak;
    private Long totalTasksCompleted;
    private Long totalProjectsCompleted;
    private Integer rank;
}
