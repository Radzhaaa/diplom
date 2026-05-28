package com.gamifiedpm.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTaskChecklistItemRequest {
    @Size(max = 1000)
    private String title;
    private Boolean completed;
    private Integer sortOrder;
}
