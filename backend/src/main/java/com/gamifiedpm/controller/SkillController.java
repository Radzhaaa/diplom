package com.gamifiedpm.controller;

import com.gamifiedpm.dto.response.SkillDto;
import com.gamifiedpm.service.SkillService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/skills")
@RequiredArgsConstructor
public class SkillController {

    private final SkillService skillService;

    @GetMapping
    public ResponseEntity<List<SkillDto>> getUserSkills(Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(skillService.getUserSkills(userEmail));
    }

    @PostMapping
    public ResponseEntity<?> addSkill(@RequestBody Map<String, String> body, Authentication authentication) {
        String name = body.get("name");
        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Название обязательно"));
        }
        return ResponseEntity.ok(skillService.addSkill(name.trim()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSkill(@PathVariable Long id, Authentication authentication) {
        skillService.deleteSkill(id);
        return ResponseEntity.noContent().build();
    }
}
