package com.gamifiedpm.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateCommentRequest {
    
    @NotNull(message = "ID задачи обязателен")
    private Long taskId;
    
    @NotBlank(message = "Текст комментария обязателен")
    @Size(min = 1, max = 2000, message = "Комментарий должен содержать от 1 до 2000 символов")
    private String content;
    
    private Long parentCommentId;
}
