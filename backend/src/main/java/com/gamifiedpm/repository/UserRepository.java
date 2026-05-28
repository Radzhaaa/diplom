package com.gamifiedpm.repository;

import com.gamifiedpm.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<User> findByEmailVerificationToken(String token);
    Optional<User> findByPasswordResetToken(String token);
    
    @Query("SELECT u FROM User u ORDER BY u.totalXp DESC")
    List<User> findAllOrderByTotalXpDesc();
    
    @Query("SELECT u FROM User u WHERE u.level >= :minLevel ORDER BY u.totalXp DESC")
    List<User> findTopUsersByLevel(int minLevel);

    @Modifying
    @Query("UPDATE User u SET u.emailVerificationToken = :token, u.emailVerificationTokenExpiresAt = :expiresAt WHERE u.id = :id")
    void updateEmailVerificationToken(Long id, String token, LocalDateTime expiresAt);
}




