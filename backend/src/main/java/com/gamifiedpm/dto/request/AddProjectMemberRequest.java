package com.gamifiedpm.dto.request;

import com.gamifiedpm.model.entity.ProjectMember;
import jakarta.validation.constraints.Email;
import lombok.Data;

@Data
public class AddProjectMemberRequest {
    private Long userId;

    @Email(message = "Некорректный формат email")
    private String email;

    private ProjectMember.ProjectRole role = ProjectMember.ProjectRole.DEVELOPER;
}
