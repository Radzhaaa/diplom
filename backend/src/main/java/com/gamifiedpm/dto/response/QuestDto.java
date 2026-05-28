package com.gamifiedpm.dto.response;

import com.gamifiedpm.model.entity.Quest;
import com.gamifiedpm.model.entity.UserQuest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestDto {
    private Long id;
    private String title;
    private String description;
    private Quest.QuestType type;
    private Quest.QuestStatus status;
    private Integer xpReward;
    private Integer targetValue;
    private Integer currentProgress;
    private Double progressPercentage;
    private String conditionType;
    private LocalDate startDate;
    private LocalDate endDate;
    private String icon;
    private Quest.Difficulty difficulty;
    private Boolean isCompleted;
    
    public static QuestDto fromEntity(Quest quest, UserQuest userQuest) {
        return QuestDto.builder()
            .id(quest.getId())
            .title(quest.getTitle())
            .description(quest.getDescription())
            .type(quest.getType())
            .status(quest.getStatus())
            .xpReward(quest.getXpReward())
            .targetValue(quest.getTargetValue())
            .currentProgress(userQuest.getCurrentProgress())
            .progressPercentage((double) userQuest.getCurrentProgress() / quest.getTargetValue() * 100)
            .conditionType(quest.getConditionType())
            .startDate(quest.getStartDate())
            .endDate(quest.getEndDate())
            .icon(quest.getIcon())
            .difficulty(quest.getDifficulty())
            .isCompleted(userQuest.getIsCompleted())
            .build();
    }
}
