package com.gamifiedpm.dto.response;

import com.gamifiedpm.model.entity.Department;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
public class DepartmentDto {

    private Long id;
    private Long organizationId;
    private String name;
    private String description;
    private Long parentDepartmentId;
    private String parentDepartmentName;
    private UserDto manager;
    private int totalUsers;
    private int totalSubDepartments;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static DepartmentDto fromEntity(Department dept) {
        return DepartmentDto.builder()
                .id(dept.getId())
                .organizationId(dept.getOrganization().getId())
                .name(dept.getName())
                .description(dept.getDescription())
                .parentDepartmentId(dept.getParentDepartment() != null ? dept.getParentDepartment().getId() : null)
                .parentDepartmentName(dept.getParentDepartment() != null ? dept.getParentDepartment().getName() : null)
                .manager(dept.getManager() != null ? UserDto.fromEntity(dept.getManager()) : null)
                .totalUsers(dept.getUsers().size())
                .totalSubDepartments(dept.getSubDepartments().size())
                .createdAt(dept.getCreatedAt())
                .updatedAt(dept.getUpdatedAt())
                .build();
    }
}
