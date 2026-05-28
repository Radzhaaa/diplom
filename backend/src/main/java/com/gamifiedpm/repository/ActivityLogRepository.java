package com.gamifiedpm.repository;

import com.gamifiedpm.model.entity.ActivityLog;
import com.gamifiedpm.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    List<ActivityLog> findByUserOrderByCreatedAtDesc(User user);
    List<ActivityLog> findByUserAndCreatedAtBetween(User user, LocalDateTime start, LocalDateTime end);

    @Query("SELECT a FROM ActivityLog a WHERE a.user = :user AND a.activityType = 'XP_EARNED' " +
           "AND a.createdAt >= :start AND a.createdAt <= :end ORDER BY a.createdAt ASC")
    List<ActivityLog> findXpEventsByUserAndPeriod(User user, LocalDateTime start, LocalDateTime end);
}
