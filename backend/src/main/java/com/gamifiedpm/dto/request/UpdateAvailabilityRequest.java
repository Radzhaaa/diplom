package com.gamifiedpm.dto.request;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class UpdateAvailabilityRequest {
    private Map<String, List<Integer>> availability;
}
