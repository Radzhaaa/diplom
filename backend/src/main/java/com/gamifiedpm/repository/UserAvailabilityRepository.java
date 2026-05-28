package com.gamifiedpm.repository;

import com.gamifiedpm.model.entity.User;
import com.gamifiedpm.model.entity.UserAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface UserAvailabilityRepository extends JpaRepository<UserAvailability, Long> {

    List<UserAvailability> findByUserAndDateBetween(User user, LocalDate start, LocalDate end);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM UserAvailability ua WHERE ua.user = :user AND ua.date BETWEEN :start AND :end")
    void deleteByUserAndDateBetween(@Param("user") User user,
                                    @Param("start") LocalDate start,
                                    @Param("end") LocalDate end);

    @Query("SELECT ua FROM UserAvailability ua WHERE ua.user IN :users AND ua.date BETWEEN :start AND :end ORDER BY ua.date, ua.hour")
    List<UserAvailability> findByUsersAndDateBetween(
        @Param("users") List<User> users,
        @Param("start") LocalDate start,
        @Param("end") LocalDate end
    );
}
