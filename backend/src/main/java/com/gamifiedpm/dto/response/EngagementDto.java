package com.gamifiedpm.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EngagementDto {
    private int tasksCompletedLast7Days;
    private double averageTasksPerWeek;
    private int currentStreak;
    private int overdueTasksCount;
    private int totalTasksCount;
    private double overdueRate;
    private int xpLast7Days;
    private int totalXp;
    private int level;
    private boolean inactiveFor2Days;
    private String dayOfWeek;
    private String firstName;
}
