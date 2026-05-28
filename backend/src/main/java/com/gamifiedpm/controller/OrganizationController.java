package com.gamifiedpm.controller;

import com.gamifiedpm.dto.request.CreateOrganizationRequest;
import com.gamifiedpm.dto.response.DepartmentDto;
import com.gamifiedpm.dto.response.OrganizationDto;
import com.gamifiedpm.service.OrganizationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/organizations")
@RequiredArgsConstructor
public class OrganizationController {

    private final OrganizationService organizationService;

    @GetMapping
    public ResponseEntity<List<OrganizationDto>> getUserOrganizations(Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(organizationService.getUserOrganizations(userEmail));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrganizationDto> getOrganization(
            @PathVariable Long id,
            Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(organizationService.getOrganizationById(id, userEmail));
    }

    @PostMapping
    public ResponseEntity<OrganizationDto> createOrganization(
            @Valid @RequestBody CreateOrganizationRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(organizationService.createOrganization(request, userEmail));
    }

    @GetMapping("/{id}/departments")
    public ResponseEntity<List<DepartmentDto>> getOrganizationDepartments(
            @PathVariable Long id,
            Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(organizationService.getOrganizationDepartments(id, userEmail));
    }

    @PostMapping("/{id}/users")
    public ResponseEntity<OrganizationDto> addUserToOrganization(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        String requesterEmail = authentication.getName();
        String targetEmail = body.get("email");
        if (targetEmail == null || targetEmail.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(organizationService.addUserToOrganization(id, targetEmail, requesterEmail));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrganization(
            @PathVariable Long id,
            Authentication authentication) {
        String userEmail = authentication.getName();
        organizationService.deleteOrganization(id, userEmail);
        return ResponseEntity.noContent().build();
    }
}
