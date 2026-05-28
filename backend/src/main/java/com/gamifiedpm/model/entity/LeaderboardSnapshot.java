package com.gamifiedpm.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "leaderboard_snapshots", indexes = {
    @Index(name = "idx_snapshot_user_date", columnList = "user_id, snapshot_date"),
    @Index(name = "idx_snapshot_date", columnList = "snapshot_date")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "snapshot_date", nullable = false)
    private LocalDate snapshotDate;

    @Column(name = "rank_position", nullable = false)
    private Integer rankPosition;

    @Column(name = "total_xp", nullable = false)
    private Integer totalXp;
}
