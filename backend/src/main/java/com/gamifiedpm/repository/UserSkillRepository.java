package com.gamifiedpm.repository;

import com.gamifiedpm.model.entity.Skill;
import com.gamifiedpm.model.entity.User;
import com.gamifiedpm.model.entity.UserSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserSkillRepository extends JpaRepository<UserSkill, Long> {
    Optional<UserSkill> findByUserAndSkill(User user, Skill skill);
    List<UserSkill> findByUser(User user);
    void deleteBySkill(Skill skill);
}
