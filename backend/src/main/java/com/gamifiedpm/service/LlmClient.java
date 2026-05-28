package com.gamifiedpm.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class LlmClient {

    @Value("${app.ai.api-key:}")
    private String apiKey;

    @Value("${app.ai.model:gpt-3.5-turbo}")
    private String model;

    @Value("${app.ai.base-url:https://api.openai.com/v1}")
    private String baseUrl;

    @Value("${app.ai.enabled:false}")
    private boolean aiEnabled;

    private final RestClient restClient;

    public LlmClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10_000);  // 10 сек на подключение
        factory.setReadTimeout(120_000);
        this.restClient = RestClient.builder().requestFactory(factory).build();
    }

    public String chat(String systemPrompt, List<Map<String, String>> messages) {
        if (!aiEnabled) {
            return null;
        }

        try {
            List<Map<String, String>> fullMessages = new java.util.ArrayList<>();
            fullMessages.add(Map.of("role", "system", "content", systemPrompt));
            fullMessages.addAll(messages);

            Map<String, Object> requestBody = Map.of(
                "model", model,
                "messages", fullMessages,
                "max_tokens", 1000,
                "temperature", 0.7
            );

            var requestSpec = restClient.post()
                .uri(baseUrl + "/chat/completions")
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);

            if (apiKey != null && !apiKey.isBlank()) {
                requestSpec = requestSpec.header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey);
            }

            Map<?, ?> response = requestSpec
                .body(requestBody)
                .retrieve()
                .body(Map.class);

            if (response != null) {
                List<?> choices = (List<?>) response.get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map<?, ?> choice = (Map<?, ?>) choices.get(0);
                    Map<?, ?> msg = (Map<?, ?>) choice.get("message");
                    if (msg != null) {
                        return (String) msg.get("content");
                    }
                }
            }
        } catch (Exception e) {
            log.error("LLM API call failed: {}", e.getMessage());
        }
        return null;
    }
}
