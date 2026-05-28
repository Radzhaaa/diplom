package com.gamifiedpm.service;

import com.gamifiedpm.dto.request.BulkTaskUpdateRequest;
import com.gamifiedpm.dto.request.CreateTaskRequest;
import com.gamifiedpm.dto.request.UpdateTaskRequest;
import com.gamifiedpm.dto.response.ImportResultDto;
import com.gamifiedpm.dto.response.TaskDto;
import com.gamifiedpm.dto.response.TaskHistoryDto;
import com.gamifiedpm.model.entity.Project;
import com.gamifiedpm.model.entity.Task;
import com.gamifiedpm.model.entity.TaskDependency;
import com.gamifiedpm.model.entity.User;
import com.gamifiedpm.exception.AccessDeniedException;
import com.gamifiedpm.exception.ResourceNotFoundException;
import com.gamifiedpm.repository.ProjectRepository;
import com.gamifiedpm.repository.TaskDependencyRepository;
import com.gamifiedpm.repository.TaskRepository;
import com.gamifiedpm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final GamificationActionService gamificationActionService;

    private final com.gamifiedpm.repository.TaskHistoryRepository taskHistoryRepository;
    private final PermissionService permissionService;
    private final WebSocketEventService webSocketEventService;
    private final TaskDependencyRepository taskDependencyRepository;

    @Transactional(readOnly = true)
    public List<TaskDto> getUserTasks(String userEmail, Long projectId) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<Task> tasks;
        if (projectId != null) {
            Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
            if (!permissionService.canViewProject(user, project)) {
                throw new AccessDeniedException("You don't have permission to view tasks of this project");
            }
            tasks = taskRepository.findByProject(project);
        } else {
            tasks = taskRepository.findTasksByUserProjects(user);
        }

        return tasks.stream()
            .map(TaskDto::fromEntity)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<TaskDto> searchTasks(
            String userEmail,
            String search,
            Task.TaskStatus status,
            Task.Priority priority,
            Long projectId,
            Long assignedToId,
            int page,
            int size) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Pageable pageable = PageRequest.of(page, Math.min(size, 50));
        String searchParam = (search != null && !search.isBlank()) ? search.trim() : null;
        return taskRepository.searchUserTasks(user, searchParam, status, priority, projectId, assignedToId, pageable)
            .map(TaskDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public TaskDto getTaskById(Long taskId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        if (!permissionService.canViewProject(user, task.getProject())) {
            throw new AccessDeniedException("You don't have access to this task");
        }
        List<TaskDependency> deps = taskDependencyRepository.findAllByTask(task);
        List<Long> blockedBy = deps.stream()
            .filter(d -> d.getBlockedTask().getId().equals(taskId))
            .map(d -> d.getBlockingTask().getId()).collect(Collectors.toList());
        List<Long> blocks = deps.stream()
            .filter(d -> d.getBlockingTask().getId().equals(taskId))
            .map(d -> d.getBlockedTask().getId()).collect(Collectors.toList());
        return TaskDto.fromEntityWithDeps(task, blockedBy, blocks);
    }

    @Transactional
    public TaskDto createTask(CreateTaskRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        Project project = projectRepository.findById(request.getProjectId())
            .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        
        if (!permissionService.canCreateTask(user, project)) {
            throw new AccessDeniedException("You don't have permission to create tasks in this project");
        }
        
        User assignedTo = null;
        if (request.getAssignedToId() != null) {
            assignedTo = userRepository.findById(request.getAssignedToId())
                .orElse(null);
        }
        Set<User> coExecutors = resolveUserIds(request.getCoExecutorIds());
        Set<User> observers = resolveUserIds(request.getObserverIds());
        int xpReward = request.getXpReward() != null ? request.getXpReward() : 
            calculateXpReward(request.getPriority());
        
        Task task = Task.builder()
            .project(project)
            .title(request.getTitle())
            .description(request.getDescription())
            .status(Task.TaskStatus.NEW)
            .priority(request.getPriority())
            .category(request.getCategory())
            .deadline(request.getDeadline())
            .assignedTo(assignedTo)
            .createdBy(user)
            .coExecutors(coExecutors)
            .observers(observers)
            .xpReward(xpReward)
            .tags(request.getTags() != null ? request.getTags() : new java.util.ArrayList<>())
            .estimatedHours(request.getEstimatedHours())
            .recurrenceRule(request.getRecurrenceRule() != null ? request.getRecurrenceRule() : com.gamifiedpm.model.entity.Task.RecurrenceRule.NONE)
            .recurrenceEndDate(request.getRecurrenceEndDate())
            .build();
        
        task = taskRepository.save(task);
        for (User co : coExecutors) {
            if (assignedTo == null || !co.getId().equals(assignedTo.getId())) {
                notificationService.createNotification(co,
                    com.gamifiedpm.model.entity.Notification.NotificationType.TASK_ASSIGNED,
                    "Соисполнитель",
                    String.format("Вас добавили соисполнителем в задачу: %s", task.getTitle()),
                    task.getId(), "TASK");
            }
        }
        for (User obs : observers) {
            notificationService.createNotification(obs,
                com.gamifiedpm.model.entity.Notification.NotificationType.TASK_ASSIGNED,
                "Наблюдатель",
                String.format("Вас добавили наблюдателем в задачу: %s", task.getTitle()),
                task.getId(), "TASK");
        }
        createTaskHistory(task, user, com.gamifiedpm.model.entity.TaskHistory.ChangeType.CREATED, 
            "task", null, "created");
        
        if (assignedTo != null) {
            notificationService.createNotification(
                assignedTo,
                com.gamifiedpm.model.entity.Notification.NotificationType.TASK_ASSIGNED,
                "Новая задача",
                String.format("Вам назначена задача: %s", task.getTitle()),
                task.getId(),
                "TASK"
            );
        }
        
        log.info("Task created: {} in project: {}", task.getId(), project.getId());
        webSocketEventService.notifyTaskUpdated(project.getId(), task.getId(), "CREATED");
        return TaskDto.fromEntity(task);
    }

    @Transactional
    public TaskDto updateTask(Long taskId, UpdateTaskRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        
        if (!permissionService.canEditTask(user, task)) {
            throw new AccessDeniedException("You don't have permission to edit this task");
        }
        
        if (request.getTitle() != null && !request.getTitle().equals(task.getTitle())) {
            createTaskHistory(task, user, com.gamifiedpm.model.entity.TaskHistory.ChangeType.UPDATED,
                "title", task.getTitle(), request.getTitle());
            task.setTitle(request.getTitle());
        }
        if (request.getDescription() != null && !request.getDescription().equals(task.getDescription())) {
            createTaskHistory(task, user, com.gamifiedpm.model.entity.TaskHistory.ChangeType.UPDATED,
                "description", task.getDescription(), request.getDescription());
            task.setDescription(request.getDescription());
        }
        if (request.getStatus() != null && request.getStatus() != task.getStatus()) {
            Task.TaskStatus oldStatus = task.getStatus();
            createTaskHistory(task, user, com.gamifiedpm.model.entity.TaskHistory.ChangeType.STATUS_CHANGED,
                "status", oldStatus.name(), request.getStatus().name());
            task.setStatus(request.getStatus());
            
            if (request.getStatus() == Task.TaskStatus.COMPLETED && 
                oldStatus != Task.TaskStatus.COMPLETED) {
                task.setCompletedAt(LocalDateTime.now());
                createTaskHistory(task, user, com.gamifiedpm.model.entity.TaskHistory.ChangeType.COMPLETED,
                    "status", oldStatus.name(), "COMPLETED");
                if (task.getAssignedTo() != null) {
                    gamificationActionService.onTaskCompleted(task.getAssignedTo(), task);
                }
            }
        }
        if (request.getPriority() != null && request.getPriority() != task.getPriority()) {
            createTaskHistory(task, user, com.gamifiedpm.model.entity.TaskHistory.ChangeType.UPDATED,
                "priority", task.getPriority().name(), request.getPriority().name());
            task.setPriority(request.getPriority());
        }
        if (request.getCategory() != null && request.getCategory() != task.getCategory()) {
            createTaskHistory(task, user, com.gamifiedpm.model.entity.TaskHistory.ChangeType.UPDATED,
                "category", 
                task.getCategory() != null ? task.getCategory().name() : null, 
                request.getCategory().name());
            task.setCategory(request.getCategory());
        }
        if (request.getDeadline() != null && !request.getDeadline().equals(task.getDeadline())) {
            createTaskHistory(task, user, com.gamifiedpm.model.entity.TaskHistory.ChangeType.UPDATED,
                "deadline", 
                task.getDeadline() != null ? task.getDeadline().toString() : null,
                request.getDeadline().toString());
            task.setDeadline(request.getDeadline());
        }
        if (request.getAssignedToId() != null) {
            Long oldAssignedToId = task.getAssignedTo() != null ? task.getAssignedTo().getId() : null;
            User assignedTo = userRepository.findById(request.getAssignedToId())
                .orElse(null);
            
            if (oldAssignedToId == null || !oldAssignedToId.equals(request.getAssignedToId())) {
                createTaskHistory(task, user, com.gamifiedpm.model.entity.TaskHistory.ChangeType.ASSIGNED,
                    "assignedTo", 
                    oldAssignedToId != null ? oldAssignedToId.toString() : null,
                    request.getAssignedToId().toString());
                task.setAssignedTo(assignedTo);
                
                if (assignedTo != null) {
                    notificationService.createNotification(
                        assignedTo,
                        com.gamifiedpm.model.entity.Notification.NotificationType.TASK_ASSIGNED,
                        "Задача назначена",
                        String.format("Вам назначена задача: %s", task.getTitle()),
                        task.getId(),
                        "TASK"
                    );
                }
            }
        }
        if (request.getXpReward() != null && !request.getXpReward().equals(task.getXpReward())) {
            createTaskHistory(task, user, com.gamifiedpm.model.entity.TaskHistory.ChangeType.UPDATED,
                "xpReward", task.getXpReward().toString(), request.getXpReward().toString());
            task.setXpReward(request.getXpReward());
        }
        if (request.getCoExecutorIds() != null) {
            task.setCoExecutors(resolveUserIds(request.getCoExecutorIds()));
        }
        if (request.getObserverIds() != null) {
            task.setObservers(resolveUserIds(request.getObserverIds()));
        }
        if (request.getTags() != null) {
            task.getTags().clear();
            task.getTags().addAll(request.getTags());
        }
        if (request.getEstimatedHours() != null) {
            task.setEstimatedHours(request.getEstimatedHours());
        }
        if (request.getRecurrenceRule() != null) {
            task.setRecurrenceRule(request.getRecurrenceRule());
        }
        if (request.getRecurrenceEndDate() != null) {
            task.setRecurrenceEndDate(request.getRecurrenceEndDate());
        }

        task = taskRepository.save(task);
        webSocketEventService.notifyTaskUpdated(task.getProject().getId(), task.getId(), "UPDATED");
        return TaskDto.fromEntity(task);
    }

    @Transactional
    public TaskDto completeTask(Long taskId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        
        if (!permissionService.canCompleteTask(user, task)) {
            throw new AccessDeniedException("You don't have permission to complete this task");
        }
        
        task.setStatus(Task.TaskStatus.COMPLETED);
        task.setCompletedAt(LocalDateTime.now());
        task = taskRepository.save(task);
        
        gamificationActionService.onTaskCompleted(user, task);
        webSocketEventService.notifyTaskUpdated(task.getProject().getId(), task.getId(), "COMPLETED");

        return TaskDto.fromEntity(task);
    }

    @Transactional
    public void deleteTask(Long taskId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Task task = taskRepository.findByIdAndDeletedAtIsNull(taskId)
            .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        if (!permissionService.canDeleteTask(user, task)) {
            throw new AccessDeniedException("You don't have permission to delete this task");
        }

        task.setDeletedAt(LocalDateTime.now());
        taskRepository.save(task);
        log.info("Task soft-deleted: {} by user: {}", taskId, userEmail);
    }

    @Transactional
    public TaskDto restoreTask(Long taskId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        if (task.getDeletedAt() == null) {
            throw new IllegalStateException("Task is not deleted");
        }
        if (!permissionService.canDeleteTask(user, task)) {
            throw new AccessDeniedException("You don't have permission to restore this task");
        }

        task.setDeletedAt(null);
        task = taskRepository.save(task);
        log.info("Task restored: {} by user: {}", taskId, userEmail);
        return TaskDto.fromEntity(task);
    }

    @Transactional
    public TaskDto addDependency(Long taskId, Long blockingTaskId, String userEmail) {
        Task task = getTask(taskId);
        Task blocking = getTask(blockingTaskId);
        if (task.getId().equals(blocking.getId())) throw new IllegalArgumentException("Task cannot block itself");
        if (taskDependencyRepository.existsByBlockingTaskAndBlockedTask(blocking, task)) {
            throw new IllegalStateException("Dependency already exists");
        }
        // Цикл: если A→B уже есть, нельзя добавить B→A
        if (taskDependencyRepository.existsByBlockingTaskAndBlockedTask(task, blocking)) {
            throw new IllegalStateException("Adding this dependency would create a cycle");
        }
        taskDependencyRepository.save(TaskDependency.builder()
            .blockingTask(blocking).blockedTask(task).build());
        return getTaskById(taskId, userEmail);
    }

    @Transactional
    public TaskDto removeDependency(Long taskId, Long blockingTaskId, String userEmail) {
        Task task = getTask(taskId);
        Task blocking = getTask(blockingTaskId);
        taskDependencyRepository.findByBlockingTaskAndBlockedTask(blocking, task)
            .ifPresent(taskDependencyRepository::delete);
        return getTaskById(taskId, userEmail);
    }

    @Transactional
    public int bulkUpdate(BulkTaskUpdateRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        List<Task> tasks = taskRepository.findAllById(request.getIds());
        int count = 0;
        for (Task task : tasks) {
            switch (request.getAction()) {
                case CHANGE_STATUS -> {
                    if (request.getStatus() != null && permissionService.canEditTask(user, task)) {
                        task.setStatus(request.getStatus());
                        taskRepository.save(task);
                        count++;
                    }
                }
                case REASSIGN -> {
                    if (request.getAssignedToId() != null && permissionService.canEditTask(user, task)) {
                        userRepository.findById(request.getAssignedToId()).ifPresent(task::setAssignedTo);
                        taskRepository.save(task);
                        count++;
                    }
                }
                case DELETE -> {
                    if (permissionService.canDeleteTask(user, task)) {
                        task.setDeletedAt(java.time.LocalDateTime.now());
                        taskRepository.save(task);
                        count++;
                    }
                }
            }
        }
        log.info("Bulk {} applied to {}/{} tasks by {}", request.getAction(), count, tasks.size(), userEmail);
        return count;
    }

    private Task getTask(Long taskId) {
        return taskRepository.findById(taskId)
            .orElseThrow(() -> new ResourceNotFoundException("Task not found: " + taskId));
    }

    @Transactional(readOnly = true)
    public List<TaskHistoryDto> getTaskHistory(Long taskId, String userEmail) {
        taskRepository.findById(taskId)
            .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        return taskHistoryRepository.findByTaskIdOrderByChangedAtDesc(taskId).stream()
            .map(TaskHistoryDto::fromEntity)
            .collect(Collectors.toList());
    }

    private Set<User> resolveUserIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return new HashSet<>();
        return new HashSet<>(userRepository.findAllById(ids));
    }

    private int calculateXpReward(Task.Priority priority) {
        return switch (priority) {
            case LOW -> 10;
            case MEDIUM -> 25;
            case HIGH -> 50;
            case CRITICAL -> 75;
        };
    }

    @Transactional
    public ImportResultDto importTasksFromCsv(MultipartFile file, Long projectId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        if (!permissionService.canCreateTask(user, project)) {
            throw new AccessDeniedException("No permission to create tasks in this project");
        }

        int imported = 0;
        int skipped = 0;
        List<ImportResultDto.RowError> errors = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            String header = reader.readLine();
            if (header == null) return new ImportResultDto(0, 0, List.of());

            String line;
            int row = 1;
            while ((line = reader.readLine()) != null) {
                row++;
                if (line.isBlank()) { skipped++; continue; }

                String[] cols = parseCsvLine(line);
                if (cols.length < 1 || cols[0].isBlank()) {
                    errors.add(new ImportResultDto.RowError(row, "Пустое название задачи"));
                    skipped++;
                    continue;
                }

                try {
                    String title       = cols[0].trim();
                    String description = cols.length > 1 ? cols[1].trim() : null;
                    Task.Priority priority = Task.Priority.MEDIUM;
                    if (cols.length > 2 && !cols[2].isBlank()) {
                        try { priority = Task.Priority.valueOf(cols[2].trim().toUpperCase()); }
                        catch (IllegalArgumentException e) {}
                    }
                    LocalDateTime deadline = null;
                    if (cols.length > 3 && !cols[3].isBlank()) {
                        try { deadline = LocalDate.parse(cols[3].trim()).atStartOfDay(); }
                        catch (DateTimeParseException e) {}
                    }
                    User assignedTo = null;
                    if (cols.length > 4 && !cols[4].isBlank()) {
                        assignedTo = userRepository.findByEmail(cols[4].trim()).orElse(null);
                    }

                    Task task = Task.builder()
                            .project(project)
                            .title(title)
                            .description(description)
                            .status(Task.TaskStatus.NEW)
                            .priority(priority)
                            .deadline(deadline)
                            .assignedTo(assignedTo)
                            .createdBy(user)
                            .xpReward(calculateXpReward(priority))
                            .coExecutors(new HashSet<>())
                            .observers(new HashSet<>())
                            .build();

                    taskRepository.save(task);
                    createTaskHistory(task, user,
                            com.gamifiedpm.model.entity.TaskHistory.ChangeType.CREATED,
                            "task", null, "imported from CSV");
                    imported++;
                } catch (Exception e) {
                    errors.add(new ImportResultDto.RowError(row, e.getMessage()));
                    skipped++;
                }
            }
        } catch (Exception e) {
            log.error("CSV import error", e);
            throw new IllegalArgumentException("Ошибка чтения CSV: " + e.getMessage());
        }

        log.info("CSV import for project {}: imported={}, skipped={}, errors={}", projectId, imported, skipped, errors.size());
        return new ImportResultDto(imported, skipped, errors);
    }

    private String[] parseCsvLine(String line) {
        List<String> result = new ArrayList<>();
        boolean inQuotes = false;
        StringBuilder sb = new StringBuilder();
        for (char c : line.toCharArray()) {
            if (c == '"') { inQuotes = !inQuotes; }
            else if (c == ',' && !inQuotes) { result.add(sb.toString()); sb.setLength(0); }
            else { sb.append(c); }
        }
        result.add(sb.toString());
        return result.toArray(new String[0]);
    }

    private void createTaskHistory(Task task, User user, com.gamifiedpm.model.entity.TaskHistory.ChangeType changeType,
                                   String fieldName, String oldValue, String newValue) {
        com.gamifiedpm.model.entity.TaskHistory history = com.gamifiedpm.model.entity.TaskHistory.builder()
            .task(task)
            .changedBy(user)
            .fieldName(fieldName)
            .oldValue(oldValue)
            .newValue(newValue)
            .changeType(changeType)
            .build();
        
        taskHistoryRepository.save(history);
    }

    @Transactional(readOnly = true)
    public List<TaskDto> getArchivedTasks(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return taskRepository.findArchivedTasksByUser(user).stream()
                .map(TaskDto::fromEntity)
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TaskDto> getCompletedTasks(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return taskRepository.findCompletedTasksByUser(user).stream()
                .map(TaskDto::fromEntity)
                .collect(java.util.stream.Collectors.toList());
    }

    @org.springframework.scheduling.annotation.Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void purgeOldDeletedTasks() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(90);
        List<Task> old = taskRepository.findTasksDeletedBefore(cutoff);
        if (!old.isEmpty()) {
            taskRepository.deleteAll(old);
            log.info("Auto-purged {} tasks deleted before {}", old.size(), cutoff.toLocalDate());
        }
    }
}
