package com.gamifiedpm.service;

import com.gamifiedpm.dto.response.ChatMessageDto;
import com.gamifiedpm.exception.AccessDeniedException;
import com.gamifiedpm.exception.ResourceNotFoundException;
import com.gamifiedpm.model.entity.ChatMessage;
import com.gamifiedpm.model.entity.Project;
import com.gamifiedpm.model.entity.User;
import com.gamifiedpm.repository.ChatMessageRepository;
import com.gamifiedpm.repository.ProjectMemberRepository;
import com.gamifiedpm.repository.ProjectRepository;
import com.gamifiedpm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final WebSocketEventService webSocketEventService;

    public Page<ChatMessageDto> getMessages(Long projectId, String userEmail, int page, int size) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        boolean isMember = projectMemberRepository.existsByProjectAndUser(project, user)
                || project.getCreatedBy().getId().equals(user.getId());
        if (!isMember) {
            throw new AccessDeniedException("Not a member of this project");
        }

        PageRequest pageable = PageRequest.of(page, size);
        return chatMessageRepository.findByProjectIdOrderByCreatedAtDesc(projectId, pageable)
                .map(this::toDto);
    }

    @Transactional
    public ChatMessageDto sendMessage(Long projectId, String userEmail, String content) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        boolean isMember = projectMemberRepository.existsByProjectAndUser(project, user)
                || project.getCreatedBy().getId().equals(user.getId());
        if (!isMember) {
            throw new AccessDeniedException("Not a member of this project");
        }

        ChatMessage message = ChatMessage.builder()
                .project(project)
                .sender(user)
                .content(content)
                .build();
        message = chatMessageRepository.save(message);

        ChatMessageDto dto = toDto(message);
        webSocketEventService.notifyChatMessage(projectId, dto);
        log.debug("Chat message sent in project {} by {}", projectId, userEmail);
        return dto;
    }

    private ChatMessageDto toDto(ChatMessage msg) {
        User sender = msg.getSender();
        return new ChatMessageDto(
                msg.getId(),
                msg.getProject().getId(),
                sender.getEmail(),
                sender.getFirstName(),
                sender.getLastName(),
                sender.getAvatarUrl(),
                msg.getContent(),
                msg.getCreatedAt()
        );
    }
}
