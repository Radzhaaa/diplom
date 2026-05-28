package com.gamifiedpm.dto.request;

import com.gamifiedpm.model.entity.Task;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class BulkTaskUpdateRequest {
    @NotEmpty
    private List<Long> ids;

    @NotNull
    private BulkAction action;

    private Task.TaskStatus status;
    private Long assignedToId;

    public enum BulkAction {
        CHANGE_STATUS,
        REASSIGN,
        DELETE
    }
}
