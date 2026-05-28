package com.gamifiedpm.controller;

import com.gamifiedpm.dto.response.ChatMessageDto;
import com.gamifiedpm.dto.response.PageResponse;
import com.gamifiedpm.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Chat", description = "Сообщения проектных чатов")
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @GetMapping("/{projectId}/messages")
    public ResponseEntity<PageResponse<ChatMessageDto>> getMessages(
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size,
            Authentication authentication) {
        String userEmail = authentication.getName();
        Page<ChatMessageDto> result = chatService.getMessages(projectId, userEmail, page, size);
        return ResponseEntity.ok(PageResponse.of(result));
    }

    @PostMapping("/{projectId}/messages")
    public ResponseEntity<ChatMessageDto> sendMessage(
            @PathVariable Long projectId,
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        String userEmail = authentication.getName();
        String content = body.get("content");
        return ResponseEntity.ok(chatService.sendMessage(projectId, userEmail, content));
    }
}
