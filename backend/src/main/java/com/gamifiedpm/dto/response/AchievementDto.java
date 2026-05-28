package com.gamifiedpm.dto.response;

import com.gamifiedpm.model.entity.Achievement;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AchievementDto {
    private Long id;
    private String name;
    private String description;
    private String icon;
    private Achievement.Rarity rarity;
    private Integer xpReward;
    private String conditionType;
    private Boolean unlocked;
    private LocalDateTime unlockedAt;
    
    public static AchievementDto fromEntity(Achievement achievement, Boolean unlocked, LocalDateTime unlockedAt) {
        return AchievementDto.builder()
            .id(achievement.getId())
            .name(achievement.getName())
            .description(achievement.getDescription())
            .icon(achievement.getIcon())
            .rarity(achievement.getRarity())
            .xpReward(achievement.getXpReward())
            .conditionType(achievement.getConditionType())
            .unlocked(unlocked)
            .unlockedAt(unlockedAt)
            .build();
    }
}
