package com.gamifiedpm.dto.response;

import com.gamifiedpm.model.entity.Skill;
import com.gamifiedpm.model.entity.UserSkill;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SkillDto {
    private Long id;
    private String name;
    private String description;
    private String category;
    private String icon;
    private Integer maxLevel;
    private Integer level;
    private Integer experience;
    private Integer experienceToNextLevel;
    private Double progressPercentage;
    
    public static SkillDto fromEntity(Skill skill, UserSkill userSkill) {
        return SkillDto.builder()
            .id(skill.getId())
            .name(skill.getName())
            .description(skill.getDescription())
            .category(skill.getCategory())
            .icon(skill.getIcon())
            .maxLevel(skill.getMaxLevel())
            .level(userSkill.getLevel())
            .experience(userSkill.getExperience())
            .experienceToNextLevel(userSkill.getExperienceToNextLevel())
            .progressPercentage((double) userSkill.getExperience() / userSkill.getExperienceToNextLevel() * 100)
            .build();
    }
}
