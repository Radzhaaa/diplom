package com.gamifiedpm.repository;

import com.gamifiedpm.model.entity.Achievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AchievementRepository extends JpaRepository<Achievement, Long> {
    Optional<Achievement> findByConditionType(String conditionType);
    
    @Query("SELECT a FROM Achievement a WHERE a.conditionType IN :conditionTypes")
    List<Achievement> findByConditionTypeIn(@Param("conditionTypes") List<String> conditionTypes);
}




