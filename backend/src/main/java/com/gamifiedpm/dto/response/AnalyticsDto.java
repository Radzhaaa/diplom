package com.gamifiedpm.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsDto {
    private UserStatsDto userStats;
    private ProjectStatsDto projectStats;
    private TaskStatsDto taskStats;
    private List<XpHistoryDto> xpHistory;
    private List<TaskCompletionDto> taskCompletionHistory;
    private Map<String, Long> tasksByPriority;
    private Map<String, Long> tasksByStatus;
    private List<ActivityHeatmapDto> activityHeatmap;
}

