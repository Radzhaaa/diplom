package com.gamifiedpm.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "task_checklist_items", indexes = {
    @Index(name = "idx_checklist_task", columnList = "task_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskChecklistItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @Column(nullable = false, length = 1000)
    private String title;

    @Column(nullable = false)
    @Builder.Default
    private Boolean completed = false;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;
}
