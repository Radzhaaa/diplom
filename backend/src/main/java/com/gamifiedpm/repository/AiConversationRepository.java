package com.gamifiedpm.repository;

import com.gamifiedpm.model.entity.AiConversation;
import com.gamifiedpm.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiConversationRepository extends JpaRepository<AiConversation, Long> {
    List<AiConversation> findByUserOrderByUpdatedAtDesc(User user);
    List<AiConversation> findByUserAndContextTypeAndContextId(User user, String contextType, Long contextId);
}
