package com.gamifiedpm.dto.response;

import java.time.Instant;

public record ChatMessageDto(
        Long id,
        Long projectId,
        String senderEmail,
        String senderFirstName,
        String senderLastName,
        String senderAvatar,
        String content,
        Instant createdAt
) {}
