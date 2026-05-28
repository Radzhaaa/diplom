package com.gamifiedpm.repository;

import com.gamifiedpm.model.entity.Task;
import com.gamifiedpm.model.entity.TaskDependency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskDependencyRepository extends JpaRepository<TaskDependency, Long> {

    List<TaskDependency> findByBlockedTask(Task blockedTask);

    List<TaskDependency> findByBlockingTask(Task blockingTask);

    @Query("SELECT d FROM TaskDependency d WHERE d.blockedTask = :task OR d.blockingTask = :task")
    List<TaskDependency> findAllByTask(@Param("task") Task task);

    Optional<TaskDependency> findByBlockingTaskAndBlockedTask(Task blocking, Task blocked);

    boolean existsByBlockingTaskAndBlockedTask(Task blocking, Task blocked);
}
