package com.gamifiedpm.controller;

import com.gamifiedpm.dto.request.CreateCommentRequest;
import com.gamifiedpm.dto.response.CommentDto;
import com.gamifiedpm.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @GetMapping("/tasks/{taskId}")
    public ResponseEntity<List<CommentDto>> getTaskComments(@PathVariable Long taskId) {
        return ResponseEntity.ok(commentService.getTaskComments(taskId));
    }

    @PostMapping
    public ResponseEntity<CommentDto> createComment(
            @Valid @RequestBody CreateCommentRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(commentService.createComment(request, userEmail));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long id, Authentication authentication) {
        String userEmail = authentication.getName();
        commentService.deleteComment(id, userEmail);
        return ResponseEntity.noContent().build();
    }
}
