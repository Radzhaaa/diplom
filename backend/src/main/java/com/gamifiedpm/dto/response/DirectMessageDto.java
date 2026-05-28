package com.gamifiedpm.dto.response;

import java.time.Instant;

public record DirectMessageDto(
        Long id,
        String senderEmail,
        String senderFirstName,
        String senderLastName,
        String senderAvatar,
        String receiverEmail,
        String content,
        Instant createdAt,
        Instant readAt
) {}
