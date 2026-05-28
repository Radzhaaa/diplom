package com.gamifiedpm.repository;

import com.gamifiedpm.model.entity.Quest;
import com.gamifiedpm.model.entity.User;
import com.gamifiedpm.model.entity.UserQuest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserQuestRepository extends JpaRepository<UserQuest, Long> {
    Optional<UserQuest> findByUserAndQuest(User user, Quest quest);
    List<UserQuest> findByQuestId(Long questId);
    List<UserQuest> findByUserId(Long userId);
    @Transactional
    void deleteByQuestId(Long questId);
}
