package com.gamifiedpm.service;

import com.gamifiedpm.dto.response.SkillDto;
import com.gamifiedpm.model.entity.*;
import com.gamifiedpm.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SkillService {

    private final SkillRepository skillRepository;
    private final UserSkillRepository userSkillRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<SkillDto> getUserSkills(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<Skill> allSkills = skillRepository.findAll();
        
        return allSkills.stream()
            .map(skill -> {
                UserSkill userSkill = userSkillRepository.findByUserAndSkill(user, skill)
                    .orElse(UserSkill.builder()
                        .user(user)
                        .skill(skill)
                        .level(1)
                        .experience(0)
                        .experienceToNextLevel(100)
                        .build());
                
                return SkillDto.fromEntity(skill, userSkill);
            })
            .collect(Collectors.toList());
    }

    @Transactional
    public void awardSkillExperience(User user, String skillCategory, int experience) {
        try {
            List<Skill> skills = skillRepository.findByCategory(skillCategory);
            
            if (skills == null || skills.isEmpty()) {
                log.debug("No skills found for category: {}", skillCategory);
                return;
            }
            
            for (Skill skill : skills) {
                UserSkill userSkill = userSkillRepository.findByUserAndSkill(user, skill)
                .orElseGet(() -> {
                    UserSkill newUserSkill = UserSkill.builder()
                        .user(user)
                        .skill(skill)
                        .level(1)
                        .experience(0)
                        .experienceToNextLevel(100)
                        .build();
                    return userSkillRepository.save(newUserSkill);
                });
            
            int oldLevel = userSkill.getLevel();
            userSkill.addExperience(experience);
            userSkillRepository.save(userSkill);
            
            if (userSkill.getLevel() > oldLevel) {
                notificationService.createNotification(
                    user,
                    Notification.NotificationType.SKILL_LEVEL_UP,
                    "Навык улучшен!",
                    String.format("Ваш навык %s повысился до уровня %d!", 
                        skill.getName(), userSkill.getLevel()),
                    skill.getId(),
                    "SKILL"
                );
                }
            }
        } catch (Exception e) {
            log.error("Error awarding skill experience for user: {} category: {}", user.getEmail(), skillCategory, e);
        }
    }

    @Transactional
    public Skill addSkill(String name) {
        Skill skill = Skill.builder()
            .name(name)
            .description("")
            .category("CUSTOM")
            .icon("⚡")
            .maxLevel(10)
            .build();
        return skillRepository.save(skill);
    }

    @Transactional
    public void deleteSkill(Long skillId) {
        Skill skill = skillRepository.findById(skillId)
            .orElseThrow(() -> new RuntimeException("Skill not found"));
        userSkillRepository.deleteBySkill(skill);
        skillRepository.delete(skill);
    }

    @Transactional
    public void initializeSkills() {
        if (skillRepository.count() > 0) {
            return;
        }
        
        createSkill("Программирование", "Навыки разработки и кодирования", 
            "DEVELOPMENT", "💻", 10);
        createSkill("Тестирование", "Навыки тестирования и QA", 
            "DEVELOPMENT", "🧪", 10);
        
        createSkill("UI/UX Дизайн", "Навыки проектирования интерфейсов", 
            "DESIGN", "🎨", 10);
        
        createSkill("Управление проектами", "Навыки планирования и управления", 
            "MANAGEMENT", "📊", 10);
        createSkill("Лидерство", "Навыки руководства командой", 
            "MANAGEMENT", "👑", 10);
        
        createSkill("Коммуникация", "Навыки общения и взаимодействия", 
            "COMMUNICATION", "💬", 10);
        createSkill("Документирование", "Навыки создания документации", 
            "COMMUNICATION", "📝", 10);
    }

    private Skill createSkill(String name, String description, String category, 
                             String icon, int maxLevel) {
        Skill skill = Skill.builder()
            .name(name)
            .description(description)
            .category(category)
            .icon(icon)
            .maxLevel(maxLevel)
            .build();
        
        return skillRepository.save(skill);
    }
}
