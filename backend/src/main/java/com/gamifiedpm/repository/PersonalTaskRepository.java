package com.gamifiedpm.repository;

import com.gamifiedpm.model.entity.PersonalTask;
import com.gamifiedpm.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PersonalTaskRepository extends JpaRepository<PersonalTask, Long> {
    List<PersonalTask> findByUserOrderByCreatedAtDesc(User user);
    List<PersonalTask> findByUserAndStatusOrderByCreatedAtDesc(User user, PersonalTask.Status status);
}
