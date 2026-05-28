package com.gamifiedpm.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiskItemDto {

    public enum RiskLevel { HIGH, MEDIUM, LOW }

    private Long taskId;
    private String taskTitle;
    private RiskLevel riskLevel;
    private String reason;
}
