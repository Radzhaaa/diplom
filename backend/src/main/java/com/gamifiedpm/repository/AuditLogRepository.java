package com.gamifiedpm.repository;

import com.gamifiedpm.model.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByActorEmailOrderByCreatedAtDesc(String actorEmail);

    Page<AuditLog> findByActionOrderByCreatedAtDesc(String action, Pageable pageable);

    List<AuditLog> findByActorEmailAndCreatedAtBetweenOrderByCreatedAtDesc(
            String actorEmail, LocalDateTime from, LocalDateTime to);

    List<AuditLog> findBySuccessFalseAndCreatedAtAfterOrderByCreatedAtDesc(LocalDateTime after);
}
