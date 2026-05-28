package com.gamifiedpm.service;

import com.gamifiedpm.exception.AccessDeniedException;
import com.gamifiedpm.model.entity.Notification;
import com.gamifiedpm.model.entity.User;
import com.gamifiedpm.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock private NotificationRepository notificationRepository;
    @Mock private WebSocketEventService webSocketEventService;

    @InjectMocks private NotificationService notificationService;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(1L).email("user@test.com")
                .firstName("Alice").lastName("Smith")
                .role(User.Role.TEAM_MEMBER)
                .build();
    }


    @Test
    void createNotification_savesAndPushes() {
        Notification saved = Notification.builder()
                .id(1L).user(user)
                .type(Notification.NotificationType.COMMENT_ADDED)
                .title("New comment").message("Bob commented")
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        given(notificationRepository.save(any(Notification.class))).willReturn(saved);

        Notification result = notificationService.createNotification(
                user,
                Notification.NotificationType.COMMENT_ADDED,
                "New comment", "Bob commented",
                10L, "TASK");

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getIsRead()).isFalse();
        verify(notificationRepository).save(any());
        verify(webSocketEventService).notifyUser(eq("user@test.com"), eq("NOTIFICATION"), any());
    }

    @Test
    void createNotification_doesNotThrow_whenWebSocketFails() {
        Notification saved = Notification.builder()
                .id(2L).user(user)
                .type(Notification.NotificationType.TASK_ASSIGNED)
                .title("Task").message("Assigned to you")
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        given(notificationRepository.save(any())).willReturn(saved);
        doThrow(new RuntimeException("WS unavailable"))
                .when(webSocketEventService).notifyUser(any(), any(), any());

        // Should not throw — WebSocket failure is swallowed
        Notification result = notificationService.createNotification(
                user, Notification.NotificationType.TASK_ASSIGNED,
                "Task", "Assigned to you", 5L, "TASK");

        assertThat(result).isNotNull();
    }


    @Test
    void getUnreadCount_returnsCountFromRepository() {
        given(notificationRepository.countUnreadByUser(user)).willReturn(3L);

        long count = notificationService.getUnreadCount(user);

        assertThat(count).isEqualTo(3L);
    }


    @Test
    void markAsRead_setsReadTrue_whenOwner() {
        Notification notification = Notification.builder()
                .id(1L).user(user)
                .type(Notification.NotificationType.COMMENT_ADDED)
                .title("x").message("y").isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        given(notificationRepository.findById(1L)).willReturn(Optional.of(notification));

        notificationService.markAsRead(1L, user);

        assertThat(notification.getIsRead()).isTrue();
        verify(notificationRepository).save(notification);
    }

    @Test
    void markAsRead_throwsAccessDenied_whenDifferentUser() {
        User other = User.builder().id(99L).email("other@test.com")
                .firstName("X").lastName("Y").role(User.Role.TEAM_MEMBER).build();
        Notification notification = Notification.builder()
                .id(1L).user(user)
                .type(Notification.NotificationType.COMMENT_ADDED)
                .title("x").message("y").isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        given(notificationRepository.findById(1L)).willReturn(Optional.of(notification));

        assertThatThrownBy(() -> notificationService.markAsRead(1L, other))
                .isInstanceOf(AccessDeniedException.class);

        verify(notificationRepository, never()).save(any());
    }


    @Test
    void markAllAsRead_setsAllNotificationsRead() {
        Notification n1 = Notification.builder().id(1L).user(user)
                .type(Notification.NotificationType.COMMENT_ADDED)
                .title("a").message("b").isRead(false)
                .createdAt(LocalDateTime.now()).build();
        Notification n2 = Notification.builder().id(2L).user(user)
                .type(Notification.NotificationType.TASK_ASSIGNED)
                .title("c").message("d").isRead(false)
                .createdAt(LocalDateTime.now()).build();

        given(notificationRepository.findByUserAndIsReadFalseOrderByCreatedAtDesc(user))
                .willReturn(List.of(n1, n2));

        notificationService.markAllAsRead(user);

        assertThat(n1.getIsRead()).isTrue();
        assertThat(n2.getIsRead()).isTrue();
        verify(notificationRepository).saveAll(List.of(n1, n2));
    }
}
