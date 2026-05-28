package com.gamifiedpm.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class LogTimeRequest {

    @NotNull
    @Min(1)
    private Integer durationMinutes;

    private String note;
}
