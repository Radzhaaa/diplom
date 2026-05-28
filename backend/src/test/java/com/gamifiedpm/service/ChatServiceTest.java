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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    @Mock private ChatMessageRepository chatMessageRepository;
    @Mock private ProjectRepository projectRepository;
    @Mock private UserRepository userRepository;
    @Mock private ProjectMemberRepository projectMemberRepository;
    @Mock private WebSocketEventService webSocketEventService;

    @InjectMocks private ChatService chatService;

    private User user;
    private Project project;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(1L).email("user@test.com")
                .firstName("Alice").lastName("Smith")
                .role(User.Role.TEAM_MEMBER)
                .build();

        project = Project.builder()
                .id(10L).name("Test Project")
                .createdBy(user)
                .status(Project.ProjectStatus.ACTIVE)
                .build();
    }


    @Test
    void getMessages_returnsPage_whenUserIsOwner() {
        ChatMessage msg = ChatMessage.builder()
                .id(1L).project(project).sender(user).content("Hello")
                .build();

        given(projectRepository.findById(10L)).willReturn(Optional.of(project));
        given(userRepository.findByEmail("user@test.com")).willReturn(Optional.of(user));
        given(projectMemberRepository.existsByProjectAndUser(project, user)).willReturn(false);
        given(chatMessageRepository.findByProjectIdOrderByCreatedAtDesc(eq(10L), any(PageRequest.class)))
                .willReturn(new PageImpl<>(List.of(msg)));

        Page<ChatMessageDto> result = chatService.getMessages(10L, "user@test.com", 0, 20);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).content()).isEqualTo("Hello");
    }

    @Test
    void getMessages_returnsPage_whenUserIsMember() {
        User member = User.builder().id(2L).email("member@test.com")
                .firstName("Bob").lastName("Jones").role(User.Role.TEAM_MEMBER).build();

        given(projectRepository.findById(10L)).willReturn(Optional.of(project));
        given(userRepository.findByEmail("member@test.com")).willReturn(Optional.of(member));
        given(projectMemberRepository.existsByProjectAndUser(project, member)).willReturn(true);
        given(chatMessageRepository.findByProjectIdOrderByCreatedAtDesc(eq(10L), any(PageRequest.class)))
                .willReturn(Page.empty());

        Page<ChatMessageDto> result = chatService.getMessages(10L, "member@test.com", 0, 20);

        assertThat(result).isNotNull();
    }

    @Test
    void getMessages_throwsAccessDenied_whenNotMember() {
        User outsider = User.builder().id(99L).email("out@test.com")
                .firstName("X").lastName("Y").role(User.Role.TEAM_MEMBER).build();

        given(projectRepository.findById(10L)).willReturn(Optional.of(project));
        given(userRepository.findByEmail("out@test.com")).willReturn(Optional.of(outsider));
        given(projectMemberRepository.existsByProjectAndUser(project, outsider)).willReturn(false);

        assertThatThrownBy(() -> chatService.getMessages(10L, "out@test.com", 0, 20))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void getMessages_throwsNotFound_whenProjectMissing() {
        given(projectRepository.findById(999L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> chatService.getMessages(999L, "user@test.com", 0, 20))
                .isInstanceOf(ResourceNotFoundException.class);
    }


    @Test
    void sendMessage_savesAndBroadcasts_whenMember() {
        ChatMessage saved = ChatMessage.builder()
                .id(5L).project(project).sender(user).content("Hi!")
                .build();

        given(projectRepository.findById(10L)).willReturn(Optional.of(project));
        given(userRepository.findByEmail("user@test.com")).willReturn(Optional.of(user));
        given(projectMemberRepository.existsByProjectAndUser(project, user)).willReturn(false);
        given(chatMessageRepository.save(any(ChatMessage.class))).willReturn(saved);

        ChatMessageDto dto = chatService.sendMessage(10L, "user@test.com", "Hi!");

        assertThat(dto.content()).isEqualTo("Hi!");
        assertThat(dto.senderEmail()).isEqualTo("user@test.com");
        verify(webSocketEventService).notifyChatMessage(eq(10L), any(ChatMessageDto.class));
    }

    @Test
    void sendMessage_throwsAccessDenied_whenNotMember() {
        User outsider = User.builder().id(99L).email("out@test.com")
                .firstName("X").lastName("Y").role(User.Role.TEAM_MEMBER).build();

        given(projectRepository.findById(10L)).willReturn(Optional.of(project));
        given(userRepository.findByEmail("out@test.com")).willReturn(Optional.of(outsider));
        given(projectMemberRepository.existsByProjectAndUser(project, outsider)).willReturn(false);

        assertThatThrownBy(() -> chatService.sendMessage(10L, "out@test.com", "Hi!"))
                .isInstanceOf(AccessDeniedException.class);

        verify(chatMessageRepository, never()).save(any());
    }
}