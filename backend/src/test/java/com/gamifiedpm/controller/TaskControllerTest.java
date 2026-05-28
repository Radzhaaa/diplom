package com.gamifiedpm.controller;

import com.gamifiedpm.dto.request.CreateTaskRequest;
import com.gamifiedpm.dto.request.UpdateTaskRequest;
import com.gamifiedpm.dto.response.TaskDto;
import com.gamifiedpm.model.entity.Task;
import com.gamifiedpm.service.TaskService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskControllerTest {

    @Mock private TaskService taskService;
    @Mock private Authentication authentication;

    @InjectMocks private TaskController taskController;

    private TaskDto sampleTask;

    @BeforeEach
    void setUp() {
        given(authentication.getName()).willReturn("user@test.com");

        sampleTask = TaskDto.builder()
                .id(1L).title("Fix bug")
                .status(Task.TaskStatus.NEW)
                .priority(Task.Priority.HIGH)
                .projectId(10L)
                .build();
    }


    @Test
    void getTasks_returnsUserTasks() {
        given(taskService.getUserTasks("user@test.com", null)).willReturn(List.of(sampleTask));

        ResponseEntity<List<TaskDto>> response = taskController.getTasks(null, authentication);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
    }

    @Test
    void getTasks_filtersByProjectId() {
        given(taskService.getUserTasks("user@test.com", 10L)).willReturn(List.of(sampleTask));

        ResponseEntity<List<TaskDto>> response = taskController.getTasks(10L, authentication);

        assertThat(response.getBody()).hasSize(1);
        verify(taskService).getUserTasks("user@test.com", 10L);
    }


    @Test
    void searchTasks_returnsPaginatedResults() {
        Page<TaskDto> page = new PageImpl<>(List.of(sampleTask));
        given(taskService.searchTasks(eq("user@test.com"), eq("bug"), isNull(), isNull(),
                isNull(), isNull(), eq(0), eq(20))).willReturn(page);

        ResponseEntity<Page<TaskDto>> response = taskController.searchTasks(
                "bug", null, null, null, null, 0, 20, authentication);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getContent()).hasSize(1);
    }


    @Test
    void getTask_returnsTaskDto() {
        given(taskService.getTaskById(1L, "user@test.com")).willReturn(sampleTask);

        ResponseEntity<TaskDto> response = taskController.getTask(1L, authentication);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getId()).isEqualTo(1L);
    }


    @Test
    void createTask_returnsCreatedTask() {
        CreateTaskRequest req = new CreateTaskRequest();
        req.setTitle("Fix bug");
        req.setProjectId(10L);

        given(taskService.createTask(eq(req), eq("user@test.com"))).willReturn(sampleTask);

        ResponseEntity<TaskDto> response = taskController.createTask(req, authentication);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getTitle()).isEqualTo("Fix bug");
        verify(taskService).createTask(req, "user@test.com");
    }


    @Test
    void updateTask_returnsUpdatedTask() {
        UpdateTaskRequest req = new UpdateTaskRequest();
        req.setTitle("Fix bug v2");

        TaskDto updated = TaskDto.builder().id(1L).title("Fix bug v2")
                .status(Task.TaskStatus.IN_PROGRESS).priority(Task.Priority.HIGH).projectId(10L).build();

        given(taskService.updateTask(eq(1L), eq(req), eq("user@test.com"))).willReturn(updated);

        ResponseEntity<TaskDto> response = taskController.updateTask(1L, req, authentication);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getTitle()).isEqualTo("Fix bug v2");
    }


    @Test
    void deleteTask_returnsNoContent() {
        doNothing().when(taskService).deleteTask(1L, "user@test.com");

        ResponseEntity<Void> response = taskController.deleteTask(1L, authentication);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(taskService).deleteTask(1L, "user@test.com");
    }
}
