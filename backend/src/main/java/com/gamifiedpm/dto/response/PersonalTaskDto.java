package com.gamifiedpm.dto.response;

import com.gamifiedpm.model.entity.PersonalTask;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PersonalTaskDto {
    private Long id;
    private String title;
    private String description;
    private String priority;
    private String status;
    private LocalDateTime deadline;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;

    public static PersonalTaskDto fromEntity(PersonalTask t) {
        return PersonalTaskDto.builder()
                .id(t.getId())
                .title(t.getTitle())
                .description(t.getDescription())
                .priority(t.getPriority().name())
                .status(t.getStatus().name())
                .deadline(t.getDeadline())
                .completedAt(t.getCompletedAt())
                .createdAt(t.getCreatedAt())
                .build();
    }
}
