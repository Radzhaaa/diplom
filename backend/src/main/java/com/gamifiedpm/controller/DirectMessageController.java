package com.gamifiedpm.controller;

import com.gamifiedpm.dto.response.DirectMessageDto;
import com.gamifiedpm.dto.response.DmConversationDto;
import com.gamifiedpm.service.DirectMessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dm")
@RequiredArgsConstructor
public class DirectMessageController {

    private final DirectMessageService directMessageService;

    @GetMapping("/conversations")
    public ResponseEntity<List<DmConversationDto>> getConversations(Authentication auth) {
        return ResponseEntity.ok(directMessageService.getConversations(auth.getName()));
    }

    @GetMapping("/messages/{email}")
    public ResponseEntity<Page<DirectMessageDto>> getMessages(
            @PathVariable String email,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size,
            Authentication auth) {
        return ResponseEntity.ok(directMessageService.getMessages(auth.getName(), email, page, size));
    }

    @PostMapping("/messages")
    public ResponseEntity<DirectMessageDto> sendMessage(
            @RequestBody Map<String, String> body,
            Authentication auth) {
        String receiverEmail = body.get("receiverEmail");
        String content = body.get("content");
        if (receiverEmail == null || receiverEmail.isBlank() || content == null || content.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(directMessageService.sendMessage(auth.getName(), receiverEmail, content));
    }
}
