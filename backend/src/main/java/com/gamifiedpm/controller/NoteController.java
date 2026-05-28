package com.gamifiedpm.controller;

import com.gamifiedpm.dto.request.CreateNoteRequest;
import com.gamifiedpm.dto.response.NoteDto;
import com.gamifiedpm.model.entity.Note;
import com.gamifiedpm.model.entity.User;
import com.gamifiedpm.repository.NoteRepository;
import com.gamifiedpm.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteRepository noteRepository;
    private final UserRepository userRepository;

    private User getUser(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @GetMapping
    public ResponseEntity<List<NoteDto>> getAll(Authentication auth) {
        User user = getUser(auth);
        List<NoteDto> notes = noteRepository.findByUserOrderByPinnedDescUpdatedAtDesc(user)
                .stream().map(NoteDto::fromEntity).collect(Collectors.toList());
        return ResponseEntity.ok(notes);
    }

    @PostMapping
    public ResponseEntity<NoteDto> create(@Valid @RequestBody CreateNoteRequest req, Authentication auth) {
        User user = getUser(auth);
        Note note = Note.builder()
                .user(user)
                .title(req.getTitle() != null ? req.getTitle() : "Новая заметка")
                .content(req.getContent() != null ? req.getContent() : "")
                .color(req.getColor() != null ? req.getColor() : "#6366f1")
                .pinned(req.getPinned() != null && req.getPinned())
                .deadline(req.getDeadline() != null && !req.getDeadline().isBlank()
                        ? LocalDateTime.parse(req.getDeadline() + "T00:00:00") : null)
                .build();
        return ResponseEntity.ok(NoteDto.fromEntity(noteRepository.save(note)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<NoteDto> update(@PathVariable Long id, @Valid @RequestBody CreateNoteRequest req, Authentication auth) {
        User user = getUser(auth);
        Note note = noteRepository.findById(id)
                .filter(n -> n.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new RuntimeException("Not found"));
        if (req.getTitle() != null) note.setTitle(req.getTitle());
        if (req.getContent() != null) note.setContent(req.getContent());
        if (req.getColor() != null) note.setColor(req.getColor());
        if (req.getPinned() != null) note.setPinned(req.getPinned());
        if (req.getDeadline() != null) {
            note.setDeadline(req.getDeadline().isBlank() ? null : LocalDateTime.parse(req.getDeadline() + "T00:00:00"));
        }
        return ResponseEntity.ok(NoteDto.fromEntity(noteRepository.save(note)));
    }

    @PatchMapping("/{id}/pin")
    public ResponseEntity<NoteDto> togglePin(@PathVariable Long id, Authentication auth) {
        User user = getUser(auth);
        Note note = noteRepository.findById(id)
                .filter(n -> n.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new RuntimeException("Not found"));
        note.setPinned(!note.isPinned());
        return ResponseEntity.ok(NoteDto.fromEntity(noteRepository.save(note)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        User user = getUser(auth);
        Note note = noteRepository.findById(id)
                .filter(n -> n.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new RuntimeException("Not found"));
        noteRepository.delete(note);
        return ResponseEntity.noContent().build();
    }
}
