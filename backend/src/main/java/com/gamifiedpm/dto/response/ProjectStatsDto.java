package com.gamifiedpm.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectStatsDto {
    private Long totalProjects;
    private Long activeProjects;
    private Long completedProjects;
    private Double averageProgress;
}
