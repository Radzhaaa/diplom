package com.gamifiedpm.repository;

import com.gamifiedpm.model.entity.Project;
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
public interface ProjectRepository extends JpaRepository<Project, Long> {


    List<Project> findByCreatedByAndDeletedAtIsNull(User user);

    Optional<Project> findByIdAndDeletedAtIsNull(Long id);

    @Query("""
        SELECT p FROM Project p
        WHERE p.deletedAt IS NULL
          AND (p.createdBy = :user
              OR EXISTS (SELECT tm FROM TeamMember tm WHERE tm.user = :user AND tm.team.project = p)
              OR EXISTS (SELECT pm FROM ProjectMember pm WHERE pm.user = :user AND pm.project = p)
          )
          AND (:orgId IS NULL OR p.organization.id = :orgId OR p.organization IS NULL)
        """)
    List<Project> findUserProjects(@Param("user") User user, @Param("orgId") Long orgId);

    default List<Project> findUserProjects(User user) {
        return findUserProjects(user, null);
    }

    @Query(value = """
        SELECT p FROM Project p
        WHERE p.deletedAt IS NULL
          AND (p.createdBy = :user
              OR EXISTS (SELECT tm FROM TeamMember tm WHERE tm.user = :user AND tm.team.project = p)
              OR EXISTS (SELECT pm FROM ProjectMember pm WHERE pm.user = :user AND pm.project = p)
          )
          AND (:orgId IS NULL OR p.organization.id = :orgId OR p.organization IS NULL)
        """,
        countQuery = """
        SELECT COUNT(p) FROM Project p
        WHERE p.deletedAt IS NULL
          AND (p.createdBy = :user
              OR EXISTS (SELECT tm FROM TeamMember tm WHERE tm.user = :user AND tm.team.project = p)
              OR EXISTS (SELECT pm FROM ProjectMember pm WHERE pm.user = :user AND pm.project = p)
          )
          AND (:orgId IS NULL OR p.organization.id = :orgId OR p.organization IS NULL)
        """)
    Page<Project> findUserProjectsPaged(@Param("user") User user, @Param("orgId") Long orgId, Pageable pageable);

    default Page<Project> findUserProjectsPaged(User user, Pageable pageable) {
        return findUserProjectsPaged(user, null, pageable);
    }

    Optional<Project> findByInviteToken(String inviteToken);

    @Query("""
        SELECT p FROM Project p
        WHERE p.deletedAt IS NOT NULL
          AND (p.createdBy = :user
              OR EXISTS (SELECT pm FROM ProjectMember pm WHERE pm.user = :user AND pm.project = p)
          )
        ORDER BY p.deletedAt DESC
        """)
    List<Project> findDeletedUserProjects(@Param("user") User user);


    default List<Project> findByCreatedBy(User user) {
        return findByCreatedByAndDeletedAtIsNull(user);
    }
}




