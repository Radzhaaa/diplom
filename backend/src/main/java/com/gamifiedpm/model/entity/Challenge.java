package com.gamifiedpm.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "challenges")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Challenge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChallengeType type;

    @Column(nullable = false)
    private Integer xpReward;

    @Column(nullable = false)
    private Integer targetValue;

    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDateTime endDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ChallengeStatus status = ChallengeStatus.UPCOMING;

    @Column(name = "icon")
    private String icon;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum ChallengeType {
        TEAM,
        INDIVIDUAL,
        GLOBAL
    }

    public enum ChallengeStatus {
        UPCOMING,
        ACTIVE,
        COMPLETED,
        EXPIRED
    }

    public boolean isActive() {
        LocalDateTime now = LocalDateTime.now();
        return status == ChallengeStatus.ACTIVE && 
               now.isAfter(startDate) && 
               now.isBefore(endDate);
    }
}
