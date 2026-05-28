package com.gamifiedpm.controller;

import com.gamifiedpm.dto.response.NotificationDto;
import com.gamifiedpm.dto.response.PageResponse;
import com.gamifiedpm.model.entity.Notification;
import com.gamifiedpm.model.entity.User;
import com.gamifiedpm.repository.NotificationRepository;
import com.gamifiedpm.repository.UserRepository;
import com.gamifiedpm.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Notifications", description = "Уведомления пользователей")
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getNotifications(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "0") int size) {
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));

        if (size > 0) {
            PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<NotificationDto> paged = notificationRepository
                    .findByUserOrderByCreatedAtDesc(user, pageable)
                    .map(NotificationDto::fromEntity);
            return ResponseEntity.ok(PageResponse.of(paged));
        }

        List<NotificationDto> notifications = notificationService.getUserNotifications(user)
            .stream()
            .map(NotificationDto::fromEntity)
            .collect(Collectors.toList());
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/unread")
    public ResponseEntity<List<NotificationDto>> getUnreadNotifications(Authentication authentication) {
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<NotificationDto> notifications = notificationService.getUnreadNotifications(user)
            .stream()
            .map(NotificationDto::fromEntity)
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(notifications);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationDto> markAsRead(
            @PathVariable Long id,
            Authentication authentication) {
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        notificationService.markAsRead(id, user);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(Authentication authentication) {
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        notificationService.markAllAsRead(user);
        return ResponseEntity.ok().build();
    }
}
