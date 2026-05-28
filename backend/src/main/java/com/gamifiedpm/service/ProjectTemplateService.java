package com.gamifiedpm.service;

import com.gamifiedpm.dto.request.CreateProjectFromTemplateRequest;
import com.gamifiedpm.dto.response.ProjectDto;
import com.gamifiedpm.dto.response.ProjectTemplateDto;
import com.gamifiedpm.dto.response.ProjectTemplateDto.TemplateTaskDto;
import com.gamifiedpm.exception.ResourceNotFoundException;
import com.gamifiedpm.model.entity.Project;
import com.gamifiedpm.model.entity.Task;
import com.gamifiedpm.model.entity.User;
import com.gamifiedpm.repository.ProjectRepository;
import com.gamifiedpm.repository.TaskRepository;
import com.gamifiedpm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectTemplateService {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;


    private static final List<ProjectTemplateDto> TEMPLATES = List.of(

        new ProjectTemplateDto(
            "scrum-sprint",
            "Scrum Sprint",
            "Классический двухнедельный спринт по методологии Scrum с планированием, ежедневными стендапами и ретроспективой",
            "🏃",
            "Agile",
            List.of(
                new TemplateTaskDto("Sprint Planning", "Провести планирование спринта, определить цели и разбить задачи на подзадачи", "HIGH", 0),
                new TemplateTaskDto("Настройка окружения", "Подготовить dev/staging окружения, настроить CI/CD pipeline", "HIGH", 1),
                new TemplateTaskDto("Daily Standup #1", "Ежедневный стендап: что сделано, что планируется, есть ли блокеры", "MEDIUM", 1),
                new TemplateTaskDto("Разработка ключевых фич", "Реализовать основные пользовательские истории спринта", "HIGH", 3),
                new TemplateTaskDto("Code Review", "Провести ревью кода всех PR спринта", "MEDIUM", 8),
                new TemplateTaskDto("QA тестирование", "Функциональное и регрессионное тестирование реализованных фич", "HIGH", 10),
                new TemplateTaskDto("Sprint Demo", "Демонстрация результатов спринта заинтересованным сторонам", "MEDIUM", 13),
                new TemplateTaskDto("Retrospective", "Ретроспектива: что прошло хорошо, что улучшить, action items", "MEDIUM", 14)
            )
        ),

        new ProjectTemplateDto(
            "feature-release",
            "Feature Release",
            "Полный цикл разработки и выпуска новой фичи: от требований до мониторинга в продакшне",
            "🚀",
            "Release",
            List.of(
                new TemplateTaskDto("Сбор требований", "Интервью с заказчиком, написание PRD, acceptance criteria", "HIGH", 0),
                new TemplateTaskDto("Дизайн и прототип", "Создать wireframes и hi-fi прототип в Figma", "HIGH", 3),
                new TemplateTaskDto("Архитектурное ревью", "Обсудить и утвердить технический подход, API контракты", "HIGH", 5),
                new TemplateTaskDto("Backend разработка", "Реализовать серверную логику, API эндпоинты, миграции БД", "HIGH", 7),
                new TemplateTaskDto("Frontend разработка", "Реализовать UI компоненты и интеграцию с API", "HIGH", 10),
                new TemplateTaskDto("Написание тестов", "Unit, integration и e2e тесты для новой функциональности", "HIGH", 14),
                new TemplateTaskDto("Performance тестирование", "Load testing, профилирование, оптимизация узких мест", "MEDIUM", 16),
                new TemplateTaskDto("Security Review", "Проверка на уязвимости OWASP Top 10, pen testing", "HIGH", 17),
                new TemplateTaskDto("Staging деплой и UAT", "Деплой на staging, пользовательское приёмочное тестирование", "HIGH", 19),
                new TemplateTaskDto("Production деплой", "Feature flag rollout, мониторинг метрик, rollback план", "CRITICAL", 21),
                new TemplateTaskDto("Post-release мониторинг", "Отслеживание ошибок, метрик производительности, обратной связи", "MEDIUM", 22)
            )
        ),

        new ProjectTemplateDto(
            "onboarding",
            "Onboarding нового сотрудника",
            "Структурированный процесс адаптации нового члена команды: от оформления до полноценной работы",
            "👋",
            "HR",
            List.of(
                new TemplateTaskDto("Подготовка рабочего места", "Настроить ноутбук, создать корпоративные аккаунты, выдать доступы", "HIGH", 0),
                new TemplateTaskDto("Welcome встреча с командой", "Познакомить с командой, рассказать о процессах и культуре", "HIGH", 0),
                new TemplateTaskDto("Изучение продукта", "Обзор продукта, архитектуры, технологического стека", "MEDIUM", 1),
                new TemplateTaskDto("Настройка dev окружения", "Клонировать репозитории, настроить IDE, запустить проект локально", "HIGH", 2),
                new TemplateTaskDto("Первая задача (Good First Issue)", "Выбрать и выполнить несложную задачу для знакомства с кодовой базой", "MEDIUM", 3),
                new TemplateTaskDto("Знакомство с процессами", "Git flow, code review процесс, deployment pipeline, документация", "MEDIUM", 5),
                new TemplateTaskDto("1-on-1 с ментором", "Промежуточная проверка: вопросы, трудности, планы", "MEDIUM", 7),
                new TemplateTaskDto("Первый самостоятельный PR", "Разработать и влить первый PR без помощи ментора", "HIGH", 10),
                new TemplateTaskDto("Итоговый review", "Оценка прогресса за первые 2 недели, постановка целей на месяц", "MEDIUM", 14)
            )
        ),

        new ProjectTemplateDto(
            "bug-bash",
            "Bug Bash",
            "Интенсивная сессия поиска и исправления багов перед релизом. Вся команда тестирует продукт",
            "🐛",
            "QA",
            List.of(
                new TemplateTaskDto("Подготовка тест-плана", "Составить список сценариев, распределить области между участниками", "HIGH", 0),
                new TemplateTaskDto("Настройка тестовых данных", "Заполнить staging тестовыми данными, создать тестовые аккаунты", "HIGH", 0),
                new TemplateTaskDto("Bug Bash сессия", "4-часовая сессия: все тестируют, фиксируют баги в трекере", "HIGH", 1),
                new TemplateTaskDto("Приоритизация найденных багов", "Разобрать баги: P0/P1 фиксим до релиза, P2/P3 в backlog", "HIGH", 1),
                new TemplateTaskDto("Исправление критических багов", "Фиксить P0 и P1 баги, PR + review", "CRITICAL", 2),
                new TemplateTaskDto("Регрессионное тестирование", "Проверить исправленные баги, smoke test всего приложения", "HIGH", 4),
                new TemplateTaskDto("Go/No-Go решение", "Финальное совещание: готовы ли к релизу", "HIGH", 5)
            )
        )
    );

    private static final Map<String, ProjectTemplateDto> TEMPLATES_BY_ID;
    static {
        TEMPLATES_BY_ID = new java.util.HashMap<>();
        for (ProjectTemplateDto t : TEMPLATES) {
            TEMPLATES_BY_ID.put(t.id(), t);
        }
    }


    public List<ProjectTemplateDto> getAllTemplates() {
        return TEMPLATES;
    }

    @Transactional
    public ProjectDto createFromTemplate(String templateId,
                                         CreateProjectFromTemplateRequest request,
                                         String userEmail) {
        ProjectTemplateDto template = TEMPLATES_BY_ID.get(templateId);
        if (template == null) {
            throw new ResourceNotFoundException("Template not found: " + templateId);
        }

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String projectName = (request.name() != null && !request.name().isBlank())
                ? request.name().trim()
                : template.name();
        String projectDesc = (request.description() != null && !request.description().isBlank())
                ? request.description().trim()
                : template.description();

        Project project = projectRepository.save(Project.builder()
                .name(projectName)
                .description(projectDesc)
                .createdBy(user)
                .organization(user.getOrganization())
                .build());

        LocalDateTime now = LocalDateTime.now();
        for (TemplateTaskDto taskDef : template.tasks()) {
            LocalDateTime deadline = now.plusDays(taskDef.daysOffset());
            Task task = Task.builder()
                    .title(taskDef.title())
                    .description(taskDef.description())
                    .priority(Task.Priority.valueOf(taskDef.priority()))
                    .status(Task.TaskStatus.NEW)
                    .project(project)
                    .deadline(deadline)
                    .build();
            taskRepository.save(task);
        }

        log.info("Project '{}' created from template '{}' by {}", projectName, templateId, userEmail);
        return ProjectDto.fromEntity(project, template.tasks().size(), 0L);
    }
}
