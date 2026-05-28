package com.gamifiedpm.controller;

import com.gamifiedpm.dto.request.CreateSprintRequest;
import com.gamifiedpm.dto.response.SprintDto;
import com.gamifiedpm.service.SprintService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class SprintControllerTest {

    @Mock private SprintService sprintService;
    @Mock private Authentication authentication;

    @InjectMocks private SprintController sprintController;

    private SprintDto sampleSprint;

    @BeforeEach
    void setUp() {
        given(authentication.getName()).willReturn("user@test.com");

        sampleSprint = SprintDto.builder()
                .id(1L).name("Sprint 1")
                .projectId(10L)
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(14))
                .status(com.gamifiedpm.model.entity.Sprint.SprintStatus.PLANNED)
                .build();
    }


    @Test
    void getProjectSprints_returnsSprintList() {
        given(sprintService.getProjectSprints(10L, "user@test.com")).willReturn(List.of(sampleSprint));

        ResponseEntity<List<SprintDto>> response = sprintController.getProjectSprints(10L, authentication);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
        assertThat(response.getBody().get(0).getName()).isEqualTo("Sprint 1");
    }


    @Test
    void getActiveSprint_returnsActiveSprint_whenExists() {
        SprintDto active = SprintDto.builder().id(2L).name("Sprint 2")
                .projectId(10L).startDate(LocalDate.now()).endDate(LocalDate.now().plusDays(7))
                .status(com.gamifiedpm.model.entity.Sprint.SprintStatus.ACTIVE).build();

        given(sprintService.getActiveSprint(10L, "user@test.com")).willReturn(active);

        ResponseEntity<SprintDto> response = sprintController.getActiveSprint(10L, authentication);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getStatus()).isEqualTo(com.gamifiedpm.model.entity.Sprint.SprintStatus.ACTIVE);
    }

    @Test
    void getActiveSprint_returns204_whenNoActiveSprint() {
        given(sprintService.getActiveSprint(10L, "user@test.com")).willReturn(null);

        ResponseEntity<SprintDto> response = sprintController.getActiveSprint(10L, authentication);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }


    @Test
    void createSprint_returnsCreatedSprint() {
        CreateSprintRequest req = new CreateSprintRequest();
        req.setName("Sprint 1");
        req.setStartDate(LocalDate.now());
        req.setEndDate(LocalDate.now().plusDays(14));

        given(sprintService.createSprint(eq(10L), eq(req), eq("user@test.com"))).willReturn(sampleSprint);

        ResponseEntity<SprintDto> response = sprintController.createSprint(10L, req, authentication);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getName()).isEqualTo("Sprint 1");
        verify(sprintService).createSprint(10L, req, "user@test.com");
    }


    @Test
    void startSprint_returnsStartedSprint() {
        SprintDto started = SprintDto.builder().id(1L).name("Sprint 1")
                .projectId(10L).startDate(LocalDate.now()).endDate(LocalDate.now().plusDays(14))
                .status(com.gamifiedpm.model.entity.Sprint.SprintStatus.ACTIVE).build();

        given(sprintService.startSprint(1L, "user@test.com")).willReturn(started);

        ResponseEntity<SprintDto> response = sprintController.startSprint(1L, authentication);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getStatus()).isEqualTo(com.gamifiedpm.model.entity.Sprint.SprintStatus.ACTIVE);
    }


    @Test
    void closeSprint_returnsClosedSprint() {
        SprintDto closed = SprintDto.builder().id(1L).name("Sprint 1")
                .projectId(10L).startDate(LocalDate.now().minusDays(14)).endDate(LocalDate.now())
                .status(com.gamifiedpm.model.entity.Sprint.SprintStatus.CLOSED).build();

        given(sprintService.closeSprint(1L, "user@test.com")).willReturn(closed);

        ResponseEntity<SprintDto> response = sprintController.closeSprint(1L, authentication);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getStatus()).isEqualTo(com.gamifiedpm.model.entity.Sprint.SprintStatus.CLOSED);
    }
}
