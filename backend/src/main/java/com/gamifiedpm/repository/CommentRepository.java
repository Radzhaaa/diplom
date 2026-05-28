package com.gamifiedpm.repository;

import com.gamifiedpm.model.entity.Comment;
import com.gamifiedpm.model.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByTaskOrderByCreatedAtAsc(Task task);
    List<Comment> findByTaskAndParentCommentIsNullOrderByCreatedAtAsc(Task task);
    List<Comment> findByParentCommentId(Long parentCommentId);
}
