package com.gamifiedpm.dto.request;

import lombok.Data;

@Data
public class UpdateUserSettingsRequest {
    private Boolean emailNotifications;
    private Boolean pushNotifications;
    private Boolean weeklyReport;
    private String language;
    private String timezone;
    private String theme;
}
