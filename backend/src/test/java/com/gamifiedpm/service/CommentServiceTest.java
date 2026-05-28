package com.gamifiedpm.service;

import com.gamifiedpm.dto.request.CreateCommentRequest;
import com.gamifiedpm.dto.response.CommentDto;
import com.gamifiedpm.exception.AccessDeniedException;
import com.gamifiedpm.model.entity.Comment;
import com.gamifiedpm.model.entity.Task;
import com.gamifiedpm.model.entity.User;
import com.gamifiedpm.repository.CommentRepository;
import com.gamifiedpm.repository.TaskRepository;
import com.gamifiedpm.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CommentServiceTest {

    @Mock private CommentRepository commentRepository;
    @Mock private TaskRepository taskRepository;
    @Mock private UserRepository userRepository;
    @Mock private NotificationService notificationService;
    @Mock private GamificationActionService gamificationActionService;
    @Mock private WebSocketEventService webSocketEventService;

    @InjectMocks private CommentService commentService;

    private User author;
    private Task task;

    @BeforeEach
    void setUp() {
        author = User.builder()
                .id(1L).email("author@test.com")
                .firstName("Alice").lastName("Smith")
                .role(User.Role.TEAM_MEMBER)
                .build();

        task = Task.builder()
                .id(100L).title("Fix bug")
                .status(Task.TaskStatus.IN_PROGRESS)
                .createdBy(author)
                .coExecutors(new HashSet<>())
                .observers(new HashSet<>())
                .build();
    }


    @Test
    void getTaskComments_returnsList_whenTaskExists() {
        Comment comment = Comment.builder()
                .id(1L).task(task).author(author).content("Looks good")
                .build();

        given(taskRepository.findById(100L)).willReturn(Optional.of(task));
        given(commentRepository.findByTaskAndParentCommentIsNullOrderByCreatedAtAsc(task))
                .willReturn(List.of(comment));

        List<CommentDto> result = commentService.getTaskComments(100L);

        assertThat(result).hasSize(1);
    }

    @Test
    void getTaskComments_throwsRuntime_whenTaskNotFound() {
        given(taskRepository.findById(999L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> commentService.getTaskComments(999L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Task not found");
    }


    @Test
    void createComment_savesAndBroadcasts() {
        CreateCommentRequest req = new CreateCommentRequest();
        req.setTaskId(100L);
        req.setContent("LGTM");

        Comment saved = Comment.builder()
                .id(2L).task(task).author(author).content("LGTM")
                .build();

        given(userRepository.findByEmail("author@test.com")).willReturn(Optional.of(author));
        given(taskRepository.findById(100L)).willReturn(Optional.of(task));
        given(commentRepository.save(any(Comment.class))).willReturn(saved);

        CommentDto result = commentService.createComment(req, "author@test.com");

        assertThat(result).isNotNull();
        verify(gamificationActionService).onCommentAdded(author);
        verify(webSocketEventService).notifyCommentAdded(eq(100L), any(CommentDto.class));
    }

    @Test
    void createComment_notifiesMentionedUser() {
        User mentioned = User.builder().id(2L).email("bob@test.com")
                .firstName("Bob").lastName("Jones").role(User.Role.TEAM_MEMBER).build();
        task.setAssignedTo(mentioned);

        CreateCommentRequest req = new CreateCommentRequest();
        req.setTaskId(100L);
        req.setContent("Hey @Bob Jones please check this");

        Comment saved = Comment.builder()
                .id(3L).task(task).author(author).content("Hey @Bob Jones please check this")
                .build();

        given(userRepository.findByEmail("author@test.com")).willReturn(Optional.of(author));
        given(taskRepository.findById(100L)).willReturn(Optional.of(task));
        given(commentRepository.save(any(Comment.class))).willReturn(saved);

        commentService.createComment(req, "author@test.com");

        verify(notificationService, atLeastOnce()).createNotification(
                eq(mentioned), any(), any(), any(), any(), any());
    }

    @Test
    void createComment_throwsRuntime_whenUserNotFound() {
        CreateCommentRequest req = new CreateCommentRequest();
        req.setTaskId(100L);
        req.setContent("test");

        given(userRepository.findByEmail("ghost@test.com")).willReturn(Optional.empty());

        assertThatThrownBy(() -> commentService.createComment(req, "ghost@test.com"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found");
    }


    @Test
    void deleteComment_deletesSuccessfully_whenAuthor() {
        Comment comment = Comment.builder()
                .id(5L).task(task).author(author).content("old")
                .build();

        given(userRepository.findByEmail("author@test.com")).willReturn(Optional.of(author));
        given(commentRepository.findById(5L)).willReturn(Optional.of(comment));

        commentService.deleteComment(5L, "author@test.com");

        verify(commentRepository).delete(comment);
    }

    @Test
    void deleteComment_throwsAccessDenied_whenNotAuthorOrAdmin() {
        User other = User.builder().id(99L).email("other@test.com")
                .firstName("X").lastName("Y").role(User.Role.TEAM_MEMBER).build();
        Comment comment = Comment.builder()
                .id(5L).task(task).author(author).content("old")
                .build();

        given(userRepository.findByEmail("other@test.com")).willReturn(Optional.of(other));
        given(commentRepository.findById(5L)).willReturn(Optional.of(comment));

        assertThatThrownBy(() -> commentService.deleteComment(5L, "other@test.com"))
                .isInstanceOf(AccessDeniedException.class);

        verify(commentRepository, never()).delete(any());
    }

    @Test
    void deleteComment_allowsAdmin_toDeleteAnyComment() {
        User admin = User.builder().id(99L).email("admin@test.com")
                .firstName("X").lastName("Y").role(User.Role.ADMIN).build();
        Comment comment = Comment.builder()
                .id(5L).task(task).author(author).content("old")
                .build();

        given(userRepository.findByEmail("admin@test.com")).willReturn(Optional.of(admin));
        given(commentRepository.findById(5L)).willReturn(Optional.of(comment));

        commentService.deleteComment(5L, "admin@test.com");

        verify(commentRepository).delete(comment);
    }
}