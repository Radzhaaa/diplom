package com.gamifiedpm.repository;

import com.gamifiedpm.model.entity.FileAttachment;
import com.gamifiedpm.model.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FileAttachmentRepository extends JpaRepository<FileAttachment, Long> {
    List<FileAttachment> findByTaskOrderByUploadedAtDesc(Task task);
}
