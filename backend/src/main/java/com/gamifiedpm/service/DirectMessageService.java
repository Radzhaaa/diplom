package com.gamifiedpm.service;

import com.gamifiedpm.dto.response.DirectMessageDto;
import com.gamifiedpm.dto.response.DmConversationDto;
import com.gamifiedpm.model.entity.DirectMessage;
import com.gamifiedpm.model.entity.User;
import com.gamifiedpm.repository.DirectMessageRepository;
import com.gamifiedpm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DirectMessageService {

    private final DirectMessageRepository dmRepository;
    private final UserRepository userRepository;
    private final WebSocketEventService webSocketEventService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<DmConversationDto> getConversations(String userEmail) {
        List<Object[]> rows = dmRepository.findConversationSummaries(userEmail);
        List<DmConversationDto> result = new ArrayList<>();
        for (Object[] row : rows) {
            java.time.Instant lastMsgAt = null;
            if (row[5] != null) {
                Object ts = row[5];
                if (ts instanceof java.sql.Timestamp) {
                    lastMsgAt = ((java.sql.Timestamp) ts).toInstant();
                } else if (ts instanceof java.time.OffsetDateTime) {
                    lastMsgAt = ((java.time.OffsetDateTime) ts).toInstant();
                } else if (ts instanceof java.time.LocalDateTime) {
                    lastMsgAt = ((java.time.LocalDateTime) ts).toInstant(java.time.ZoneOffset.UTC);
                } else {
                    lastMsgAt = java.sql.Timestamp.valueOf(ts.toString()).toInstant();
                }
            }
            result.add(new DmConversationDto(
                    (String) row[0],
                    (String) row[1],
                    (String) row[2],
                    (String) row[3],
                    (String) row[4],
                    lastMsgAt,
                    row[6] != null ? ((Number) row[6]).longValue() : 0L
            ));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public Page<DirectMessageDto> getMessages(String myEmail, String otherEmail, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return dmRepository.findConversation(myEmail, otherEmail, pageable)
                .map(this::toDto);
    }

    @Transactional
    public DirectMessageDto sendMessage(String senderEmail, String receiverEmail, String content) {
        User sender = userRepository.findByEmail(senderEmail)
                .orElseThrow(() -> new IllegalArgumentException("Sender not found: " + senderEmail));
        User receiver = userRepository.findByEmail(receiverEmail)
                .orElseThrow(() -> new IllegalArgumentException("Receiver not found: " + receiverEmail));

        DirectMessage msg = DirectMessage.builder()
                .sender(sender)
                .receiver(receiver)
                .content(content)
                .build();

        DirectMessage saved = dmRepository.save(msg);
        DirectMessageDto dto = toDto(saved);

        webSocketEventService.notifyDirectMessage(receiverEmail, dto);

        try {
            String senderName = sender.getFirstName() + " " + sender.getLastName();
            String preview = content.length() > 60 ? content.substring(0, 60) + "…" : content;
            notificationService.createNotification(
                    receiver,
                    com.gamifiedpm.model.entity.Notification.NotificationType.NEW_MESSAGE,
                    "Новое сообщение от " + senderName,
                    preview,
                    null, null);
        } catch (Exception e) {
            log.warn("Failed to create DM notification: {}", e.getMessage());
        }

        log.debug("DM sent from {} to {}", senderEmail, receiverEmail);
        return dto;
    }

    private DirectMessageDto toDto(DirectMessage dm) {
        return new DirectMessageDto(
                dm.getId(),
                dm.getSender().getEmail(),
                dm.getSender().getFirstName(),
                dm.getSender().getLastName(),
                dm.getSender().getAvatarUrl(),
                dm.getReceiver().getEmail(),
                dm.getContent(),
                dm.getCreatedAt(),
                dm.getReadAt()
        );
    }
}
