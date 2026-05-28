package com.gamifiedpm.repository;

import com.gamifiedpm.model.entity.Task;
import com.gamifiedpm.model.entity.TaskHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskHistoryRepository extends JpaRepository<TaskHistory, Long> {
    List<TaskHistory> findByTaskOrderByChangedAtDesc(Task task);
    
    List<TaskHistory> findByTaskIdOrderByChangedAtDesc(Long taskId);
}
