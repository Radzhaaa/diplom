package com.gamifiedpm.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectPermissionsDto {
    private boolean canView;
    private boolean canEdit;
    private boolean canDelete;
    private boolean canCreateTask;
    private boolean canManageMembers;
}
