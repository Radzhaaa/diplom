package com.gamifiedpm.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SuggestedMilestoneDto {

    private String title;
    private String description;
    private String dueDate;
    private Integer order;
}
