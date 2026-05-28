package com.gamifiedpm.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiChatResponse {
    private String message;
    private Long conversationId;
    private List<String> suggestions;
    private List<AiAction> actions;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class AiAction {
    private String type;
    private String label;
    private Map<String, Object> params;
}
