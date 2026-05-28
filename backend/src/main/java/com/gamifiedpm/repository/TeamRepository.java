package com.gamifiedpm.repository;

import com.gamifiedpm.model.entity.Project;
import com.gamifiedpm.model.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {
    List<Team> findByProject(Project project);

    @Query("SELECT COUNT(t) > 0 FROM Team t WHERE t.project.id = :projectId AND t.department.id = :departmentId")
    boolean existsByProjectIdAndDepartmentId(Long projectId, Long departmentId);
}
