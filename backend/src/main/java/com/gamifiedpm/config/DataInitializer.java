package com.gamifiedpm.config;

import com.gamifiedpm.model.entity.Achievement;
import com.gamifiedpm.model.entity.User;
import com.gamifiedpm.repository.AchievementRepository;
import com.gamifiedpm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final AchievementRepository achievementRepository;
    private final com.gamifiedpm.repository.SkillRepository skillRepository;
    private final com.gamifiedpm.repository.QuestRepository questRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (achievementRepository.count() == 0) {
            initializeAchievements();
            log.info("Achievements initialized");
        }
        
        if (skillRepository.count() == 0) {
            initializeSkills();
            log.info("Skills initialized");
        }
        
        initializeAdminUser();
        
    }
    
    private void initializeAdminUser() {
        if (!userRepository.existsByEmail("admin@example.com")) {
            User admin = User.builder()
                .email("admin@example.com")
                .passwordHash(passwordEncoder.encode("admin123"))
                .firstName("Администратор")
                .lastName("Системы")
                .role(User.Role.ADMIN)
                .level(1)
                .totalXp(0)
                .currentStreak(0)
                .emailVerified(true)
                .build();
            
            userRepository.save(admin);
            log.info("Admin user created: admin@example.com / admin123");
        }
    }
    
    private void initializeSkills() {
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
    
    private void createSkill(String name, String description, String category, 
                             String icon, int maxLevel) {
        com.gamifiedpm.model.entity.Skill skill = com.gamifiedpm.model.entity.Skill.builder()
            .name(name)
            .description(description)
            .category(category)
            .icon(icon)
            .maxLevel(maxLevel)
            .build();
        
        skillRepository.save(skill);
    }

    private void initializeAchievements() {
        Achievement firstTask = Achievement.builder()
            .name("Первые шаги")
            .description("Завершите свою первую задачу")
            .icon("🎯")
            .rarity(Achievement.Rarity.COMMON)
            .xpReward(50)
            .conditionType("FIRST_TASK_COMPLETED")
            .conditionParams("{\"tasks\": 1}")
            .build();

        Achievement tasks10 = Achievement.builder()
            .name("Начало пути")
            .description("Завершите 10 задач")
            .icon("⭐")
            .rarity(Achievement.Rarity.COMMON)
            .xpReward(100)
            .conditionType("TASKS_COMPLETED_10")
            .conditionParams("{\"tasks\": 10}")
            .build();

        Achievement tasks50 = Achievement.builder()
            .name("Опытный работник")
            .description("Завершите 50 задач")
            .icon("🏆")
            .rarity(Achievement.Rarity.RARE)
            .xpReward(250)
            .conditionType("TASKS_COMPLETED_50")
            .conditionParams("{\"tasks\": 50}")
            .build();

        Achievement tasks100 = Achievement.builder()
            .name("Мастер продуктивности")
            .description("Завершите 100 задач")
            .icon("👑")
            .rarity(Achievement.Rarity.EPIC)
            .xpReward(500)
            .conditionType("TASKS_COMPLETED_100")
            .conditionParams("{\"tasks\": 100}")
            .build();

        Achievement level10 = Achievement.builder()
            .name("Восходящая звезда")
            .description("Достигните 10 уровня")
            .icon("🌟")
            .rarity(Achievement.Rarity.RARE)
            .xpReward(300)
            .conditionType("LEVEL_REACHED_10")
            .conditionParams("{\"level\": 10}")
            .build();

        Achievement level20 = Achievement.builder()
            .name("Легенда")
            .description("Достигните 20 уровня")
            .icon("💎")
            .rarity(Achievement.Rarity.LEGENDARY)
            .xpReward(1000)
            .conditionType("LEVEL_REACHED_20")
            .conditionParams("{\"level\": 20}")
            .build();

        Achievement streak30 = Achievement.builder()
            .name("Марафонец")
            .description("Поддерживайте серию в 30 дней")
            .icon("🏃")
            .rarity(Achievement.Rarity.EPIC)
            .xpReward(400)
            .conditionType("STREAK_30_DAYS")
            .conditionParams("{\"days\": 30}")
            .build();

        achievementRepository.save(firstTask);
        achievementRepository.save(tasks10);
        achievementRepository.save(tasks50);
        achievementRepository.save(tasks100);
        achievementRepository.save(level10);
        achievementRepository.save(level20);
        achievementRepository.save(streak30);
    }
}
