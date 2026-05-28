package com.gamifiedpm.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AiChatRequest {
    
    @NotBlank(message = "Сообщение обязательно")
    private String message;
    
    private String contextType;
    private Long contextId;
    private Long conversationId;
}
