package com.gamifiedpm.repository;

import com.gamifiedpm.model.entity.Project;
import com.gamifiedpm.model.entity.TeamMember;
import com.gamifiedpm.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {

    @Query("SELECT tm FROM TeamMember tm WHERE tm.team.project = :project AND tm.user = :user")
    Optional<TeamMember> findByProjectAndUser(Project project, User user);

    @Query("SELECT COUNT(tm) > 0 FROM TeamMember tm WHERE tm.team.project = :project AND tm.user = :user")
    boolean existsByProjectAndUser(Project project, User user);

    List<TeamMember> findByUser(User user);
}
