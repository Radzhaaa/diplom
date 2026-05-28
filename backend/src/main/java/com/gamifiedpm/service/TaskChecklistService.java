package com.gamifiedpm.service;

import com.gamifiedpm.dto.request.CreateTaskChecklistItemRequest;
import com.gamifiedpm.dto.request.UpdateTaskChecklistItemRequest;
import com.gamifiedpm.dto.response.TaskChecklistItemDto;
import com.gamifiedpm.exception.AccessDeniedException;
import com.gamifiedpm.exception.ResourceNotFoundException;
import com.gamifiedpm.model.entity.Task;
import com.gamifiedpm.model.entity.TaskChecklistItem;
import com.gamifiedpm.model.entity.User;
import com.gamifiedpm.repository.TaskChecklistItemRepository;
import com.gamifiedpm.repository.TaskRepository;
import com.gamifiedpm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TaskChecklistService {

    private final TaskChecklistItemRepository taskChecklistItemRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final PermissionService permissionService;

    @Transactional
    public TaskChecklistItemDto addChecklistItem(Long taskId, CreateTaskChecklistItemRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        if (!permissionService.canEditTask(user, task)) {
            throw new AccessDeniedException("You don't have permission to edit this task");
        }
        int nextOrder = task.getChecklistItems() != null ? task.getChecklistItems().size() : 0;
        if (request.getSortOrder() != null) {
            nextOrder = request.getSortOrder();
        }
        TaskChecklistItem item = TaskChecklistItem.builder()
            .task(task)
            .title(request.getTitle().trim())
            .completed(false)
            .sortOrder(nextOrder)
            .build();
        item = taskChecklistItemRepository.save(item);
        return TaskChecklistItemDto.fromEntity(item);
    }

    @Transactional
    public TaskChecklistItemDto updateChecklistItem(Long itemId, UpdateTaskChecklistItemRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        TaskChecklistItem item = taskChecklistItemRepository.findById(itemId)
            .orElseThrow(() -> new ResourceNotFoundException("Checklist item not found"));
        if (!permissionService.canEditTask(user, item.getTask())) {
            throw new AccessDeniedException("You don't have permission to edit this task");
        }
        if (request.getTitle() != null) item.setTitle(request.getTitle().trim());
        if (request.getCompleted() != null) item.setCompleted(request.getCompleted());
        if (request.getSortOrder() != null) item.setSortOrder(request.getSortOrder());
        item = taskChecklistItemRepository.save(item);
        return TaskChecklistItemDto.fromEntity(item);
    }

    @Transactional
    public void deleteChecklistItem(Long itemId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        TaskChecklistItem item = taskChecklistItemRepository.findById(itemId)
            .orElseThrow(() -> new ResourceNotFoundException("Checklist item not found"));
        if (!permissionService.canEditTask(user, item.getTask())) {
            throw new AccessDeniedException("You don't have permission to edit this task");
        }
        taskChecklistItemRepository.delete(item);
    }
}
