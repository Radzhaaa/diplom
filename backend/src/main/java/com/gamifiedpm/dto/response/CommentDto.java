package com.gamifiedpm.dto.response;

import com.gamifiedpm.model.entity.Comment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentDto {
    private Long id;
    private Long taskId;
    private String content;
    private UserDto author;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long parentCommentId;
    private List<CommentDto> replies;
    
    public static CommentDto fromEntity(Comment comment) {
        CommentDto dto = CommentDto.builder()
            .id(comment.getId())
            .taskId(comment.getTask().getId())
            .content(comment.getContent())
            .author(UserDto.fromEntity(comment.getAuthor()))
            .createdAt(comment.getCreatedAt())
            .updatedAt(comment.getUpdatedAt())
            .parentCommentId(comment.getParentComment() != null ? comment.getParentComment().getId() : null)
            .build();
        
        if (comment.getReplies() != null && !comment.getReplies().isEmpty()) {
            dto.setReplies(comment.getReplies().stream()
                .map(CommentDto::fromEntity)
                .collect(Collectors.toList()));
        }
        
        return dto;
    }
}
