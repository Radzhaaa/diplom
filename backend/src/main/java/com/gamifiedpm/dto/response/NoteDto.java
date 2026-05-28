package com.gamifiedpm.dto.response;

import com.gamifiedpm.model.entity.Note;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Data
@Builder
public class NoteDto {
    private Long id;
    private String title;
    private String content;
    private String color;
    private boolean pinned;
    private String deadline;
    private String createdAt;
    private String updatedAt;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    public static NoteDto fromEntity(Note n) {
        return NoteDto.builder()
                .id(n.getId())
                .title(n.getTitle())
                .content(n.getContent())
                .color(n.getColor())
                .pinned(n.isPinned())
                .deadline(n.getDeadline() != null ? n.getDeadline().format(FMT) : null)
                .createdAt(n.getCreatedAt() != null ? n.getCreatedAt().format(FMT) : null)
                .updatedAt(n.getUpdatedAt() != null ? n.getUpdatedAt().format(FMT) : null)
                .build();
    }
}
