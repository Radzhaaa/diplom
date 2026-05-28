package com.gamifiedpm.dto.request;

import com.gamifiedpm.model.entity.User;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRoleRequest {
    @NotNull(message = "Role is required")
    private User.Role role;
}
