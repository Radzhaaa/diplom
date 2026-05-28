package com.gamifiedpm.controller;

import com.gamifiedpm.dto.response.LeaderboardEntryDto;
import com.gamifiedpm.dto.response.PageResponse;
import com.gamifiedpm.dto.response.ProjectCompetitionEntry;
import com.gamifiedpm.service.LeaderboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Leaderboard", description = "Таблица лидеров и геймификация")
@RestController
@RequestMapping("/api/leaderboard")
@RequiredArgsConstructor
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    @GetMapping
    public ResponseEntity<?> getLeaderboard(
            @RequestParam(defaultValue = "50") int limit,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "0") int size) {
        List<LeaderboardEntryDto> all = leaderboardService.getLeaderboard(size > 0 ? Integer.MAX_VALUE : limit);
        if (size > 0) {
            int from = page * size;
            int to = Math.min(from + size, all.size());
            List<LeaderboardEntryDto> slice = (from < all.size()) ? all.subList(from, to) : List.of();
            Page<LeaderboardEntryDto> paged = new PageImpl<>(slice, PageRequest.of(page, size), all.size());
            return ResponseEntity.ok(PageResponse.of(paged));
        }
        return ResponseEntity.ok(all);
    }

    @GetMapping("/my-rank")
    public ResponseEntity<Integer> getMyRank(Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(leaderboardService.getUserRank(userEmail));
    }

    @GetMapping("/projects")
    public ResponseEntity<List<ProjectCompetitionEntry>> getProjectCompetition() {
        return ResponseEntity.ok(leaderboardService.getProjectCompetition());
    }
}
