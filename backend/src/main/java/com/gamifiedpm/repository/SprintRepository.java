package com.gamifiedpm.repository;

import com.gamifiedpm.model.entity.Project;
import com.gamifiedpm.model.entity.Sprint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SprintRepository extends JpaRepository<Sprint, Long> {

    List<Sprint> findByProjectOrderByStartDateAsc(Project project);

    Optional<Sprint> findByProjectAndStatus(Project project, Sprint.SprintStatus status);

    List<Sprint> findByProjectAndStatusOrderByStartDateAsc(Project project, Sprint.SprintStatus status);
}
