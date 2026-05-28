package com.gamifiedpm.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSettingsDto {
    private Boolean emailNotifications;
    private Boolean pushNotifications;
    private Boolean weeklyReport;
    private String language;
    private String timezone;
    private String theme;
}
