package com.gamifiedpm.dto.response;

import java.time.Instant;

public record DmConversationDto(
        String partnerEmail,
        String partnerFirstName,
        String partnerLastName,
        String partnerAvatar,
        String lastMessage,
        Instant lastMessageAt,
        long unreadCount
) {}
