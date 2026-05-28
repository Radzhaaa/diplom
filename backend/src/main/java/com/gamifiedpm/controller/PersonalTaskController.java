package com.gamifiedpm.controller;

import com.gamifiedpm.dto.request.CreatePersonalTaskRequest;
import com.gamifiedpm.dto.response.PersonalTaskDto;
import com.gamifiedpm.model.entity.PersonalTask;
import com.gamifiedpm.model.entity.User;
import com.gamifiedpm.repository.PersonalTaskRepository;
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
@RequestMapping("/api/personal-tasks")
@RequiredArgsConstructor
public class PersonalTaskController {

    private final PersonalTaskRepository personalTaskRepository;
    private final UserRepository userRepository;

    private User getUser(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @GetMapping
    public ResponseEntity<List<PersonalTaskDto>> getAll(Authentication auth) {
        User user = getUser(auth);
        List<PersonalTaskDto> tasks = personalTaskRepository.findByUserOrderByCreatedAtDesc(user)
                .stream().map(PersonalTaskDto::fromEntity).collect(Collectors.toList());
        return ResponseEntity.ok(tasks);
    }

    @PostMapping
    public ResponseEntity<PersonalTaskDto> create(@Valid @RequestBody CreatePersonalTaskRequest req, Authentication auth) {
        User user = getUser(auth);
        PersonalTask task = PersonalTask.builder()
                .user(user)
                .title(req.getTitle())
                .description(req.getDescription())
                .priority(req.getPriority() != null ? req.getPriority() : PersonalTask.Priority.MEDIUM)
                .status(req.getStatus() != null ? req.getStatus() : PersonalTask.Status.NEW)
                .deadline(req.getDeadline())
                .build();
        return ResponseEntity.ok(PersonalTaskDto.fromEntity(personalTaskRepository.save(task)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PersonalTaskDto> update(@PathVariable Long id, @Valid @RequestBody CreatePersonalTaskRequest req, Authentication auth) {
        User user = getUser(auth);
        PersonalTask task = personalTaskRepository.findById(id)
                .filter(t -> t.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new RuntimeException("Not found"));
        if (req.getTitle() != null) task.setTitle(req.getTitle());
        if (req.getDescription() != null) task.setDescription(req.getDescription());
        if (req.getPriority() != null) task.setPriority(req.getPriority());
        if (req.getStatus() != null) task.setStatus(req.getStatus());
        if (req.getDeadline() != null) task.setDeadline(req.getDeadline());
        return ResponseEntity.ok(PersonalTaskDto.fromEntity(personalTaskRepository.save(task)));
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<PersonalTaskDto> complete(@PathVariable Long id, Authentication auth) {
        User user = getUser(auth);
        PersonalTask task = personalTaskRepository.findById(id)
                .filter(t -> t.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new RuntimeException("Not found"));
        task.setStatus(PersonalTask.Status.DONE);
        task.setCompletedAt(LocalDateTime.now());
        return ResponseEntity.ok(PersonalTaskDto.fromEntity(personalTaskRepository.save(task)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        User user = getUser(auth);
        PersonalTask task = personalTaskRepository.findById(id)
                .filter(t -> t.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new RuntimeException("Not found"));
        personalTaskRepository.delete(task);
        return ResponseEntity.noContent().build();
    }
}
