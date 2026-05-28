package com.gamifiedpm.dto.response;

import com.gamifiedpm.model.entity.FileAttachment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileAttachmentDto {
    private Long id;
    private Long taskId;
    private String fileName;
    private String filePath;
    private String fileType;
    private Long fileSize;
    private UserDto uploadedBy;
    private LocalDateTime uploadedAt;
    
    public static FileAttachmentDto fromEntity(FileAttachment file) {
        return FileAttachmentDto.builder()
            .id(file.getId())
            .taskId(file.getTask().getId())
            .fileName(file.getFileName())
            .filePath(file.getFilePath())
            .fileType(file.getFileType())
            .fileSize(file.getFileSize())
            .uploadedBy(UserDto.fromEntity(file.getUploadedBy()))
            .uploadedAt(file.getUploadedAt())
            .build();
    }
}
