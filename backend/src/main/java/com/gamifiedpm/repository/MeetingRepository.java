package com.gamifiedpm.repository;

import com.gamifiedpm.model.entity.Meeting;
import com.gamifiedpm.model.entity.Project;
import com.gamifiedpm.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface MeetingRepository extends JpaRepository<Meeting, Long> {

    List<Meeting> findByProjectOrderByDateTimeAsc(Project project);

    @Query("SELECT m FROM Meeting m WHERE m.organizer = :user OR :user MEMBER OF m.participants ORDER BY m.dateTime ASC")
    List<Meeting> findUserMeetings(@Param("user") User user);

    @Query("SELECT m FROM Meeting m WHERE (m.organizer = :user OR :user MEMBER OF m.participants) AND m.dateTime >= :from ORDER BY m.dateTime ASC")
    List<Meeting> findUpcomingUserMeetings(@Param("user") User user, @Param("from") LocalDateTime from);
}
