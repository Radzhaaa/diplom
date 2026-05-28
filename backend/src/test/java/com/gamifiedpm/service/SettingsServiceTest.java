package com.gamifiedpm.service;

import com.gamifiedpm.dto.request.UpdateUserSettingsRequest;
import com.gamifiedpm.dto.response.UserSettingsDto;
import com.gamifiedpm.model.entity.User;
import com.gamifiedpm.model.entity.UserSettings;
import com.gamifiedpm.repository.UserRepository;
import com.gamifiedpm.repository.UserSettingsRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SettingsServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private UserSettingsRepository userSettingsRepository;

    @InjectMocks private SettingsService service;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder().id(1L).email("user@test.com").build();
    }

    @Test
    void getUserSettings_returnsDefaults_whenNoSettingsExist() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(userSettingsRepository.findByUser(user)).thenReturn(Optional.empty());

        UserSettingsDto result = service.getUserSettings("user@test.com");

        assertThat(result.getEmailNotifications()).isTrue();
        assertThat(result.getPushNotifications()).isTrue();
        assertThat(result.getWeeklyReport()).isFalse();
        assertThat(result.getLanguage()).isEqualTo("ru");
        assertThat(result.getTheme()).isEqualTo("AUTO");
    }

    @Test
    void getUserSettings_returnsStoredSettings_whenExist() {
        UserSettings stored = UserSettings.builder()
            .user(user).emailNotifications(false).pushNotifications(false)
            .weeklyReport(true).language("en").timezone("UTC").theme("DARK")
            .build();
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(userSettingsRepository.findByUser(user)).thenReturn(Optional.of(stored));

        UserSettingsDto result = service.getUserSettings("user@test.com");

        assertThat(result.getEmailNotifications()).isFalse();
        assertThat(result.getLanguage()).isEqualTo("en");
        assertThat(result.getTheme()).isEqualTo("DARK");
    }

    @Test
    void updateUserSettings_savesAndReturnsUpdated() {
        UserSettings existing = UserSettings.builder()
            .user(user).emailNotifications(true).pushNotifications(true)
            .weeklyReport(false).language("ru").timezone("Europe/Moscow").theme("AUTO")
            .build();
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(userSettingsRepository.findByUser(user)).thenReturn(Optional.of(existing));
        when(userSettingsRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateUserSettingsRequest request = new UpdateUserSettingsRequest();
        request.setTheme("DARK");
        request.setLanguage("en");
        request.setWeeklyReport(true);

        UserSettingsDto result = service.updateUserSettings(request, "user@test.com");

        assertThat(result.getTheme()).isEqualTo("DARK");
        assertThat(result.getLanguage()).isEqualTo("en");
        assertThat(result.getWeeklyReport()).isTrue();
        assertThat(result.getEmailNotifications()).isTrue();
        verify(userSettingsRepository).save(any());
    }

    @Test
    void updateUserSettings_createsNew_whenNoSettingsExist() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(userSettingsRepository.findByUser(user)).thenReturn(Optional.empty());
        when(userSettingsRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateUserSettingsRequest request = new UpdateUserSettingsRequest();
        request.setTheme("LIGHT");

        UserSettingsDto result = service.updateUserSettings(request, "user@test.com");

        assertThat(result.getTheme()).isEqualTo("LIGHT");
        verify(userSettingsRepository).save(any());
    }
}
