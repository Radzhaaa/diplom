package com.gamifiedpm.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gamifiedpm.dto.request.CreateMeetingRequest;
import com.gamifiedpm.dto.request.CreateTaskRequest;
import com.gamifiedpm.dto.request.UpdateAvailabilityRequest;
import com.gamifiedpm.dto.response.MeetingDto;
import com.gamifiedpm.dto.response.TaskDto;
import com.gamifiedpm.dto.response.UserDto;
import com.gamifiedpm.exception.ResourceNotFoundException;
import com.gamifiedpm.model.entity.Meeting;
import com.gamifiedpm.model.entity.Project;
import com.gamifiedpm.model.entity.Task;
import com.gamifiedpm.model.entity.User;
import com.gamifiedpm.model.entity.UserAvailability;
import com.gamifiedpm.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MeetingService {

    private final MeetingRepository meetingRepository;
    private final UserAvailabilityRepository availabilityRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final LlmClient llmClient;
    private final TaskService taskService;
    private final ObjectMapper objectMapper;


    @Transactional(readOnly = true)
    public List<MeetingDto> getProjectMeetings(Long projectId, String userEmail) {
        Project project = getProject(projectId);
        return meetingRepository.findByProjectOrderByDateTimeAsc(project).stream()
            .map(MeetingDto::fromEntity)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MeetingDto> getMyMeetings(String userEmail) {
        User user = getUser(userEmail);
        return meetingRepository.findUpcomingUserMeetings(user, LocalDateTime.now().minusHours(1)).stream()
            .map(MeetingDto::fromEntity)
            .collect(Collectors.toList());
    }

    @Transactional
    public MeetingDto createMeeting(CreateMeetingRequest req, String organizerEmail) {
        User organizer = getUser(organizerEmail);

        Project project = null;
        if (req.getProjectId() != null) {
            project = getProject(req.getProjectId());
        }

        List<User> participants = new ArrayList<>();
        if (req.getParticipantIds() != null && !req.getParticipantIds().isEmpty()) {
            participants = userRepository.findAllById(req.getParticipantIds());
        }

        String jitsiLink = "https://meet.jit.si/xproject-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);

        Meeting meeting = Meeting.builder()
            .title(req.getTitle())
            .description(req.getDescription())
            .project(project)
            .organizer(organizer)
            .dateTime(req.getDateTime())
            .durationMinutes(req.getDurationMinutes() > 0 ? req.getDurationMinutes() : 60)
            .jitsiLink(jitsiLink)
            .participants(participants)
            .build();

        Meeting saved = meetingRepository.save(meeting);

        String projectName = project != null ? project.getName() : "";
        String msgBody = String.format("Вас пригласили на встречу «%s»%s%s",
            saved.getTitle(),
            projectName.isEmpty() ? "" : " (проект: " + projectName + ")",
            " — " + saved.getDateTime().toString().replace("T", " ").substring(0, 16));

        for (User p : participants) {
            if (!p.getId().equals(organizer.getId())) {
                notificationService.createNotification(
                    p,
                    com.gamifiedpm.model.entity.Notification.NotificationType.MEETING_INVITE,
                    "Новая встреча",
                    msgBody,
                    saved.getId(),
                    "MEETING"
                );
            }
        }

        return MeetingDto.fromEntity(saved);
    }

    @Transactional
    public MeetingDto cancelMeeting(Long meetingId, String userEmail) {
        Meeting meeting = meetingRepository.findById(meetingId)
            .orElseThrow(() -> new ResourceNotFoundException("Meeting not found"));
        User user = getUser(userEmail);
        if (!meeting.getOrganizer().getId().equals(user.getId())) {
            throw new com.gamifiedpm.exception.AccessDeniedException("Only organizer can cancel the meeting");
        }
        meeting.setStatus(Meeting.MeetingStatus.CANCELLED);
        return MeetingDto.fromEntity(meetingRepository.save(meeting));
    }

    @Transactional
    public MeetingDto completeMeeting(Long meetingId, String userEmail) {
        Meeting meeting = meetingRepository.findById(meetingId)
            .orElseThrow(() -> new ResourceNotFoundException("Meeting not found"));
        meeting.setStatus(Meeting.MeetingStatus.COMPLETED);
        return MeetingDto.fromEntity(meetingRepository.save(meeting));
    }

    @Transactional
    public void deleteMeeting(Long meetingId, String userEmail) {
        Meeting meeting = meetingRepository.findById(meetingId)
            .orElseThrow(() -> new ResourceNotFoundException("Meeting not found"));
        User user = getUser(userEmail);
        if (!meeting.getOrganizer().getId().equals(user.getId())) {
            throw new com.gamifiedpm.exception.AccessDeniedException("Only organizer can delete the meeting");
        }
        meetingRepository.delete(meeting);
    }


    @Transactional(readOnly = true)
    public Map<String, List<Integer>> getMyAvailability(String userEmail, LocalDate weekStart) {
        User user = getUser(userEmail);
        LocalDate weekEnd = weekStart.plusDays(6);
        List<UserAvailability> slots = availabilityRepository.findByUserAndDateBetween(user, weekStart, weekEnd);

        Map<String, List<Integer>> result = new LinkedHashMap<>();
        for (int d = 0; d < 7; d++) {
            result.put(weekStart.plusDays(d).toString(), new ArrayList<>());
        }
        for (UserAvailability ua : slots) {
            result.computeIfAbsent(ua.getDate().toString(), k -> new ArrayList<>()).add(ua.getHour());
        }
        result.values().forEach(Collections::sort);
        return result;
    }

    @Transactional
    public void saveMyAvailability(UpdateAvailabilityRequest req, String userEmail) {
        if (req.getAvailability() == null || req.getAvailability().isEmpty()) return;

        User user = getUser(userEmail);

        List<LocalDate> dates = req.getAvailability().keySet().stream()
            .map(LocalDate::parse)
            .sorted()
            .collect(Collectors.toList());

        LocalDate minDate = dates.get(0);
        LocalDate maxDate = dates.get(dates.size() - 1);

        availabilityRepository.deleteByUserAndDateBetween(user, minDate, maxDate);

        List<UserAvailability> newSlots = new ArrayList<>();
        for (Map.Entry<String, List<Integer>> entry : req.getAvailability().entrySet()) {
            if (entry.getKey() == null || entry.getValue() == null) continue;
            LocalDate date;
            try { date = LocalDate.parse(entry.getKey()); } catch (Exception e) { continue; }
            for (Integer hour : entry.getValue()) {
                if (hour != null && hour >= 0 && hour <= 23) {
                    newSlots.add(UserAvailability.builder()
                        .user(user)
                        .date(date)
                        .hour(hour)
                        .build());
                }
            }
        }
        availabilityRepository.saveAll(newSlots);
    }

    @Transactional(readOnly = true)
    public Map<String, Map<Integer, Integer>> getProjectHeatmap(Long projectId, LocalDate weekStart) {
        Project project = getProject(projectId);
        List<User> members = projectMemberRepository.findByProjectOrderByJoinedAtAsc(project).stream()
            .map(pm -> pm.getUser())
            .collect(Collectors.toList());

        if (members.isEmpty()) return Collections.emptyMap();

        LocalDate weekEnd = weekStart.plusDays(6);
        List<UserAvailability> slots = availabilityRepository.findByUsersAndDateBetween(members, weekStart, weekEnd);

        Map<String, Map<Integer, Integer>> heatmap = new LinkedHashMap<>();
        for (int d = 0; d < 7; d++) {
            heatmap.put(weekStart.plusDays(d).toString(), new HashMap<>());
        }
        for (UserAvailability ua : slots) {
            heatmap.computeIfAbsent(ua.getDate().toString(), k -> new HashMap<>())
                .merge(ua.getHour(), 1, Integer::sum);
        }
        return heatmap;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> suggestMeetingSlots(Long projectId, LocalDate weekStart, int durationMinutes) {
        Project project = getProject(projectId);
        int memberCount = projectMemberRepository.findByProjectOrderByJoinedAtAsc(project).size();

        Map<String, Map<Integer, Integer>> heatmap = getProjectHeatmap(projectId, weekStart);

        int blocks = Math.max(1, durationMinutes / 60);

        record Slot(LocalDate date, int hour, int count) {}
        List<Slot> candidates = new ArrayList<>();

        for (Map.Entry<String, Map<Integer, Integer>> dayEntry : heatmap.entrySet()) {
            LocalDate date = LocalDate.parse(dayEntry.getKey());
            Map<Integer, Integer> hourMap = dayEntry.getValue();

            for (int h = 8; h <= 20 - blocks; h++) {
                int minCount = Integer.MAX_VALUE;
                for (int b = 0; b < blocks; b++) {
                    minCount = Math.min(minCount, hourMap.getOrDefault(h + b, 0));
                }
                if (minCount > 0) {
                    candidates.add(new Slot(date, h, minCount));
                }
            }
        }

        candidates.sort(Comparator
            .comparingInt(Slot::count).reversed()
            .thenComparing(Slot::date)
            .thenComparingInt(Slot::hour));

        return candidates.stream().limit(5).map(s -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("dateTime", s.date().atTime(s.hour(), 0).toString());
            m.put("availableCount", s.count());
            m.put("totalMembers", memberCount);
            return m;
        }).collect(Collectors.toList());
    }


    @Transactional
    public List<TaskDto> generateTasksFromMeeting(Long meetingId, String userEmail) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting not found: " + meetingId));

        if (meeting.getProject() == null) {
            throw new IllegalStateException("Meeting has no associated project");
        }

        String systemPrompt = """
                You are a project management assistant. Given a meeting title and description, \
                extract 3-5 concrete action items as tasks. \
                Return ONLY a JSON array of objects with fields: "title" (string, max 100 chars) \
                and "description" (string, max 300 chars). No extra text outside the JSON array.""";

        String userPrompt = "Meeting: " + meeting.getTitle() +
                (meeting.getDescription() != null ? "\nDescription: " + meeting.getDescription() : "");

        List<Map<String, String>> messages = List.of(Map.of("role", "user", "content", userPrompt));
        String llmResponse = llmClient.chat(systemPrompt, messages);

        List<TaskDto> created = new ArrayList<>();
        try {
            String json = llmResponse.trim();
            int start = json.indexOf('[');
            int end = json.lastIndexOf(']');
            if (start >= 0 && end > start) {
                json = json.substring(start, end + 1);
            }
            List<Map<String, String>> items = objectMapper.readValue(json,
                    new TypeReference<List<Map<String, String>>>() {});

            for (Map<String, String> item : items) {
                String title = item.getOrDefault("title", "");
                if (title.isBlank()) continue;
                CreateTaskRequest req = new CreateTaskRequest();
                req.setProjectId(meeting.getProject().getId());
                req.setTitle(title.length() > 200 ? title.substring(0, 200) : title);
                req.setDescription(item.getOrDefault("description", "Создано AI по итогам встречи: " + meeting.getTitle()));
                req.setPriority(Task.Priority.MEDIUM);
                created.add(taskService.createTask(req, userEmail));
            }
        } catch (Exception e) {
            log.error("Failed to parse AI response for meeting tasks: {}", e.getMessage());
            CreateTaskRequest req = new CreateTaskRequest();
            req.setProjectId(meeting.getProject().getId());
            req.setTitle("Action items: " + meeting.getTitle());
            req.setDescription("Подведение итогов встречи. Разберите и назначьте задачи вручную.");
            req.setPriority(Task.Priority.MEDIUM);
            created.add(taskService.createTask(req, userEmail));
        }
        return created;
    }


    private User getUser(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private Project getProject(Long id) {
        return projectRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + id));
    }
}
