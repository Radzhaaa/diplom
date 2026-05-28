package com.gamifiedpm.service;

import com.gamifiedpm.model.entity.AuditLog;
import com.gamifiedpm.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Async
    public void log(String actorEmail,
                    String action,
                    String resourceType,
                    Long   resourceId,
                    String description,
                    String ipAddress,
                    boolean success) {
        try {
            AuditLog entry = AuditLog.builder()
                .actorEmail(actorEmail  != null ? actorEmail  : "anonymous")
                .action(action)
                .resourceType(resourceType)
                .resourceId(resourceId)
                .description(description)
                .ipAddress(ipAddress)
                .success(success)
                .build();
            auditLogRepository.save(entry);
        } catch (Exception ex) {
            log.error("Failed to write audit log [action={}, actor={}]: {}", action, actorEmail, ex.getMessage());
        }
    }

    @Async
    public void log(String actorEmail, String action, String description, String ipAddress, boolean success) {
        log(actorEmail, action, null, null, description, ipAddress, success);
    }
}
