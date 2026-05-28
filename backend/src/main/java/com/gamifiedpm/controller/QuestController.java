package com.gamifiedpm.controller;

import com.gamifiedpm.dto.request.CreateQuestRequest;
import com.gamifiedpm.dto.response.QuestDto;
import com.gamifiedpm.service.AiAgentService;
import com.gamifiedpm.service.QuestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/quests")
@RequiredArgsConstructor
public class QuestController {

    private final QuestService questService;
    private final AiAgentService aiAgentService;

    @GetMapping
    public ResponseEntity<List<QuestDto>> getUserQuests(Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(questService.getUserQuests(userEmail));
    }


    @PostMapping("/admin")
    public ResponseEntity<QuestDto> createAdminQuest(
            @RequestBody CreateQuestRequest req,
            Authentication authentication) {
        return ResponseEntity.ok(questService.createAdminQuest(req, authentication.getName()));
    }

    @DeleteMapping("/admin/{id}")
    public ResponseEntity<Void> deleteAdminQuest(
            @PathVariable Long id,
            Authentication authentication) {
        questService.deleteQuest(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/admin")
    public ResponseEntity<List<QuestService.AdminQuestEntry>> getAdminQuests(
            Authentication authentication) {
        return ResponseEntity.ok(questService.getAllQuestsForAdmin(authentication.getName()));
    }

    @GetMapping("/admin/user/{userId}")
    public ResponseEntity<List<QuestDto>> getUserQuestsForAdmin(
            @PathVariable Long userId,
            Authentication authentication) {
        return ResponseEntity.ok(questService.getUserQuestsForAdmin(userId, authentication.getName()));
    }

    @PostMapping("/admin/generate")
    public ResponseEntity<CreateQuestRequest> generateQuestWithAi(
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        String prompt = body.getOrDefault("prompt", "");
        return ResponseEntity.ok(aiAgentService.generateQuestSuggestion(prompt, authentication.getName()));
    }
}
