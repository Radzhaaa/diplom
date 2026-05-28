package com.gamifiedpm.service;

import com.gamifiedpm.dto.response.ChatMessageDto;
import com.gamifiedpm.dto.response.DirectMessageDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventService {

    private final SimpMessagingTemplate messagingTemplate;

    public void notifyTaskUpdated(Long projectId, Long taskId, String action) {
        Map<String, Object> payload = Map.of(
            "type", "TASK_" + action,
            "taskId", taskId,
            "projectId", projectId
        );
        messagingTemplate.convertAndSend("/topic/tasks/" + projectId, payload);
        log.debug("WS task event sent: {} taskId={} projectId={}", action, taskId, projectId);
    }

    public void notifyCommentAdded(Long taskId, Object commentDto) {
        Map<String, Object> payload = Map.of(
            "type", "COMMENT_ADDED",
            "taskId", taskId,
            "comment", commentDto
        );
        messagingTemplate.convertAndSend("/topic/comments/" + taskId, payload);
        log.debug("WS comment event sent: taskId={}", taskId);
    }

    public void notifyUser(String userEmail, String type, Object data) {
        Map<String, Object> payload = Map.of("type", type, "data", data);
        messagingTemplate.convertAndSend("/topic/notifications/" + encodeEmail(userEmail), payload);
        log.debug("WS user notification sent: type={} email={}", type, userEmail);
    }

    public void notifyLeaderboardUpdated() {
        messagingTemplate.convertAndSend("/topic/leaderboard", Map.of("type", "LEADERBOARD_UPDATED"));
        log.debug("WS leaderboard update sent");
    }

    public void notifyChatMessage(Long projectId, ChatMessageDto msg) {
        messagingTemplate.convertAndSend("/topic/chat/" + projectId, msg);
        log.debug("WS chat message sent: projectId={}", projectId);
    }

    public void notifyDirectMessage(String receiverEmail, DirectMessageDto dto) {
        messagingTemplate.convertAndSend("/topic/dm/" + encodeEmail(receiverEmail), dto);
        log.debug("WS DM sent to: {}", receiverEmail);
    }

    private String encodeEmail(String email) {
        return email.replace("@", "_at_").replace(".", "_");
    }
}
