package com.gamifiedpm.service;

import com.gamifiedpm.dto.response.FileAttachmentDto;
import com.gamifiedpm.model.entity.FileAttachment;
import com.gamifiedpm.model.entity.Task;
import com.gamifiedpm.model.entity.User;
import com.gamifiedpm.repository.FileAttachmentRepository;
import com.gamifiedpm.repository.TaskRepository;
import com.gamifiedpm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FileService {

    private final FileAttachmentRepository fileAttachmentRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    
    @Value("${app.file.upload-dir:./uploads}")
    private String uploadDir;

    private static final Map<String, Set<String>> ALLOWED_TYPES = Map.ofEntries(
        Map.entry(".jpg",  Set.of("image/jpeg")),
        Map.entry(".jpeg", Set.of("image/jpeg")),
        Map.entry(".png",  Set.of("image/png")),
        Map.entry(".gif",  Set.of("image/gif")),
        Map.entry(".webp", Set.of("image/webp")),
        Map.entry(".svg",  Set.of("image/svg+xml")),
        Map.entry(".pdf",  Set.of("application/pdf")),
        Map.entry(".doc",  Set.of("application/msword")),
        Map.entry(".docx", Set.of("application/vnd.openxmlformats-officedocument.wordprocessingml.document")),
        Map.entry(".xls",  Set.of("application/vnd.ms-excel")),
        Map.entry(".xlsx", Set.of("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")),
        Map.entry(".ppt",  Set.of("application/vnd.ms-powerpoint")),
        Map.entry(".pptx", Set.of("application/vnd.openxmlformats-officedocument.presentationml.presentation")),
        Map.entry(".txt",  Set.of("text/plain")),
        Map.entry(".csv",  Set.of("text/csv", "text/plain", "application/csv")),
        Map.entry(".zip",  Set.of("application/zip", "application/x-zip-compressed")),
        Map.entry(".7z",   Set.of("application/x-7z-compressed")),
        Map.entry(".mp4",  Set.of("video/mp4")),
        Map.entry(".mp3",  Set.of("audio/mpeg"))
    );

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Файл пустой");
        }
        String originalName = file.getOriginalFilename();
        if (originalName == null || !originalName.contains(".")) {
            throw new IllegalArgumentException("Файл должен иметь расширение");
        }
        String ext = originalName.substring(originalName.lastIndexOf(".")).toLowerCase();
        Set<String> allowedMimes = ALLOWED_TYPES.get(ext);
        if (allowedMimes == null) {
            throw new IllegalArgumentException("Тип файла не разрешён: " + ext + ". Допустимые: " + ALLOWED_TYPES.keySet());
        }
        String contentType = file.getContentType();
        if (contentType == null || !allowedMimes.contains(contentType.toLowerCase().split(";")[0].trim())) {
            throw new IllegalArgumentException("MIME-тип файла не соответствует расширению: " + contentType);
        }
    }

    @Transactional(readOnly = true)
    public List<FileAttachmentDto> getTaskFiles(Long taskId) {
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new RuntimeException("Task not found"));
        
        return fileAttachmentRepository.findByTaskOrderByUploadedAtDesc(task)
            .stream()
            .map(FileAttachmentDto::fromEntity)
            .collect(Collectors.toList());
    }

    @Transactional
    public FileAttachmentDto uploadFile(Long taskId, MultipartFile file, String userEmail) throws IOException {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new RuntimeException("Task not found"));

        validateFile(file);

        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        
        String originalFileName = file.getOriginalFilename();
        String fileExtension = originalFileName != null && originalFileName.contains(".") 
            ? originalFileName.substring(originalFileName.lastIndexOf(".")) 
            : "";
        String uniqueFileName = UUID.randomUUID().toString() + fileExtension;
        Path filePath = uploadPath.resolve(uniqueFileName);
        
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        
        FileAttachment fileAttachment = FileAttachment.builder()
            .task(task)
            .fileName(originalFileName)
            .filePath(filePath.toString())
            .fileType(file.getContentType())
            .fileSize(file.getSize())
            .uploadedBy(user)
            .uploadedAt(LocalDateTime.now())
            .build();
        
        fileAttachment = fileAttachmentRepository.save(fileAttachment);
        
        log.info("File uploaded: {} for task: {}", fileAttachment.getId(), taskId);
        return FileAttachmentDto.fromEntity(fileAttachment);
    }

    @Transactional
    public void deleteFile(Long fileId, String userEmail) throws IOException {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        FileAttachment fileAttachment = fileAttachmentRepository.findById(fileId)
            .orElseThrow(() -> new RuntimeException("File not found"));
        
        if (!fileAttachment.getUploadedBy().getId().equals(user.getId()) && 
            user.getRole() != com.gamifiedpm.model.entity.User.Role.ADMIN) {
            throw new com.gamifiedpm.exception.AccessDeniedException("Access denied");
        }
        
        Path filePath = resolveAndValidatePath(fileAttachment.getFilePath());
        if (Files.exists(filePath)) {
            Files.delete(filePath);
        }
        
        fileAttachmentRepository.delete(fileAttachment);
        log.info("File deleted: {} by user: {}", fileId, userEmail);
    }

    private Path resolveAndValidatePath(String storedPath) {
        Path base = Paths.get(uploadDir).toAbsolutePath().normalize();
        Path target = Paths.get(storedPath).toAbsolutePath().normalize();
        if (!target.startsWith(base)) {
            throw new SecurityException("Access denied: file path outside upload directory");
        }
        return target;
    }

    @Transactional(readOnly = true)
    public org.springframework.http.ResponseEntity<org.springframework.core.io.Resource> downloadFile(Long fileId) throws IOException {
        FileAttachment fileAttachment = fileAttachmentRepository.findById(fileId)
            .orElseThrow(() -> new RuntimeException("File not found"));

        Path filePath = resolveAndValidatePath(fileAttachment.getFilePath());

        if (!java.nio.file.Files.exists(filePath)) {
            throw new com.gamifiedpm.exception.ResourceNotFoundException("File not found on disk");
        }
        
        org.springframework.core.io.Resource resource = new org.springframework.core.io.UrlResource(filePath.toUri());
        
        if (!resource.exists() || !resource.isReadable()) {
            throw new com.gamifiedpm.exception.ResourceNotFoundException("File is not readable");
        }
        
        String contentType = fileAttachment.getFileType();
        if (contentType == null) {
            contentType = "application/octet-stream";
        }
        
        return org.springframework.http.ResponseEntity.ok()
            .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
            .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, 
                "attachment; filename=\"" + fileAttachment.getFileName() + "\"")
            .body(resource);
    }
}
