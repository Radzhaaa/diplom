package com.gamifiedpm.controller;

import com.gamifiedpm.dto.request.AiChatRequest;
import com.gamifiedpm.dto.response.AiChatResponse;
import com.gamifiedpm.dto.response.EngagementDto;
import com.gamifiedpm.dto.response.RiskItemDto;
import com.gamifiedpm.dto.response.SuggestedMilestoneDto;
import com.gamifiedpm.model.entity.AiConversation;
import com.gamifiedpm.service.AiAgentService;
import com.gamifiedpm.service.MotivatorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiAgentController {

    private final AiAgentService aiAgentService;
    private final MotivatorService motivatorService;

    @PostMapping("/chat")
    public ResponseEntity<AiChatResponse> chat(
            @Valid @RequestBody AiChatRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(aiAgentService.chat(request, userEmail));
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<AiConversation>> getConversations(Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(aiAgentService.getUserConversations(userEmail));
    }

    @GetMapping("/roadmap/{projectId}")
    public ResponseEntity<List<SuggestedMilestoneDto>> suggestRoadmap(
            @PathVariable Long projectId,
            @RequestParam(required = false) String description,
            Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(aiAgentService.suggestRoadmap(projectId, description, userEmail));
    }

    @GetMapping("/engagement")
    public ResponseEntity<EngagementDto> getEngagement(Authentication authentication) {
        return ResponseEntity.ok(motivatorService.getEngagementMetrics(authentication.getName()));
    }

    @PostMapping("/motivator")
    public ResponseEntity<AiChatResponse> motivatorChat(
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        String message = body.getOrDefault("message", "");
        return ResponseEntity.ok(motivatorService.generateMotivatorMessage(authentication.getName(), message));
    }

    @GetMapping("/risk-forecast/{projectId}")
    public ResponseEntity<List<RiskItemDto>> getRiskForecast(
            @PathVariable Long projectId,
            Authentication authentication) {
        return ResponseEntity.ok(aiAgentService.getRiskForecast(projectId, authentication.getName()));
    }

    @PostMapping("/suggest-deadline")
    public ResponseEntity<Map<String, String>> suggestDeadline(
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        String title = body.getOrDefault("title", "");
        String description = body.getOrDefault("description", "");
        String priority = body.getOrDefault("priority", "MEDIUM");
        String suggestedDate = aiAgentService.suggestDeadline(title, description, priority);
        return ResponseEntity.ok(Map.of("deadline", suggestedDate));
    }
}
