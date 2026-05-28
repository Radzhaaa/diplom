package com.gamifiedpm.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProjectCompetitionEntry {
    private Long projectId;
    private String projectName;
    private int rank;
    private long completedTasks;
    private long totalXp;
    private int memberCount;
}
