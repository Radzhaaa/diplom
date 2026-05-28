package com.gamifiedpm.service;

import com.gamifiedpm.model.entity.LeaderboardSnapshot;
import com.gamifiedpm.model.entity.User;
import com.gamifiedpm.repository.LeaderboardSnapshotRepository;
import com.gamifiedpm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class LeaderboardSnapshotJob {

    private final UserRepository userRepository;
    private final LeaderboardSnapshotRepository snapshotRepository;

    @Scheduled(cron = "0 5 0 * * *")
    @Transactional
    public void takeSnapshot() {
        LocalDate today = LocalDate.now();
        if (snapshotRepository.existsBySnapshotDate(today)) {
            log.debug("Leaderboard snapshot for {} already exists, skipping", today);
            return;
        }
        List<User> users = userRepository.findAllOrderByTotalXpDesc();
        for (int i = 0; i < users.size(); i++) {
            User user = users.get(i);
            snapshotRepository.save(LeaderboardSnapshot.builder()
                .user(user)
                .snapshotDate(today)
                .rankPosition(i + 1)
                .totalXp(user.getTotalXp())
                .build());
        }
        log.info("Leaderboard snapshot taken for {}: {} users", today, users.size());
    }
}
