package com.gamifiedpm.service;

import com.gamifiedpm.dto.request.UpdateUserSettingsRequest;
import com.gamifiedpm.dto.response.UserSettingsDto;
import com.gamifiedpm.model.entity.User;
import com.gamifiedpm.model.entity.UserSettings;
import com.gamifiedpm.repository.UserRepository;
import com.gamifiedpm.repository.UserSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SettingsService {

    private final UserRepository userRepository;
    private final UserSettingsRepository userSettingsRepository;

    @Transactional(readOnly = true)
    public UserSettingsDto getUserSettings(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));

        UserSettings settings = userSettingsRepository.findByUser(user)
            .orElse(defaultSettings(user));

        return toDto(settings);
    }

    @Transactional
    public UserSettingsDto updateUserSettings(UpdateUserSettingsRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));

        UserSettings settings = userSettingsRepository.findByUser(user)
            .orElse(defaultSettings(user));

        if (request.getEmailNotifications() != null) settings.setEmailNotifications(request.getEmailNotifications());
        if (request.getPushNotifications() != null)  settings.setPushNotifications(request.getPushNotifications());
        if (request.getWeeklyReport() != null)        settings.setWeeklyReport(request.getWeeklyReport());
        if (request.getLanguage() != null)            settings.setLanguage(request.getLanguage());
        if (request.getTimezone() != null)            settings.setTimezone(request.getTimezone());
        if (request.getTheme() != null)               settings.setTheme(request.getTheme());

        settings = userSettingsRepository.save(settings);
        return toDto(settings);
    }

    private UserSettings defaultSettings(User user) {
        return UserSettings.builder().user(user).build();
    }

    private UserSettingsDto toDto(UserSettings s) {
        return UserSettingsDto.builder()
            .emailNotifications(s.getEmailNotifications())
            .pushNotifications(s.getPushNotifications())
            .weeklyReport(s.getWeeklyReport())
            .language(s.getLanguage())
            .timezone(s.getTimezone())
            .theme(s.getTheme())
            .build();
    }
}
