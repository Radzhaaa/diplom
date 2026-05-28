package com.gamifiedpm.dto.response;

import java.util.List;

public record ImportResultDto(
    int imported,
    int skipped,
    List<RowError> errors
) {
    public record RowError(int row, String message) {}
}
