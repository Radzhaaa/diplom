package com.gamifiedpm.dto.response;

import com.gamifiedpm.model.entity.Organization;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationDto {
    private Long id;
    private String name;
    private String description;
    private String logoUrl;
    private String domain;
    private Organization.SubscriptionPlan subscriptionPlan;
    private Integer maxUsers;
    private UserDto owner;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long totalUsers;
    private Long totalDepartments;
    
    public static OrganizationDto fromEntity(Organization organization) {
        return OrganizationDto.builder()
            .id(organization.getId())
            .name(organization.getName())
            .description(organization.getDescription())
            .logoUrl(organization.getLogoUrl())
            .domain(organization.getDomain())
            .subscriptionPlan(organization.getSubscriptionPlan())
            .maxUsers(organization.getMaxUsers())
            .owner(UserDto.fromEntity(organization.getOwner()))
            .createdAt(organization.getCreatedAt())
            .updatedAt(organization.getUpdatedAt())
            .totalUsers(organization.getUsers() != null ? (long) organization.getUsers().size() : 0L)
            .totalDepartments(organization.getDepartments() != null ? (long) organization.getDepartments().size() : 0L)
            .build();
    }
}
