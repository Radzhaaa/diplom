package com.gamifiedpm.dto.response;

import com.gamifiedpm.model.entity.TaskChecklistItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskChecklistItemDto {
    private Long id;
    private Long taskId;
    private String title;
    private Boolean completed;
    private Integer sortOrder;

    public static TaskChecklistItemDto fromEntity(TaskChecklistItem item) {
        return TaskChecklistItemDto.builder()
            .id(item.getId())
            .taskId(item.getTask().getId())
            .title(item.getTitle())
            .completed(item.getCompleted())
            .sortOrder(item.getSortOrder())
            .build();
    }
}
