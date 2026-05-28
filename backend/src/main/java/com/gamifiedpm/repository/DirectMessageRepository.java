package com.gamifiedpm.repository;

import com.gamifiedpm.model.entity.DirectMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DirectMessageRepository extends JpaRepository<DirectMessage, Long> {

    @Query("""
        SELECT dm FROM DirectMessage dm
        WHERE (dm.sender.email = :myEmail AND dm.receiver.email = :otherEmail)
           OR (dm.sender.email = :otherEmail AND dm.receiver.email = :myEmail)
        ORDER BY dm.createdAt DESC
        """)
    Page<DirectMessage> findConversation(
            @Param("myEmail") String myEmail,
            @Param("otherEmail") String otherEmail,
            Pageable pageable);

    @Query(value = """
        SELECT partner_email, partner_first_name, partner_last_name, partner_avatar,
               content, created_at, unread_count
        FROM (
            SELECT
               CASE WHEN s.email = :userEmail THEN r.email ELSE s.email END AS partner_email,
               CASE WHEN s.email = :userEmail THEN r.first_name ELSE s.first_name END AS partner_first_name,
               CASE WHEN s.email = :userEmail THEN r.last_name ELSE s.last_name END AS partner_last_name,
               CASE WHEN s.email = :userEmail THEN r.avatar_url ELSE s.avatar_url END AS partner_avatar,
               dm.content,
               dm.created_at,
               ROW_NUMBER() OVER (
                   PARTITION BY CASE WHEN s.email = :userEmail THEN r.email ELSE s.email END
                   ORDER BY dm.created_at DESC
               ) AS rn,
               SUM(CASE WHEN dm.receiver_id = (SELECT id FROM users WHERE email = :userEmail)
                             AND dm.read_at IS NULL THEN 1 ELSE 0 END)
                   OVER (PARTITION BY CASE WHEN s.email = :userEmail THEN r.email ELSE s.email END) AS unread_count
            FROM direct_messages dm
            JOIN users s ON s.id = dm.sender_id
            JOIN users r ON r.id = dm.receiver_id
            WHERE s.email = :userEmail OR r.email = :userEmail
        ) sub
        WHERE rn = 1
        ORDER BY created_at DESC
        """,
        nativeQuery = true)
    List<Object[]> findConversationSummaries(@Param("userEmail") String userEmail);

}
