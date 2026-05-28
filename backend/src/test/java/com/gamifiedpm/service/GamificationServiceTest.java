package com.gamifiedpm.service;

import com.gamifiedpm.model.entity.*;
import com.gamifiedpm.repository.ActivityLogRepository;
import com.gamifiedpm.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GamificationServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private NotificationService notificationService;
    @Mock private AchievementService achievementService;
    @Mock private ActivityLogRepository activityLogRepository;

    @InjectMocks private GamificationService service;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
            .id(1L).email("user@test.com")
            .totalXp(0).level(1).currentStreak(0)
            .role(User.Role.TEAM_MEMBER)
            .build();
    }

    @Test
    void awardXp_increasesTotalXp() {
        when(userRepository.save(any())).thenReturn(user);
        when(activityLogRepository.save(any())).thenReturn(null);

        service.awardXp(user, 50);

        assertThat(user.getTotalXp()).isEqualTo(50);
        verify(userRepository).save(user);
    }

    @Test
    void awardXp_writesActivityLog() {
        when(userRepository.save(any())).thenReturn(user);

        service.awardXpWithSource(user, 25, "TASK", "Задача выполнена");

        verify(activityLogRepository).save(argThat(log ->
            "XP_EARNED".equals(((ActivityLog) log).getActivityType()) &&
            ((ActivityLog) log).getMetadata().contains("\"xp\":25") &&
            ((ActivityLog) log).getMetadata().contains("\"source\":\"TASK\"")
        ));
    }

    @Test
    void awardXp_triggersLevelUp_whenThresholdReached() {
        user.setTotalXp(148);
        user.setLevel(1);
        when(userRepository.save(any())).thenReturn(user);
        when(activityLogRepository.save(any())).thenReturn(null);

        service.awardXp(user, 10); // 158 XP → уровень 2 (порог: 150 XP)

        assertThat(user.getLevel()).isGreaterThan(1);
        verify(notificationService).createNotification(
            eq(user), eq(Notification.NotificationType.LEVEL_UP), any(), any(), any(), any()
        );
    }

    @Test
    void awardXp_noLevelUp_whenStillOnSameLevel() {
        user.setTotalXp(0);
        user.setLevel(1);
        when(userRepository.save(any())).thenReturn(user);
        when(activityLogRepository.save(any())).thenReturn(null);

        service.awardXp(user, 5);

        assertThat(user.getLevel()).isEqualTo(1);
        verify(notificationService, never()).createNotification(
            any(), eq(Notification.NotificationType.LEVEL_UP), any(), any(), any(), any()
        );
    }

    @Test
    void updateStreak_setsStreak1_whenFirstActivity() {
        user.setLastActivityDate(null);
        when(userRepository.save(any())).thenReturn(user);

        service.updateStreak(user);

        assertThat(user.getCurrentStreak()).isEqualTo(1);
    }

    @Test
    void updateStreak_increments_whenConsecutiveDay() {
        user.setCurrentStreak(3);
        user.setLastActivityDate(java.time.LocalDateTime.now().minusDays(1));
        when(userRepository.save(any())).thenReturn(user);

        service.updateStreak(user);

        assertThat(user.getCurrentStreak()).isEqualTo(4);
    }

    @Test
    void updateStreak_resets_whenDaySkipped() {
        user.setCurrentStreak(5);
        user.setLastActivityDate(java.time.LocalDateTime.now().minusDays(3));
        when(userRepository.save(any())).thenReturn(user);

        service.updateStreak(user);

        assertThat(user.getCurrentStreak()).isEqualTo(1);
    }
}
