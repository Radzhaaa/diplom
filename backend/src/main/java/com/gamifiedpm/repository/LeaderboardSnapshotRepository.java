package com.gamifiedpm.repository;

import com.gamifiedpm.model.entity.LeaderboardSnapshot;
import com.gamifiedpm.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface LeaderboardSnapshotRepository extends JpaRepository<LeaderboardSnapshot, Long> {

    Optional<LeaderboardSnapshot> findTopByUserOrderBySnapshotDateDesc(User user);

    @Query("SELECT s FROM LeaderboardSnapshot s WHERE s.snapshotDate = :date ORDER BY s.rankPosition ASC")
    List<LeaderboardSnapshot> findBySnapshotDate(LocalDate date);

    boolean existsBySnapshotDate(LocalDate date);
}
