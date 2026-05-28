package com.gamifiedpm.dto.request;

import com.gamifiedpm.model.entity.Quest;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateQuestRequest {
    private String title;
    private String description;
    private Quest.QuestType type;
    private Quest.Difficulty difficulty;
    private Integer xpReward;
    private Integer targetValue;
    private String conditionType;
    private LocalDate endDate;
    private String icon;
    private String assignedToUserEmail;
}
