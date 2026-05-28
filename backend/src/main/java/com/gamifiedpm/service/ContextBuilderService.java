package com.gamifiedpm.service;

import com.gamifiedpm.model.entity.*;
import com.gamifiedpm.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ContextBuilderService {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final TeamRepository teamRepository;

    public Map<String, Object> buildUserContext(User user) {
        Map<String, Object> context = new HashMap<>();
        
        context.put("user", Map.of(
            "id", user.getId(),
            "name", user.getFirstName() + " " + user.getLastName(),
            "email", user.getEmail(),
            "level", user.getLevel(),
            "totalXp", user.getTotalXp(),
            "streak", user.getCurrentStreak(),
            "role", user.getRole().name()
        ));
        
        var projects = projectRepository.findUserProjects(user);
        context.put("projects", projects.stream()
            .map(p -> Map.of(
                "id", p.getId(),
                "name", p.getName(),
                "status", p.getStatus().name(),
                "progress", p.calculateProgress()
            ))
            .collect(Collectors.toList()));
        
        var tasks = taskRepository.findByAssignedTo(user);
        context.put("tasks", tasks.stream()
            .map(t -> {
                Map<String, Object> m = new java.util.HashMap<>();
                m.put("id", t.getId());
                m.put("title", t.getTitle());
                m.put("status", t.getStatus().name());
                m.put("priority", t.getPriority().name());
                m.put("deadline", t.getDeadline() != null ? t.getDeadline().toString() : "не задан");
                return m;
            })
            .collect(Collectors.toList()));
        
        long completedTasks = tasks.stream()
            .filter(t -> t.getStatus() == Task.TaskStatus.COMPLETED)
            .count();
        
        context.put("statistics", Map.of(
            "totalProjects", projects.size(),
            "totalTasks", tasks.size(),
            "completedTasks", completedTasks,
            "completionRate", tasks.isEmpty() ? 0.0 : (double) completedTasks / tasks.size() * 100
        ));
        
        return context;
    }

    public Map<String, Object> buildProjectContext(Project project) {
        Map<String, Object> context = new HashMap<>();
        
        Map<String, Object> projectMap = new java.util.HashMap<>();
        projectMap.put("id", project.getId());
        projectMap.put("name", project.getName());
        projectMap.put("description", project.getDescription() != null ? project.getDescription() : "");
        projectMap.put("status", project.getStatus().name());
        projectMap.put("progress", project.calculateProgress());
        projectMap.put("startDate", project.getStartDate() != null ? project.getStartDate().toString() : "не задана");
        projectMap.put("endDate", project.getEndDate() != null ? project.getEndDate().toString() : "не задана");
        context.put("project", projectMap);
        
        var tasks = taskRepository.findByProject(project);
        context.put("tasks", tasks.stream()
            .map(t -> {
                Map<String, Object> m = new java.util.HashMap<>();
                m.put("id", t.getId());
                m.put("title", t.getTitle());
                m.put("status", t.getStatus().name());
                m.put("priority", t.getPriority().name());
                m.put("assignedTo", t.getAssignedTo() != null ?
                    t.getAssignedTo().getFirstName() + " " + t.getAssignedTo().getLastName() : "не назначен");
                return m;
            })
            .collect(Collectors.toList()));
        
        var teams = teamRepository.findByProject(project);
        context.put("teams", teams.size());
        
        return context;
    }

    public Map<String, Object> buildTaskContext(Task task) {
        Map<String, Object> context = new HashMap<>();
        
        Map<String, Object> taskMap = new java.util.HashMap<>();
        taskMap.put("id", task.getId());
        taskMap.put("title", task.getTitle());
        taskMap.put("description", task.getDescription() != null ? task.getDescription() : "");
        taskMap.put("status", task.getStatus().name());
        taskMap.put("priority", task.getPriority().name());
        taskMap.put("deadline", task.getDeadline() != null ? task.getDeadline().toString() : "не задан");
        taskMap.put("xpReward", task.getXpReward());
        taskMap.put("isOverdue", task.isOverdue());
        context.put("task", taskMap);
        
        context.put("project", Map.of(
            "id", task.getProject().getId(),
            "name", task.getProject().getName()
        ));
        
        if (task.getAssignedTo() != null) {
            context.put("assignedTo", Map.of(
                "id", task.getAssignedTo().getId(),
                "name", task.getAssignedTo().getFirstName() + " " + task.getAssignedTo().getLastName()
            ));
        }
        
        return context;
    }
}
