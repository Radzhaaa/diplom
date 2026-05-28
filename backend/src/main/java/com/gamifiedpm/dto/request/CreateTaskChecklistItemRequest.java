package com.gamifiedpm.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateTaskChecklistItemRequest {
    @NotBlank(message = "Текст пункта обязателен")
    @Size(max = 1000)
    private String title;
    private Integer sortOrder;
}
