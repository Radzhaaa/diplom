package com.gamifiedpm.dto.response;

import com.gamifiedpm.model.entity.Notification;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {
    private Long id;
    private Notification.NotificationType type;
    private String title;
    private String message;
    private Boolean isRead;
    private Long relatedEntityId;
    private String relatedEntityType;
    private LocalDateTime createdAt;
    
    public static NotificationDto fromEntity(Notification notification) {
        return NotificationDto.builder()
            .id(notification.getId())
            .type(notification.getType())
            .title(notification.getTitle())
            .message(notification.getMessage())
            .isRead(notification.getIsRead())
            .relatedEntityId(notification.getRelatedEntityId())
            .relatedEntityType(notification.getRelatedEntityType())
            .createdAt(notification.getCreatedAt())
            .build();
    }
}
