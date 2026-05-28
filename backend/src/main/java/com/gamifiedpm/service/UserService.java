package com.gamifiedpm.service;

import com.gamifiedpm.dto.response.UserDto;
import com.gamifiedpm.model.entity.User;
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
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    
    @Value("${app.file.upload-dir:./uploads}")
    private String uploadDir;

    @Transactional
    public UserDto uploadAvatar(MultipartFile file, String userEmail) throws IOException {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (!file.getContentType().startsWith("image/")) {
            throw new IllegalArgumentException("File must be an image");
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("File size must not exceed 5MB");
        }
        Path avatarDir = Paths.get(uploadDir, "avatars");
        if (!Files.exists(avatarDir)) {
            Files.createDirectories(avatarDir);
        }
        String originalFileName = file.getOriginalFilename();
        String fileExtension = originalFileName != null && originalFileName.contains(".")
            ? originalFileName.substring(originalFileName.lastIndexOf("."))
            : ".jpg";
        String uniqueFileName = UUID.randomUUID().toString() + fileExtension;
        Path filePath = avatarDir.resolve(uniqueFileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        if (user.getAvatarUrl() != null && !user.getAvatarUrl().isEmpty()) {
            try {
                Path oldAvatarPath = Paths.get(user.getAvatarUrl());
                if (Files.exists(oldAvatarPath)) {
                    Files.delete(oldAvatarPath);
                }
            } catch (Exception e) {
                log.warn("Failed to delete old avatar: {}", e.getMessage());
            }
        }
        String avatarUrl = "/uploads/avatars/" + uniqueFileName;
        user.setAvatarUrl(avatarUrl);
        user = userRepository.save(user);
        
        log.info("Avatar uploaded for user: {}", userEmail);
        return UserDto.fromEntity(user);
    }
}
