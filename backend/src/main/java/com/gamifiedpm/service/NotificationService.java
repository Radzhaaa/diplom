package com.gamifiedpm.service;

import com.gamifiedpm.dto.response.NotificationDto;
import com.gamifiedpm.model.entity.Notification;
import com.gamifiedpm.model.entity.User;
import com.gamifiedpm.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final WebSocketEventService webSocketEventService;

    @Transactional
    public Notification createNotification(
            User user,
            Notification.NotificationType type,
            String title,
            String message,
            Long relatedEntityId,
            String relatedEntityType) {

        Notification notification = Notification.builder()
            .user(user)
            .type(type)
            .title(title)
            .message(message)
            .isRead(false)
            .relatedEntityId(relatedEntityId)
            .relatedEntityType(relatedEntityType)
            .createdAt(LocalDateTime.now())
            .build();

        Notification saved = notificationRepository.save(notification);

        try {
            webSocketEventService.notifyUser(user.getEmail(), "NOTIFICATION", NotificationDto.fromEntity(saved));
        } catch (Exception e) {
            log.warn("Failed to push WebSocket notification for user {}: {}", user.getEmail(), e.getMessage());
        }

        return saved;
    }

    public List<Notification> getUserNotifications(User user) {
        return notificationRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public List<Notification> getUnreadNotifications(User user) {
        return notificationRepository.findByUserAndIsReadFalseOrderByCreatedAtDesc(user);
    }

    public Long getUnreadCount(User user) {
        return notificationRepository.countUnreadByUser(user);
    }

    @Transactional
    public void markAsRead(Long notificationId, User user) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new RuntimeException("Notification not found"));
        
        if (!notification.getUser().getId().equals(user.getId())) {
            throw new com.gamifiedpm.exception.AccessDeniedException("Unauthorized");
        }
        
        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(User user) {
        List<Notification> unread = getUnreadNotifications(user);
        unread.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(unread);
    }
}




