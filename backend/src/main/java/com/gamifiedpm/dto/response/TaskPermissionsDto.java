package com.gamifiedpm.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskPermissionsDto {
    private boolean canView;
    private boolean canEdit;
    private boolean canDelete;
    private boolean canComplete;
    private boolean canChangeDeadline;
    private boolean canChangeAssignee;
}
