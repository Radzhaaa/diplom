package com.gamifiedpm.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(
    name = "task_dependencies",
    uniqueConstraints = @UniqueConstraint(columnNames = {"blocking_task_id", "blocked_task_id"}),
    indexes = {
        @Index(name = "idx_dep_blocking", columnList = "blocking_task_id"),
        @Index(name = "idx_dep_blocked",  columnList = "blocked_task_id")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskDependency {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blocking_task_id", nullable = false)
    private Task blockingTask;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blocked_task_id", nullable = false)
    private Task blockedTask;
}
