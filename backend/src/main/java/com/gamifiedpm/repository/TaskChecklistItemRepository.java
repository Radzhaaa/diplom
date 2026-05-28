package com.gamifiedpm.repository;

import com.gamifiedpm.model.entity.TaskChecklistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskChecklistItemRepository extends JpaRepository<TaskChecklistItem, Long> {
    List<TaskChecklistItem> findByTaskIdOrderBySortOrderAsc(Long taskId);
}
