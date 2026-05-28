package com.gamifiedpm.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardEntryDto {
    private UserDto user;
    private Integer rank;
    private Integer totalXp;
    private Integer level;
    private Long completedTasks;
    private Integer streak;
    private Integer change;
}
