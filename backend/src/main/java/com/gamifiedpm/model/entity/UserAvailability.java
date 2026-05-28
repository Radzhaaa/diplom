package com.gamifiedpm.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "user_availability", indexes = {
    @Index(name = "idx_avail_user_date", columnList = "user_id, date")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uq_avail_user_date_hour", columnNames = {"user_id", "date", "hour_of_day"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAvailability {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "hour_of_day", nullable = false)
    private int hour;
}
