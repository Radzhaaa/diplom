package com.gamifiedpm.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "quests")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Quest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuestType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuestStatus status;

    @Column(nullable = false)
    private Integer xpReward;

    @Column(nullable = false)
    private Integer targetValue;

    @Column(nullable = false)
    private Integer currentProgress;

    @Column(nullable = false)
    private String conditionType;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "icon")
    private String icon;

    @Column(name = "difficulty")
    @Enumerated(EnumType.STRING)
    private Difficulty difficulty;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_user_id")
    private User assignedToUser;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum QuestType {
        DAILY,
        WEEKLY,
        SPECIAL,
        EVENT
    }

    public enum QuestStatus {
        ACTIVE,
        COMPLETED,
        EXPIRED,
        LOCKED
    }

    public enum Difficulty {
        EASY,
        MEDIUM,
        HARD,
        LEGENDARY
    }

    public boolean isCompleted() {
        return currentProgress >= targetValue;
    }

    public Double getProgressPercentage() {
        return (double) currentProgress / targetValue * 100;
    }
}
