package com.gamifiedpm.dto.response;

import com.gamifiedpm.model.entity.Meeting;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeetingDto {
    private Long id;
    private String title;
    private String description;
    private Long projectId;
    private String projectName;
    private UserDto organizer;
    private LocalDateTime dateTime;
    private int durationMinutes;
    private String jitsiLink;
    private String status;
    private List<UserDto> participants;
    private LocalDateTime createdAt;

    public static MeetingDto fromEntity(Meeting meeting) {
        return MeetingDto.builder()
            .id(meeting.getId())
            .title(meeting.getTitle())
            .description(meeting.getDescription())
            .projectId(meeting.getProject() != null ? meeting.getProject().getId() : null)
            .projectName(meeting.getProject() != null ? meeting.getProject().getName() : null)
            .organizer(UserDto.fromEntity(meeting.getOrganizer()))
            .dateTime(meeting.getDateTime())
            .durationMinutes(meeting.getDurationMinutes())
            .jitsiLink(meeting.getJitsiLink())
            .status(meeting.getStatus().name())
            .participants(meeting.getParticipants().stream()
                .map(UserDto::fromEntity)
                .collect(Collectors.toList()))
            .createdAt(meeting.getCreatedAt())
            .build();
    }
}
