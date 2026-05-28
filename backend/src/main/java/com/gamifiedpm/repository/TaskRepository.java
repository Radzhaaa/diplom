package com.gamifiedpm.repository;

import com.gamifiedpm.model.entity.Project;
import com.gamifiedpm.model.entity.Task;
import com.gamifiedpm.model.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {


    List<Task> findByProjectAndDeletedAtIsNull(Project project);

    List<Task> findByAssignedToAndDeletedAtIsNull(User user);

    Optional<Task> findByIdAndDeletedAtIsNull(Long id);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.assignedTo = :user AND t.status = 'COMPLETED' AND t.deletedAt IS NULL")
    Long countCompletedTasksByUser(@Param("user") User user);

    @Query("""
        SELECT DISTINCT t FROM Task t
        WHERE t.deletedAt IS NULL
          AND (
            t.assignedTo = :user
            OR t.createdBy = :user
            OR :user MEMBER OF t.coExecutors
            OR t.project IN (
                SELECT p FROM Project p
                WHERE p.deletedAt IS NULL
                  AND (
                    p.createdBy = :user
                    OR EXISTS (SELECT tm FROM TeamMember tm WHERE tm.user = :user AND tm.team.project = p)
                    OR EXISTS (SELECT pm FROM ProjectMember pm WHERE pm.user = :user AND pm.project = p)
                  )
            )
          )
          AND (:search IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%', :search, '%'))
                               OR LOWER(t.description) LIKE LOWER(CONCAT('%', :search, '%')))
          AND (:status IS NULL OR t.status = :status)
          AND (:priority IS NULL OR t.priority = :priority)
          AND (:projectId IS NULL OR t.project.id = :projectId)
          AND (:assignedToId IS NULL OR t.assignedTo.id = :assignedToId)
        ORDER BY t.createdAt DESC
        """)
    Page<Task> searchUserTasks(
        @Param("user") User user,
        @Param("search") String search,
        @Param("status") Task.TaskStatus status,
        @Param("priority") Task.Priority priority,
        @Param("projectId") Long projectId,
        @Param("assignedToId") Long assignedToId,
        Pageable pageable
    );

    @Query("""
        SELECT DISTINCT t FROM Task t
        WHERE t.deletedAt IS NULL
          AND (
            t.assignedTo = :user
            OR t.createdBy = :user
            OR :user MEMBER OF t.coExecutors
            OR :user MEMBER OF t.observers
            OR t.project IN (
                SELECT p FROM Project p
                WHERE p.deletedAt IS NULL
                  AND (
                    p.createdBy = :user
                    OR EXISTS (SELECT tm FROM TeamMember tm WHERE tm.user = :user AND tm.team.project = p)
                    OR EXISTS (SELECT pm FROM ProjectMember pm WHERE pm.user = :user AND pm.project = p)
                  )
            )
          )
        """)
    List<Task> findTasksByUserProjects(@Param("user") User user);

    @Query("""
        SELECT DISTINCT t FROM Task t
        WHERE (t.deletedAt IS NOT NULL OR t.status = 'CANCELLED')
          AND (
            t.assignedTo = :user
            OR t.createdBy = :user
            OR :user MEMBER OF t.coExecutors
            OR t.project IN (
                SELECT p FROM Project p
                WHERE p.deletedAt IS NULL
                  AND (
                    p.createdBy = :user
                    OR EXISTS (SELECT tm FROM TeamMember tm WHERE tm.user = :user AND tm.team.project = p)
                    OR EXISTS (SELECT pm FROM ProjectMember pm WHERE pm.user = :user AND pm.project = p)
                  )
            )
          )
        ORDER BY CASE WHEN t.deletedAt IS NOT NULL THEN t.deletedAt ELSE t.updatedAt END DESC
        """)
    List<Task> findArchivedTasksByUser(@Param("user") User user);

    @Query("""
        SELECT DISTINCT t FROM Task t
        WHERE t.deletedAt IS NULL
          AND (t.status = 'COMPLETED' OR t.status = 'DONE')
          AND (
            t.assignedTo = :user
            OR t.createdBy = :user
            OR :user MEMBER OF t.coExecutors
            OR t.project IN (
                SELECT p FROM Project p
                WHERE p.deletedAt IS NULL
                  AND (
                    p.createdBy = :user
                    OR EXISTS (SELECT tm FROM TeamMember tm WHERE tm.user = :user AND tm.team.project = p)
                    OR EXISTS (SELECT pm FROM ProjectMember pm WHERE pm.user = :user AND pm.project = p)
                  )
            )
          )
        ORDER BY t.completedAt DESC NULLS LAST
        """)
    List<Task> findCompletedTasksByUser(@Param("user") User user);

    @Query("SELECT t FROM Task t WHERE t.deletedAt IS NOT NULL AND t.deletedAt < :cutoff")
    List<Task> findTasksDeletedBefore(@Param("cutoff") java.time.LocalDateTime cutoff);

    default List<Task> findByProject(Project project) {
        return findByProjectAndDeletedAtIsNull(project);
    }

    default List<Task> findByAssignedTo(User user) {
        return findByAssignedToAndDeletedAtIsNull(user);
    }
}
