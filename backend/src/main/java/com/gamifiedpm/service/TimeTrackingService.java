package com.gamifiedpm.service;

import com.gamifiedpm.dto.request.LogTimeRequest;
import com.gamifiedpm.dto.response.TimeEntryDto;
import com.gamifiedpm.exception.ResourceNotFoundException;
import com.gamifiedpm.model.entity.Task;
import com.gamifiedpm.model.entity.TimeEntry;
import com.gamifiedpm.model.entity.User;
import com.gamifiedpm.repository.TaskRepository;
import com.gamifiedpm.repository.TimeEntryRepository;
import com.gamifiedpm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TimeTrackingService {

    private final TimeEntryRepository timeEntryRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    @Transactional
    public TimeEntryDto startTimer(Long taskId, String userEmail) {
        User user = getUser(userEmail);
        Task task = getTask(taskId);

        return timeEntryRepository
            .findByTaskAndUserAndEndTimeIsNull(task, user)
            .map(TimeEntryDto::fromEntity)
            .orElseGet(() -> {
                timeEntryRepository.findByUserAndEndTimeIsNull(user)
                    .ifPresent(active -> stopEntry(active, null));

                TimeEntry entry = TimeEntry.builder()
                    .task(task)
                    .user(user)
                    .startTime(LocalDateTime.now())
                    .build();
                TimeEntry saved = timeEntryRepository.save(entry);
                log.info("Timer started: user={} task={}", userEmail, taskId);
                return TimeEntryDto.fromEntity(saved);
            });
    }

    @Transactional
    public TimeEntryDto stopTimer(Long taskId, String userEmail, String note) {
        User user = getUser(userEmail);
        Task task = getTask(taskId);

        TimeEntry active = timeEntryRepository
            .findByTaskAndUserAndEndTimeIsNull(task, user)
            .orElseThrow(() -> new IllegalStateException("Активный таймер для этой задачи не найден"));

        stopEntry(active, note);
        log.info("Timer stopped: user={} task={} minutes={}", userEmail, taskId, active.getDurationMinutes());
        return TimeEntryDto.fromEntity(active);
    }

    @Transactional
    public TimeEntryDto logTime(Long taskId, String userEmail, LogTimeRequest request) {
        User user = getUser(userEmail);
        Task task = getTask(taskId);

        LocalDateTime end = LocalDateTime.now();
        LocalDateTime start = end.minusMinutes(request.getDurationMinutes());

        TimeEntry entry = TimeEntry.builder()
            .task(task)
            .user(user)
            .startTime(start)
            .endTime(end)
            .durationMinutes(request.getDurationMinutes())
            .note(request.getNote())
            .build();

        TimeEntry saved = timeEntryRepository.save(entry);
        log.info("Time logged manually: user={} task={} minutes={}", userEmail, taskId, request.getDurationMinutes());
        return TimeEntryDto.fromEntity(saved);
    }

    @Transactional
    public void deleteEntry(Long entryId, String userEmail) {
        User user = getUser(userEmail);
        TimeEntry entry = timeEntryRepository.findById(entryId)
            .orElseThrow(() -> new ResourceNotFoundException("Time entry not found"));
        if (!entry.getUser().getId().equals(user.getId())) {
            throw new IllegalStateException("Access denied");
        }
        timeEntryRepository.delete(entry);
    }

    @Transactional(readOnly = true)
    public List<TimeEntryDto> getTaskEntries(Long taskId) {
        Task task = getTask(taskId);
        return timeEntryRepository.findByTaskOrderByStartTimeDesc(task)
            .stream().map(TimeEntryDto::fromEntity).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TimeEntryDto getActiveTimer(Long taskId, String userEmail) {
        User user = getUser(userEmail);
        Task task = getTask(taskId);
        return timeEntryRepository.findByTaskAndUserAndEndTimeIsNull(task, user)
            .map(TimeEntryDto::fromEntity)
            .orElse(null);
    }

    @Transactional(readOnly = true)
    public TimeEntryDto getGlobalActiveTimer(String userEmail) {
        User user = getUser(userEmail);
        return timeEntryRepository.findByUserAndEndTimeIsNull(user)
            .map(TimeEntryDto::fromEntity)
            .orElse(null);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getTaskTotalTime(Long taskId) {
        Task task = getTask(taskId);
        int totalMinutes = timeEntryRepository.sumDurationByTask(task);
        return Map.of(
            "taskId", taskId,
            "totalMinutes", totalMinutes,
            "totalHours", totalMinutes / 60,
            "remainingMinutes", totalMinutes % 60
        );
    }

    private void stopEntry(TimeEntry entry, String note) {
        LocalDateTime now = LocalDateTime.now();
        long minutes = ChronoUnit.MINUTES.between(entry.getStartTime(), now);
        entry.setEndTime(now);
        entry.setDurationMinutes((int) Math.max(1, minutes));
        if (note != null && !note.isBlank()) {
            entry.setNote(note);
        }
        timeEntryRepository.save(entry);
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private Task getTask(Long taskId) {
        return taskRepository.findById(taskId)
            .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    }
}
