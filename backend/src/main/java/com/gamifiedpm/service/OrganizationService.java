package com.gamifiedpm.service;

import com.gamifiedpm.dto.request.CreateOrganizationRequest;
import com.gamifiedpm.dto.response.DepartmentDto;
import com.gamifiedpm.dto.response.OrganizationDto;
import com.gamifiedpm.model.entity.Organization;
import com.gamifiedpm.model.entity.User;
import com.gamifiedpm.repository.DepartmentRepository;
import com.gamifiedpm.repository.OrganizationRepository;
import com.gamifiedpm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;

    @Transactional(readOnly = true)
    public List<OrganizationDto> getUserOrganizations(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<Organization> organizations = organizationRepository.findByOwner(user);
        organizations.addAll(organizationRepository.findAll().stream()
            .filter(org -> org.getUsers().contains(user))
            .collect(Collectors.toList()));
        
        return organizations.stream()
            .map(OrganizationDto::fromEntity)
            .distinct()
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public OrganizationDto getOrganizationById(Long id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        Organization organization = organizationRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Organization not found"));
        
        if (!organization.getOwner().getId().equals(user.getId()) && 
            !organization.getUsers().contains(user) &&
            user.getRole() != User.Role.ADMIN) {
            throw new com.gamifiedpm.exception.AccessDeniedException("Access denied");
        }
        
        return OrganizationDto.fromEntity(organization);
    }

    @Transactional
    public OrganizationDto createOrganization(CreateOrganizationRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (request.getDomain() != null && 
            organizationRepository.findByDomain(request.getDomain()).isPresent()) {
            throw new IllegalStateException("Domain already exists");
        }
        
        Organization organization = Organization.builder()
            .name(request.getName())
            .description(request.getDescription())
            .logoUrl(request.getLogoUrl())
            .domain(request.getDomain())
            .subscriptionPlan(Organization.SubscriptionPlan.FREE)
            .maxUsers(10)
            .owner(user)
            .build();
        
        organization = organizationRepository.save(organization);
        
        user.setOrganization(organization);
        userRepository.save(user);
        
        log.info("Organization created: {} by user: {}", organization.getId(), userEmail);
        return OrganizationDto.fromEntity(organization);
    }

    @Transactional(readOnly = true)
    public List<DepartmentDto> getOrganizationDepartments(Long id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));

        Organization organization = organizationRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Organization not found"));

        if (!organization.getOwner().getId().equals(user.getId()) &&
            !organization.getUsers().contains(user) &&
            user.getRole() != User.Role.ADMIN) {
            throw new com.gamifiedpm.exception.AccessDeniedException("Access denied");
        }

        return departmentRepository.findByOrganization(organization).stream()
            .map(DepartmentDto::fromEntity)
            .collect(Collectors.toList());
    }

    @Transactional
    public OrganizationDto addUserToOrganization(Long id, String targetUserEmail, String requesterEmail) {
        User requester = userRepository.findByEmail(requesterEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));

        Organization organization = organizationRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Organization not found"));

        if (!organization.getOwner().getId().equals(requester.getId()) &&
            requester.getRole() != User.Role.ADMIN) {
            throw new com.gamifiedpm.exception.AccessDeniedException("Access denied: only owner can add users");
        }

        if (organization.getMaxUsers() > 0 &&
            organization.getUsers().size() >= organization.getMaxUsers()) {
            throw new IllegalStateException("Organization user limit reached");
        }

        User targetUser = userRepository.findByEmail(targetUserEmail)
            .orElseThrow(() -> new RuntimeException("Target user not found: " + targetUserEmail));

        targetUser.setOrganization(organization);
        userRepository.save(targetUser);

        log.info("User {} added to organization {} by {}", targetUserEmail, id, requesterEmail);
        return OrganizationDto.fromEntity(organizationRepository.findById(id).get());
    }

    @Transactional
    public void deleteOrganization(Long id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        Organization organization = organizationRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Organization not found"));
        
        if (!organization.getOwner().getId().equals(user.getId())) {
            throw new com.gamifiedpm.exception.AccessDeniedException("Access denied");
        }
        
        organizationRepository.delete(organization);
        log.info("Organization deleted: {} by user: {}", id, userEmail);
    }
}
