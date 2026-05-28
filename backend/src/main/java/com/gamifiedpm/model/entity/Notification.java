package com.gamifiedpm.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications", indexes = {
    @Index(name = "idx_notification_user", columnList = "user_id"),
    @Index(name = "idx_notification_read", columnList = "is_read")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private Boolean isRead = false;

    @Column(name = "related_entity_id")
    private Long relatedEntityId;

    @Column(name = "related_entity_type")
    private String relatedEntityType;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum NotificationType {
        TASK_ASSIGNED,
        TASK_COMPLETED,
        TASK_COMMENTED,
        COMMENT_ADDED,
        PROJECT_CREATED,
        PROJECT_UPDATED,
        ACHIEVEMENT_UNLOCKED,
        LEVEL_UP,
        DEADLINE_APPROACHING,
        DEADLINE_PASSED,
        QUEST_COMPLETED,
        SKILL_LEVEL_UP,
        CHALLENGE_STARTED,
        CHALLENGE_COMPLETED,
        REWARD_UNLOCKED,
        MENTION,
        MEETING_INVITE,
        NEW_MESSAGE
    }
}




