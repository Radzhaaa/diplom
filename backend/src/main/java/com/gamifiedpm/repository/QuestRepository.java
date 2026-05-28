package com.gamifiedpm.repository;

import com.gamifiedpm.model.entity.Quest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface QuestRepository extends JpaRepository<Quest, Long> {
    // endDate > date: квест активен только пока его endDate ещё не наступил
    @Query("SELECT q FROM Quest q WHERE q.status = 'ACTIVE' AND q.startDate <= :date AND q.endDate > :date")
    List<Quest> findActiveQuests(LocalDate date);

    @Query("SELECT q FROM Quest q WHERE q.status = 'ACTIVE' AND q.conditionType = :conditionType AND q.startDate <= :date AND q.endDate > :date")
    List<Quest> findActiveQuestsByCondition(String conditionType, LocalDate date);

    @Query("SELECT q FROM Quest q WHERE q.status = 'ACTIVE' AND q.endDate <= :date")
    List<Quest> findActiveQuestsWithExpiredEndDate(LocalDate date);

    boolean existsByTypeAndStartDate(Quest.QuestType type, LocalDate startDate);

    @Query("SELECT q FROM Quest q WHERE q.status = 'EXPIRED' AND q.endDate < :cutoff")
    List<Quest> findExpiredQuestsOlderThan(LocalDate cutoff);

    // Находит все квесты данного типа из прошлых периодов (без требования status=EXPIRED)
    @Query("SELECT q FROM Quest q WHERE q.type = :type AND q.startDate < :today")
    List<Quest> findExpiredByType(Quest.QuestType type, LocalDate today);
}
