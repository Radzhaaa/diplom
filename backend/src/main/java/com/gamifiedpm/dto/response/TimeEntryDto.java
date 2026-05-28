package com.gamifiedpm.dto.response;

import com.gamifiedpm.model.entity.TimeEntry;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TimeEntryDto {
    private Long id;
    private Long taskId;
    private Long userId;
    private String userFullName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer durationMinutes;
    private String note;
    private boolean active;

    public static TimeEntryDto fromEntity(TimeEntry e) {
        TimeEntryDto dto = new TimeEntryDto();
        dto.setId(e.getId());
        dto.setTaskId(e.getTask().getId());
        dto.setUserId(e.getUser().getId());
        String firstName = e.getUser().getFirstName() != null ? e.getUser().getFirstName() : "";
        String lastName  = e.getUser().getLastName()  != null ? e.getUser().getLastName()  : "";
        dto.setUserFullName((firstName + " " + lastName).trim());
        dto.setStartTime(e.getStartTime());
        dto.setEndTime(e.getEndTime());
        dto.setDurationMinutes(e.getDurationMinutes());
        dto.setNote(e.getNote());
        dto.setActive(e.isActive());
        return dto;
    }
}
