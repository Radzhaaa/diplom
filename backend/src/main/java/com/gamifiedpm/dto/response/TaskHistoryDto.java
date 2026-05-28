package com.gamifiedpm.dto.response;

import com.gamifiedpm.model.entity.TaskHistory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskHistoryDto {
    private Long id;
    private String fieldName;
    private String oldValue;
    private String newValue;
    private TaskHistory.ChangeType changeType;
    private String changedByName;
    private LocalDateTime changedAt;

    public static TaskHistoryDto fromEntity(TaskHistory history) {
        return TaskHistoryDto.builder()
            .id(history.getId())
            .fieldName(history.getFieldName())
            .oldValue(history.getOldValue())
            .newValue(history.getNewValue())
            .changeType(history.getChangeType())
            .changedByName(history.getChangedBy().getFirstName() + " " + history.getChangedBy().getLastName())
            .changedAt(history.getChangedAt())
            .build();
    }
}
