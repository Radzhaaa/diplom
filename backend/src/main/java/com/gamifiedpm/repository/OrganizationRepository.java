package com.gamifiedpm.repository;

import com.gamifiedpm.model.entity.Organization;
import com.gamifiedpm.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, Long> {
    List<Organization> findByOwner(User owner);
    Optional<Organization> findByDomain(String domain);
    List<Organization> findByNameContainingIgnoreCase(String name);
}
