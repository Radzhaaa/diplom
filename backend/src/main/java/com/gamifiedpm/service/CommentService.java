package com.gamifiedpm.service;

import com.gamifiedpm.dto.request.CreateCommentRequest;
import com.gamifiedpm.dto.response.CommentDto;
import com.gamifiedpm.model.entity.Comment;
import com.gamifiedpm.model.entity.Task;
import com.gamifiedpm.model.entity.User;
import com.gamifiedpm.repository.CommentRepository;
import com.gamifiedpm.repository.TaskRepository;
import com.gamifiedpm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommentService {

    private final CommentRepository commentRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final GamificationActionService gamificationActionService;
    private final WebSocketEventService webSocketEventService;

    @Transactional(readOnly = true)
    public List<CommentDto> getTaskComments(Long taskId) {
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new RuntimeException("Task not found"));
        
        List<Comment> topLevelComments = commentRepository.findByTaskAndParentCommentIsNullOrderByCreatedAtAsc(task);
        
        return topLevelComments.stream()
            .map(CommentDto::fromEntity)
            .collect(Collectors.toList());
    }

    @Transactional
    public CommentDto createComment(CreateCommentRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        Task task = taskRepository.findById(request.getTaskId())
            .orElseThrow(() -> new RuntimeException("Task not found"));
        
        Comment parentComment = null;
        if (request.getParentCommentId() != null) {
            parentComment = commentRepository.findById(request.getParentCommentId())
                .orElse(null);
        }
        
        Comment comment = Comment.builder()
            .task(task)
            .author(user)
            .content(request.getContent())
            .parentComment(parentComment)
            .build();
        
        comment = commentRepository.save(comment);
        gamificationActionService.onCommentAdded(user);
        Set<User> participants = new HashSet<>();
        if (task.getCreatedBy() != null) participants.add(task.getCreatedBy());
        if (task.getAssignedTo() != null) participants.add(task.getAssignedTo());
        if (task.getCoExecutors() != null) participants.addAll(task.getCoExecutors());
        if (task.getObservers() != null) participants.addAll(task.getObservers());

        Set<Long> notifiedForMention = new HashSet<>();
        List<User> mentioned = parseMentionedUsers(request.getContent(), participants);
        for (User mentionedUser : mentioned) {
            if (mentionedUser.getId().equals(user.getId())) continue;
            if (notifiedForMention.add(mentionedUser.getId())) {
                notificationService.createNotification(
                    mentionedUser,
                    com.gamifiedpm.model.entity.Notification.NotificationType.MENTION,
                    "Вас упомянули в задаче",
                    String.format("%s %s упомянул(а) вас в комментарии к задаче «%s»",
                        user.getFirstName(), user.getLastName(), task.getTitle()),
                    task.getId(),
                    "TASK"
                );
            }
        }

        if (task.getAssignedTo() != null
            && !task.getAssignedTo().getId().equals(user.getId())
            && !notifiedForMention.contains(task.getAssignedTo().getId())) {
            notificationService.createNotification(
                task.getAssignedTo(),
                com.gamifiedpm.model.entity.Notification.NotificationType.COMMENT_ADDED,
                "Новый комментарий",
                String.format("%s оставил комментарий к задаче: %s",
                    user.getFirstName() + " " + user.getLastName(),
                    task.getTitle()),
                task.getId(),
                "TASK"
            );
        }
        
        log.info("Comment created: {} for task: {}", comment.getId(), task.getId());
        webSocketEventService.notifyCommentAdded(task.getId(), CommentDto.fromEntity(comment));
        return CommentDto.fromEntity(comment);
    }

    @Transactional
    public void deleteComment(Long commentId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        Comment comment = commentRepository.findById(commentId)
            .orElseThrow(() -> new RuntimeException("Comment not found"));
        
        if (!comment.getAuthor().getId().equals(user.getId()) &&
            user.getRole() != com.gamifiedpm.model.entity.User.Role.ADMIN) {
            throw new com.gamifiedpm.exception.AccessDeniedException("Access denied");
        }
        
        commentRepository.delete(comment);
        log.info("Comment deleted: {} by user: {}", commentId, userEmail);
    }

    private List<User> parseMentionedUsers(String content, Set<User> participants) {
        if (content == null || participants == null || participants.isEmpty()) {
            return List.of();
        }
        List<User> result = new ArrayList<>();
        Pattern pattern = Pattern.compile("@([^\\s@]+(?:\\s+[^\\s@]+)*)");
        Matcher matcher = pattern.matcher(content);
        while (matcher.find()) {
            String mention = matcher.group(1).trim();
            if (mention.isEmpty()) continue;
            for (User p : participants) {
                String fullName = (p.getFirstName() != null ? p.getFirstName() : "") + " "
                    + (p.getLastName() != null ? p.getLastName() : "");
                fullName = fullName.trim();
                boolean match = fullName.equalsIgnoreCase(mention)
                    || (p.getEmail() != null && p.getEmail().equalsIgnoreCase(mention));
                if (match && result.stream().noneMatch(u -> u.getId().equals(p.getId()))) {
                    result.add(p);
                    break;
                }
            }
        }
        return result;
    }
}
