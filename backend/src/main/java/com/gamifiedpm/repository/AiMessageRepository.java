package com.gamifiedpm.repository;

import com.gamifiedpm.model.entity.AiConversation;
import com.gamifiedpm.model.entity.AiMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiMessageRepository extends JpaRepository<AiMessage, Long> {
    List<AiMessage> findByConversationOrderByCreatedAtAsc(AiConversation conversation);
}
