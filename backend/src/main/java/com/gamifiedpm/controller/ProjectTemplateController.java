package com.gamifiedpm.controller;

import com.gamifiedpm.dto.request.CreateProjectFromTemplateRequest;
import com.gamifiedpm.dto.response.ProjectDto;
import com.gamifiedpm.dto.response.ProjectTemplateDto;
import com.gamifiedpm.service.ProjectTemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/templates")
@RequiredArgsConstructor
public class ProjectTemplateController {

    private final ProjectTemplateService projectTemplateService;

    @GetMapping
    public ResponseEntity<List<ProjectTemplateDto>> getTemplates() {
        return ResponseEntity.ok(projectTemplateService.getAllTemplates());
    }

    @PostMapping("/{templateId}/create")
    public ResponseEntity<ProjectDto> createFromTemplate(
            @PathVariable String templateId,
            @Valid @RequestBody CreateProjectFromTemplateRequest request,
            Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(projectTemplateService.createFromTemplate(templateId, request, email));
    }
}
