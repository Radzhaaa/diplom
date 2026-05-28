package com.gamifiedpm.model.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_settings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "email_notifications", nullable = false)
    @Builder.Default
    private Boolean emailNotifications = true;

    @Column(name = "push_notifications", nullable = false)
    @Builder.Default
    private Boolean pushNotifications = true;

    @Column(name = "weekly_report", nullable = false)
    @Builder.Default
    private Boolean weeklyReport = false;

    @Column(name = "language", length = 10, nullable = false)
    @Builder.Default
    private String language = "ru";

    @Column(name = "timezone", length = 50, nullable = false)
    @Builder.Default
    private String timezone = "Europe/Moscow";

    @Column(name = "theme", length = 10, nullable = false)
    @Builder.Default
    private String theme = "AUTO";
}
