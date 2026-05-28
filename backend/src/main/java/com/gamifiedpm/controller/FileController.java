package com.gamifiedpm.controller;

import com.gamifiedpm.dto.response.FileAttachmentDto;
import com.gamifiedpm.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    @GetMapping("/tasks/{taskId}")
    public ResponseEntity<List<FileAttachmentDto>> getTaskFiles(@PathVariable Long taskId) {
        return ResponseEntity.ok(fileService.getTaskFiles(taskId));
    }

    @PostMapping("/tasks/{taskId}")
    public ResponseEntity<FileAttachmentDto> uploadFile(
            @PathVariable Long taskId,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) throws IOException {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(fileService.uploadFile(taskId, file, userEmail));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFile(@PathVariable Long id, Authentication authentication) throws IOException {
        String userEmail = authentication.getName();
        fileService.deleteFile(id, userEmail);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long id) throws IOException {
        return fileService.downloadFile(id);
    }
}
