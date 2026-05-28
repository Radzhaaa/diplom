package com.gamifiedpm.repository;

import com.gamifiedpm.model.entity.Project;
import com.gamifiedpm.model.entity.ProjectMember;
import com.gamifiedpm.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {

    Optional<ProjectMember> findByProjectAndUser(Project project, User user);

    List<ProjectMember> findByProjectOrderByJoinedAtAsc(Project project);

    boolean existsByProjectAndUser(Project project, User user);

    void deleteByProjectAndUser(Project project, User user);

    List<ProjectMember> findByUser(User user);

    long countByProject(Project project);
}
