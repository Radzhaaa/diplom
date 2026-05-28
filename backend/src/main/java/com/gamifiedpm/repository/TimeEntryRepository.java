package com.gamifiedpm.repository;

import com.gamifiedpm.model.entity.Task;
import com.gamifiedpm.model.entity.TimeEntry;
import com.gamifiedpm.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TimeEntryRepository extends JpaRepository<TimeEntry, Long> {

    List<TimeEntry> findByTaskOrderByStartTimeDesc(Task task);

    Optional<TimeEntry> findByTaskAndUserAndEndTimeIsNull(Task task, User user);

    Optional<TimeEntry> findByUserAndEndTimeIsNull(User user);

    @Query("SELECT COALESCE(SUM(te.durationMinutes), 0) FROM TimeEntry te " +
           "WHERE te.task = :task AND te.durationMinutes IS NOT NULL")
    Integer sumDurationByTask(@Param("task") Task task);
}
