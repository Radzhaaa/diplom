package com.gamifiedpm.controller;

import com.gamifiedpm.dto.request.CreateProjectRequest;
import com.gamifiedpm.dto.request.UpdateProjectRequest;
import com.gamifiedpm.dto.response.ProjectDto;
import com.gamifiedpm.model.entity.Project;
import com.gamifiedpm.model.entity.User;
import com.gamifiedpm.repository.ProjectRepository;
import com.gamifiedpm.repository.UserRepository;
import com.gamifiedpm.service.AiAgentService;
import com.gamifiedpm.service.ProjectService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProjectControllerTest {

    @Mock private ProjectService projectService;
    @Mock private AiAgentService aiAgentService;
    @Mock private ProjectRepository projectRepository;
    @Mock private UserRepository userRepository;
    @Mock private Authentication authentication;

    @InjectMocks private ProjectController projectController;

    private ProjectDto sampleProjectDto;

    @BeforeEach
    void setUp() {
        given(authentication.getName()).willReturn("user@test.com");

        sampleProjectDto = ProjectDto.builder()
                .id(1L).name("Test Project")
                .status(Project.ProjectStatus.ACTIVE)
                .build();
    }


    @Test
    void getUserProjects_returnsListWithoutPagination() {
        given(projectService.getUserProjects("user@test.com")).willReturn(List.of(sampleProjectDto));

        ResponseEntity<?> response = projectController.getUserProjects(authentication, 0, 0);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        @SuppressWarnings("unchecked")
        List<ProjectDto> body = (List<ProjectDto>) response.getBody();
        assertThat(body).hasSize(1);
        assertThat(body.get(0).getName()).isEqualTo("Test Project");
    }


    @Test
    void getProject_returnsProjectDto() {
        given(projectService.getProjectById(1L, "user@test.com")).willReturn(sampleProjectDto);

        ResponseEntity<ProjectDto> response = projectController.getProject(1L, authentication);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getId()).isEqualTo(1L);
    }


    @Test
    void createProject_returnsCreatedDto() {
        CreateProjectRequest request = new CreateProjectRequest();
        request.setName("New Project");

        given(projectService.createProject(eq(request), eq("user@test.com"))).willReturn(sampleProjectDto);

        ResponseEntity<ProjectDto> response = projectController.createProject(request, authentication);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        verify(projectService).createProject(request, "user@test.com");
    }


    @Test
    void updateProject_returnsUpdatedDto() {
        UpdateProjectRequest request = new UpdateProjectRequest();
        request.setName("Updated");

        ProjectDto updated = ProjectDto.builder().id(1L).name("Updated")
                .status(Project.ProjectStatus.ACTIVE).build();

        given(projectService.updateProject(eq(1L), eq(request), eq("user@test.com"))).willReturn(updated);

        ResponseEntity<ProjectDto> response = projectController.updateProject(1L, request, authentication);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getName()).isEqualTo("Updated");
    }


    @Test
    void deleteProject_returnsNoContent() {
        doNothing().when(projectService).deleteProject(1L, "user@test.com");

        ResponseEntity<Void> response = projectController.deleteProject(1L, authentication);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(projectService).deleteProject(1L, "user@test.com");
    }


    @Test
    void generateInviteLink_returnsTokenMap() {
        Map<String, Object> linkData = Map.of("token", "abc123", "url", "http://app/join/abc123");
        given(projectService.generateInviteLink(1L, "user@test.com")).willReturn(linkData);

        ResponseEntity<Map<String, Object>> response = projectController.generateInviteLink(1L, authentication);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsKey("token");
    }


    @Test
    void restoreProject_returnsRestoredDto() {
        given(projectService.restoreProject(1L, "user@test.com")).willReturn(sampleProjectDto);

        ResponseEntity<ProjectDto> response = projectController.restoreProject(1L, authentication);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
    }
}
