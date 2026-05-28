package com.gamifiedpm.service;

import com.gamifiedpm.dto.request.CreateSprintRequest;
import com.gamifiedpm.dto.response.SprintDto;
import com.gamifiedpm.dto.response.TaskDto;
import com.gamifiedpm.exception.ResourceNotFoundException;
import com.gamifiedpm.model.entity.Project;
import com.gamifiedpm.model.entity.Sprint;
import com.gamifiedpm.model.entity.Task;
import com.gamifiedpm.model.entity.User;
import com.gamifiedpm.repository.ProjectRepository;
import com.gamifiedpm.repository.SprintRepository;
import com.gamifiedpm.repository.TaskRepository;
import com.gamifiedpm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SprintService {

    private final SprintRepository sprintRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final PermissionService permissionService;
    private final QuestService questService;

    @Transactional(readOnly = true)
    public List<SprintDto> getProjectSprints(Long projectId, String userEmail) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        User user = getUser(userEmail);
        if (!permissionService.canViewProject(user, project)) throw new com.gamifiedpm.exception.AccessDeniedException("Access denied");
        return sprintRepository.findByProjectOrderByStartDateAsc(project).stream()
            .map(SprintDto::fromEntity)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SprintDto getActiveSprint(Long projectId, String userEmail) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        User user = getUser(userEmail);
        if (!permissionService.canViewProject(user, project)) throw new com.gamifiedpm.exception.AccessDeniedException("Access denied");
        return sprintRepository.findByProjectAndStatus(project, Sprint.SprintStatus.ACTIVE)
            .map(SprintDto::fromEntity)
            .orElse(null);
    }

    @Transactional
    public SprintDto createSprint(Long projectId, CreateSprintRequest request, String userEmail) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        User user = getUser(userEmail);
        if (!permissionService.canEditProject(user, project)) throw new com.gamifiedpm.exception.AccessDeniedException("Access denied");
        Sprint sprint = sprintRepository.save(Sprint.builder()
            .project(project)
            .name(request.getName())
            .goal(request.getGoal())
            .startDate(request.getStartDate())
            .endDate(request.getEndDate())
            .status(Sprint.SprintStatus.PLANNED)
            .build());
        log.info("Sprint '{}' created for project {}", sprint.getName(), projectId);
        return SprintDto.fromEntity(sprint);
    }

    @Transactional
    public SprintDto startSprint(Long sprintId, String userEmail) {
        Sprint sprint = getSprint(sprintId);
        User user = getUser(userEmail);
        if (!permissionService.canEditProject(user, sprint.getProject())) throw new com.gamifiedpm.exception.AccessDeniedException("Access denied");
        sprintRepository.findByProjectAndStatus(sprint.getProject(), Sprint.SprintStatus.ACTIVE)
            .ifPresent(s -> { throw new IllegalStateException("Project already has an active sprint: " + s.getName()); });
        sprint.setStatus(Sprint.SprintStatus.ACTIVE);
        SprintDto result = SprintDto.fromEntity(sprintRepository.save(sprint));
        questService.updateQuestProgress(user, "SPRINT_STARTED", 1);
        return result;
    }

    @Transactional
    public SprintDto closeSprint(Long sprintId, String userEmail) {
        Sprint sprint = getSprint(sprintId);
        User user = getUser(userEmail);
        if (!permissionService.canEditProject(user, sprint.getProject())) throw new com.gamifiedpm.exception.AccessDeniedException("Access denied");
        sprint.setStatus(Sprint.SprintStatus.CLOSED);
        taskRepository.findAll().stream()
            .filter(t -> t.getSprint() != null && t.getSprint().getId().equals(sprintId)
                      && t.getStatus() != Task.TaskStatus.COMPLETED)
            .forEach(t -> {
                t.setSprint(null);
                taskRepository.save(t);
            });
        return SprintDto.fromEntity(sprintRepository.save(sprint));
    }

    @Transactional
    public TaskDto assignTaskToSprint(Long taskId, Long sprintId, String userEmail) {
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        if (sprintId == null) {
            task.setSprint(null);
        } else {
            Sprint sprint = getSprint(sprintId);
            if (!sprint.getProject().getId().equals(task.getProject().getId())) {
                throw new IllegalArgumentException("Sprint does not belong to task's project");
            }
            task.setSprint(sprint);
        }
        return TaskDto.fromEntity(taskRepository.save(task));
    }

    private Sprint getSprint(Long id) {
        return sprintRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Sprint not found"));
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
