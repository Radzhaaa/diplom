package com.gamifiedpm.dto.request;

import lombok.Data;

@Data
public class CreateNoteRequest {
    private String title;
    private String content;
    private String color;
    private Boolean pinned;
    private String deadline;
}
