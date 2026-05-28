package com.gamifiedpm.controller;

import com.gamifiedpm.service.ExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/projects/{projectId}/export")
@RequiredArgsConstructor
public class ExportController {

    private final ExportService exportService;

    @GetMapping(params = "format=excel")
    public ResponseEntity<byte[]> exportExcel(@PathVariable Long projectId) throws Exception {
        byte[] data = exportService.exportExcel(projectId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"project-" + projectId + ".xlsx\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }

    @GetMapping(params = "format=pdf")
    public ResponseEntity<byte[]> exportPdf(@PathVariable Long projectId) throws Exception {
        byte[] data = exportService.exportPdf(projectId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"project-" + projectId + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(data);
    }
}
