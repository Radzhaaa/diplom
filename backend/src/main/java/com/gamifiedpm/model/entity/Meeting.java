package com.gamifiedpm.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "meetings", indexes = {
    @Index(name = "idx_meeting_project",   columnList = "project_id"),
    @Index(name = "idx_meeting_organizer", columnList = "organizer_id"),
    @Index(name = "idx_meeting_datetime",  columnList = "date_time")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Meeting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 1000)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organizer_id", nullable = false)
    private User organizer;

    @Column(name = "date_time", nullable = false)
    private LocalDateTime dateTime;

    @Column(name = "duration_minutes")
    @Builder.Default
    private int durationMinutes = 60;

    @Column(name = "jitsi_link", length = 500)
    private String jitsiLink;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private MeetingStatus status = MeetingStatus.SCHEDULED;

    @ManyToMany
    @JoinTable(
        name = "meeting_participants",
        joinColumns = @JoinColumn(name = "meeting_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    @Builder.Default
    private List<User> participants = new ArrayList<>();

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum MeetingStatus {
        SCHEDULED, CANCELLED, COMPLETED
    }
}
