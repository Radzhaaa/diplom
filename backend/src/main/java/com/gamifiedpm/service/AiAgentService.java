package com.gamifiedpm.service;

import com.gamifiedpm.dto.request.AiChatRequest;
import com.gamifiedpm.dto.response.AiChatResponse;
import com.gamifiedpm.dto.response.SuggestedMilestoneDto;
import com.gamifiedpm.exception.AccessDeniedException;
import com.gamifiedpm.model.entity.*;
import com.gamifiedpm.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.gamifiedpm.dto.response.RiskItemDto;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiAgentService {

    private final ContextBuilderService contextBuilderService;
    private final UserRepository userRepository;
    private final AiConversationRepository conversationRepository;
    private final AiMessageRepository messageRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final PermissionService permissionService;
    private final LlmClient llmClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.ai.enabled:false}")
    private Boolean aiEnabled;

    @Transactional
    public AiChatResponse chat(AiChatRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        AiConversation conversation = getOrCreateConversation(
            user,
            request.getConversationId(),
            request.getContextType(),
            request.getContextId()
        );
        AiMessage userMessage = AiMessage.builder()
            .conversation(conversation)
            .role(AiMessage.MessageRole.USER)
            .content(request.getMessage())
            .build();
        messageRepository.save(userMessage);
        Map<String, Object> context = buildContext(user, request.getContextType(), request.getContextId());
        String response = generateResponse(request.getMessage(), context, conversation);
        AiMessage aiMessage = AiMessage.builder()
            .conversation(conversation)
            .role(AiMessage.MessageRole.ASSISTANT)
            .content(response)
            .build();
        messageRepository.save(aiMessage);
        
        return AiChatResponse.builder()
            .message(response)
            .conversationId(conversation.getId())
            .suggestions(generateSuggestions(context))
            .build();
    }

    private AiConversation getOrCreateConversation(User user, Long conversationId, String contextType, Long contextId) {
        if (conversationId != null) {
            return conversationRepository.findById(conversationId)
                .filter(c -> c.getUser().getId().equals(user.getId()))
                .orElseGet(() -> createNewConversation(user, contextType, contextId));
        }
        if (contextType != null && contextId != null) {
            List<AiConversation> existing = conversationRepository
                .findByUserAndContextTypeAndContextId(user, contextType, contextId);
            if (!existing.isEmpty()) {
                return existing.get(0);
            }
        }
        return createNewConversation(user, contextType, contextId);
    }

    private AiConversation createNewConversation(User user, String contextType, Long contextId) {
        AiConversation conversation = AiConversation.builder()
            .user(user)
            .contextType(contextType)
            .contextId(contextId)
            .title("Новый разговор")
            .build();
        return conversationRepository.save(conversation);
    }

    private Map<String, Object> buildContext(User user, String contextType, Long contextId) {
        Map<String, Object> context = new HashMap<>();
        context.put("user", contextBuilderService.buildUserContext(user));
        
        if (contextType != null && contextId != null) {
            switch (contextType) {
                case "PROJECT":
                    Project project = projectRepository.findById(contextId)
                        .orElse(null);
                    if (project != null) {
                        context.put("project", contextBuilderService.buildProjectContext(project));
                        context.put("_projectEntity", project);
                    }
                    break;
                case "TASK":
                    Task task = taskRepository.findById(contextId)
                        .orElse(null);
                    if (task != null) {
                        context.put("task", contextBuilderService.buildTaskContext(task));
                    }
                    break;
            }
        }
        
        return context;
    }

    private String generateResponse(String message, Map<String, Object> context, AiConversation conversation) {
        if (Boolean.TRUE.equals(aiEnabled)) {
            String systemPrompt = buildSystemPrompt(context);
            List<Map<String, String>> history = buildMessageHistory(conversation, message);
            String llmResponse = llmClient.chat(systemPrompt, history);
            if (llmResponse != null && !llmResponse.isBlank()) {
                return llmResponse;
            }
            log.warn("LLM returned empty response, falling back to stub");
        }

        String lowerMessage = message.toLowerCase();
        if (lowerMessage.contains("задача") || lowerMessage.contains("task")) {
            return "Я вижу, что вы спрашиваете о задачах. Хотите, чтобы я помог приоритизировать их или создать новую задачу?";
        }
        if (lowerMessage.contains("проект") || lowerMessage.contains("project")) {
            return "Я могу помочь с управлением проектами. Что именно вас интересует: прогресс, сроки или состав команды?";
        }
        if (lowerMessage.contains("статистика") || lowerMessage.contains("stats")) {
            return "Ваша статистика доступна в разделе «Аналитика». Хотите, чтобы я объяснил какой-то показатель?";
        }
        return "Я ваш AI-помощник в XProject. Могу помочь с задачами, проектами и аналитикой. Что вас интересует?";
    }

    private String buildSystemPrompt(Map<String, Object> context) {
        StringBuilder sb = new StringBuilder();
        sb.append("Ты AI PM-помощник в системе управления проектами XProject. ");
        sb.append("Отвечай на русском языке, кратко и по делу. ");
        sb.append("Помогай с планированием задач, анализом прогресса и управлением командой.\n\n");
        sb.append("Контекст:\n");
        if (context.containsKey("user")) sb.append("Пользователь: ").append(context.get("user")).append("\n");
        if (context.containsKey("project")) {
            sb.append("Проект: ").append(context.get("project")).append("\n");
            Object projectEntity = context.get("_projectEntity");
            if (projectEntity instanceof Project p) {
                try {
                    List<Task> projectTasks = taskRepository.findByProjectAndDeletedAtIsNull(p);
                    long inProgress = projectTasks.stream().filter(t -> t.getStatus() == Task.TaskStatus.IN_PROGRESS).count();
                    long done = projectTasks.stream().filter(t -> t.getStatus() == Task.TaskStatus.COMPLETED).count();
                    long total = projectTasks.size();
                    long todo = total - inProgress - done;
                    int progress = total > 0 ? (int) (done * 100 / total) : 0;
                    sb.append("Задачи: всего=").append(total)
                      .append(", к выполнению=").append(todo)
                      .append(", в работе=").append(inProgress)
                      .append(", выполнено=").append(done)
                      .append(", прогресс=").append(progress).append("%\n");
                } catch (Exception e) {
                    log.warn("Could not load tasks for system prompt: {}", e.getMessage());
                }
            }
        }
        if (context.containsKey("task")) sb.append("Задача: ").append(context.get("task")).append("\n");
        return sb.toString();
    }

    private List<Map<String, String>> buildMessageHistory(AiConversation conversation, String currentMessage) {
        List<Map<String, String>> messages = new ArrayList<>();
        List<AiMessage> history = messageRepository.findByConversationOrderByCreatedAtAsc(conversation);
        int startIdx = Math.max(0, history.size() - 10);
        for (int i = startIdx; i < history.size(); i++) {
            AiMessage msg = history.get(i);
            messages.add(Map.of("role", msg.getRole().name().toLowerCase(), "content", msg.getContent()));
        }
        return messages;
    }

    private List<String> generateSuggestions(Map<String, Object> context) {
        if (context.containsKey("project")) {
            return List.of(
                "Составить дорожную карту",
                "Оценить прогресс",
                "Распланировать следующий спринт",
                "Найти риски"
            );
        }
        return List.of(
            "Показать мои задачи",
            "Создать новую задачу",
            "Показать статистику",
            "Показать активные проекты"
        );
    }

    @Transactional(readOnly = true)
    public List<AiConversation> getUserConversations(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getRole() != User.Role.ADMIN && user.getRole() != User.Role.PROJECT_MANAGER) {
            throw new AccessDeniedException("AI-помощник доступен только для PM и администратора");
        }
        return conversationRepository.findByUserOrderByUpdatedAtDesc(user);
    }

    @Transactional(readOnly = true)
    public List<SuggestedMilestoneDto> suggestRoadmap(Long projectId, String projectDescription, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getRole() != User.Role.ADMIN && user.getRole() != User.Role.PROJECT_MANAGER) {
            throw new AccessDeniedException("Предложение дорожной карты доступно только для PM и администратора");
        }
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new RuntimeException("Project not found"));
        if (!permissionService.canEditProject(user, project)) {
            throw new AccessDeniedException("Нет прав на редактирование проекта");
        }

        if (Boolean.TRUE.equals(aiEnabled)) {
            try {
                List<Task> projectTasks = taskRepository.findByProjectAndDeletedAtIsNull(project);
                long total = projectTasks.size();
                long done = projectTasks.stream().filter(t -> t.getStatus() == Task.TaskStatus.COMPLETED).count();
                int progress = total > 0 ? (int) (done * 100 / total) : 0;
                String desc = projectDescription != null && !projectDescription.isBlank() ? projectDescription
                        : (project.getDescription() != null ? project.getDescription() : project.getName());
                String systemPrompt = "Ты PM-ассистент. Отвечай строго в формате JSON-массива, без пояснений.";
                String today = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE);
                String userPrompt = String.format(
                    "Сегодня %s. Составь дорожную карту для проекта \"%s\": %s. " +
                    "Сейчас %d задач, прогресс %d%%. " +
                    "Предложи ровно 5 этапов с датами строго в будущем (после %s). " +
                    "Ответь JSON-массивом: [{\"title\":\"...\",\"description\":\"...\",\"dueDate\":\"YYYY-MM-DD\",\"order\":0}, ...]",
                    today, project.getName(), desc, total, progress, today);
                String llmResponse = llmClient.chat(systemPrompt, List.of(Map.of("role", "user", "content", userPrompt)));
                if (llmResponse != null && !llmResponse.isBlank()) {
                    List<SuggestedMilestoneDto> parsed = parseMilestonesFromLlm(llmResponse);
                    if (parsed != null && !parsed.isEmpty()) {
                        return parsed;
                    }
                }
            } catch (Exception e) {
                log.warn("LLM roadmap generation failed, using stub: {}", e.getMessage());
            }
        }
        return buildDefaultSuggestedMilestones(project.getName(), project.getDescription(), projectDescription);
    }

    private List<SuggestedMilestoneDto> parseMilestonesFromLlm(String llmResponse) {
        try {
            String json = llmResponse.trim();
            int start = json.indexOf('[');
            int end = json.lastIndexOf(']');
            if (start >= 0 && end > start) {
                json = json.substring(start, end + 1);
            }
            List<Map<String, Object>> raw = objectMapper.readValue(json, new TypeReference<>() {});
            List<SuggestedMilestoneDto> result = new ArrayList<>();
            for (int i = 0; i < raw.size(); i++) {
                Map<String, Object> item = raw.get(i);
                result.add(SuggestedMilestoneDto.builder()
                    .title(String.valueOf(item.getOrDefault("title", "Этап " + (i + 1))))
                    .description(String.valueOf(item.getOrDefault("description", "")))
                    .dueDate(String.valueOf(item.getOrDefault("dueDate", LocalDate.now().plusWeeks(2L * (i + 1)).format(DateTimeFormatter.ISO_LOCAL_DATE))))
                    .order(i)
                    .build());
            }
            return result;
        } catch (Exception e) {
            log.warn("Failed to parse LLM milestones JSON: {}", e.getMessage());
            return null;
        }
    }

    private List<SuggestedMilestoneDto> buildDefaultSuggestedMilestones(String projectName, String projectDesc, String requestDesc) {
        String desc = requestDesc != null && !requestDesc.isBlank() ? requestDesc : (projectDesc != null ? projectDesc : projectName);
        List<SuggestedMilestoneDto> list = new ArrayList<>();
        DateTimeFormatter fmt = DateTimeFormatter.ISO_LOCAL_DATE;
        LocalDate base = LocalDate.now();

        list.add(SuggestedMilestoneDto.builder()
            .title("Анализ и планирование")
            .description("Сбор требований, оценка сроков и ресурсов")
            .dueDate(base.plusWeeks(2).format(fmt))
            .order(0)
            .build());
        list.add(SuggestedMilestoneDto.builder()
            .title("Дизайн и прототипирование")
            .description("UI/UX, макеты, согласование с заказчиком")
            .dueDate(base.plusWeeks(4).format(fmt))
            .order(1)
            .build());
        list.add(SuggestedMilestoneDto.builder()
            .title("Разработка")
            .description("Реализация функционала по спринтам")
            .dueDate(base.plusWeeks(10).format(fmt))
            .order(2)
            .build());
        list.add(SuggestedMilestoneDto.builder()
            .title("Тестирование и доработки")
            .description("QA, исправление багов, приёмка")
            .dueDate(base.plusWeeks(12).format(fmt))
            .order(3)
            .build());
        list.add(SuggestedMilestoneDto.builder()
            .title("Запуск и поддержка")
            .description("Деплой, мониторинг, документация")
            .dueDate(base.plusWeeks(14).format(fmt))
            .order(4)
            .build());
        return list;
    }

    @Transactional(readOnly = true)
    public List<RiskItemDto> getRiskForecast(Long projectId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new RuntimeException("Project not found"));
        if (!permissionService.canViewProject(user, project)) {
            throw new AccessDeniedException("Нет доступа к проекту");
        }

        List<Task> tasks = taskRepository.findByProjectAndDeletedAtIsNull(project);
        LocalDateTime now = LocalDateTime.now();
        List<RiskItemDto> risks = new ArrayList<>();

        for (Task task : tasks) {
            if (task.getStatus() == Task.TaskStatus.COMPLETED
                || task.getStatus() == Task.TaskStatus.CANCELLED) continue;

            if (task.getDeadline() != null && task.getDeadline().isBefore(now)) {
                risks.add(RiskItemDto.builder()
                    .taskId(task.getId())
                    .taskTitle(task.getTitle())
                    .riskLevel(RiskItemDto.RiskLevel.HIGH)
                    .reason("Просрочена: дедлайн " + task.getDeadline().toLocalDate())
                    .build());
                continue;
            }

            if (task.getDeadline() != null && task.getDeadline().isBefore(now.plusDays(3))) {
                long days = ChronoUnit.DAYS.between(now.toLocalDate(), task.getDeadline().toLocalDate());
                risks.add(RiskItemDto.builder()
                    .taskId(task.getId())
                    .taskTitle(task.getTitle())
                    .riskLevel(RiskItemDto.RiskLevel.HIGH)
                    .reason("Дедлайн через " + days + " дн.")
                    .build());
                continue;
            }

            if (task.getAssignedTo() == null
                && (task.getStatus() == Task.TaskStatus.NEW || task.getStatus() == Task.TaskStatus.IN_PROGRESS)) {
                risks.add(RiskItemDto.builder()
                    .taskId(task.getId())
                    .taskTitle(task.getTitle())
                    .riskLevel(RiskItemDto.RiskLevel.MEDIUM)
                    .reason("Не назначен исполнитель")
                    .build());
                continue;
            }

            if (task.getDeadline() == null
                && (task.getPriority() == Task.Priority.HIGH || task.getPriority() == Task.Priority.CRITICAL)) {
                risks.add(RiskItemDto.builder()
                    .taskId(task.getId())
                    .taskTitle(task.getTitle())
                    .riskLevel(RiskItemDto.RiskLevel.MEDIUM)
                    .reason("Высокий приоритет без дедлайна")
                    .build());
                continue;
            }

            if (task.getDeadline() != null && task.getDeadline().isBefore(now.plusDays(7))) {
                long days = ChronoUnit.DAYS.between(now.toLocalDate(), task.getDeadline().toLocalDate());
                risks.add(RiskItemDto.builder()
                    .taskId(task.getId())
                    .taskTitle(task.getTitle())
                    .riskLevel(RiskItemDto.RiskLevel.LOW)
                    .reason("Дедлайн через " + days + " дн.")
                    .build());
            }
        }

        risks.sort((a, b) -> a.getRiskLevel().ordinal() - b.getRiskLevel().ordinal());
        return risks;
    }

    public String suggestDeadline(String title, String description, String priority) {
        LocalDate fallback = switch (priority) {
            case "CRITICAL" -> LocalDate.now().plusDays(3);
            case "HIGH"     -> LocalDate.now().plusDays(7);
            case "MEDIUM"   -> LocalDate.now().plusDays(14);
            default         -> LocalDate.now().plusDays(30);
        };
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        if (!Boolean.TRUE.equals(aiEnabled)) {
            return fallback.format(fmt);
        }
        try {
            String systemPrompt = """
                    You are a project management assistant. Based on a task's title, description, \
                    and priority, suggest a realistic deadline date. \
                    Reply with ONLY the date in ISO format yyyy-MM-dd. Nothing else.""";
            String userPrompt = "Title: " + title +
                    (description != null && !description.isBlank() ? "\nDescription: " + description : "") +
                    "\nPriority: " + priority +
                    "\nToday: " + LocalDate.now().format(fmt);
            String response = llmClient.chat(systemPrompt,
                    List.of(Map.of("role", "user", "content", userPrompt)));
            String cleaned = response.trim().replaceAll("[^0-9\\-]", "");
            if (cleaned.matches("\\d{4}-\\d{2}-\\d{2}")) {
                return cleaned;
            }
        } catch (Exception e) {
            log.warn("AI deadline suggestion failed: {}", e.getMessage());
        }
        return fallback.format(fmt);
    }

    public com.gamifiedpm.dto.request.CreateQuestRequest generateQuestSuggestion(
            String prompt, String adminEmail) {

        User admin = userRepository.findByEmail(adminEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        if (admin.getRole() != com.gamifiedpm.model.entity.User.Role.ADMIN) {
            throw new AccessDeniedException("Admin role required");
        }

        com.gamifiedpm.dto.request.CreateQuestRequest fallback =
            new com.gamifiedpm.dto.request.CreateQuestRequest();
        fallback.setTitle("Новый квест");
        fallback.setDescription(prompt);
        fallback.setType(com.gamifiedpm.model.entity.Quest.QuestType.DAILY);
        fallback.setDifficulty(com.gamifiedpm.model.entity.Quest.Difficulty.MEDIUM);
        fallback.setXpReward(100);
        fallback.setTargetValue(3);
        fallback.setConditionType("TASKS_COMPLETED");
        fallback.setIcon("⚡");

        if (!Boolean.TRUE.equals(aiEnabled)) {
            return fallback;
        }

        try {
            String systemPrompt = """
                Ты ассистент геймификации для системы управления IT-проектами. \
                На основе описания администратора сгенерируй параметры квеста. \
                Отвечай строго в формате JSON-объекта без пояснений и markdown. \
                Доступные conditionType: TASKS_COMPLETED, COMMENTS_ADDED, SPRINT_STARTED, STREAK_DAYS, PROJECTS_CREATED. \
                Доступные type: DAILY, WEEKLY, SPECIAL. \
                Доступные difficulty: EASY, MEDIUM, HARD, LEGENDARY. \
                Формат ответа: {"title":"...","description":"...","type":"DAILY","difficulty":"MEDIUM",\
                "xpReward":100,"targetValue":5,"conditionType":"TASKS_COMPLETED","icon":"⚡"}""";

            String userPrompt = "Идея квеста: " + prompt;
            String llmResponse = llmClient.chat(systemPrompt,
                List.of(Map.of("role", "user", "content", userPrompt)));

            if (llmResponse != null && !llmResponse.isBlank()) {
                String json = llmResponse.trim();
                int start = json.indexOf('{');
                int end = json.lastIndexOf('}');
                if (start >= 0 && end > start) {
                    json = json.substring(start, end + 1);
                }
                Map<String, Object> raw = objectMapper.readValue(json, new TypeReference<>() {});

                com.gamifiedpm.dto.request.CreateQuestRequest req =
                    new com.gamifiedpm.dto.request.CreateQuestRequest();
                req.setTitle(getString(raw, "title", "Новый квест"));
                req.setDescription(getString(raw, "description", prompt));
                req.setIcon(getString(raw, "icon", "⚡"));
                req.setConditionType(getString(raw, "conditionType", "TASKS_COMPLETED"));
                req.setXpReward(getInt(raw, "xpReward", 100));
                req.setTargetValue(getInt(raw, "targetValue", 3));

                try {
                    req.setType(com.gamifiedpm.model.entity.Quest.QuestType.valueOf(
                        getString(raw, "type", "DAILY")));
                } catch (IllegalArgumentException e) {
                    req.setType(com.gamifiedpm.model.entity.Quest.QuestType.DAILY);
                }
                try {
                    req.setDifficulty(com.gamifiedpm.model.entity.Quest.Difficulty.valueOf(
                        getString(raw, "difficulty", "MEDIUM")));
                } catch (IllegalArgumentException e) {
                    req.setDifficulty(com.gamifiedpm.model.entity.Quest.Difficulty.MEDIUM);
                }
                return req;
            }
        } catch (Exception e) {
            log.warn("AI quest generation failed: {}", e.getMessage());
        }
        return fallback;
    }

    private static String getString(Map<String, Object> map, String key, String def) {
        Object v = map.get(key);
        return v != null ? String.valueOf(v) : def;
    }

    private static int getInt(Map<String, Object> map, String key, int def) {
        Object v = map.get(key);
        if (v instanceof Number n) return n.intValue();
        try { return Integer.parseInt(String.valueOf(v)); } catch (Exception e) { return def; }
    }
}
