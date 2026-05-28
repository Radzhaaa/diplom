package com.gamifiedpm.service;

import com.gamifiedpm.dto.request.CreateOrganizationRequest;
import com.gamifiedpm.dto.response.OrganizationDto;
import com.gamifiedpm.exception.AccessDeniedException;
import com.gamifiedpm.model.entity.Organization;
import com.gamifiedpm.model.entity.User;
import com.gamifiedpm.repository.DepartmentRepository;
import com.gamifiedpm.repository.OrganizationRepository;
import com.gamifiedpm.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrganizationServiceTest {

    @Mock private OrganizationRepository organizationRepository;
    @Mock private UserRepository userRepository;
    @Mock private DepartmentRepository departmentRepository;

    @InjectMocks private OrganizationService organizationService;

    private User owner;
    private Organization org;

    @BeforeEach
    void setUp() {
        owner = User.builder()
                .id(1L).email("owner@test.com")
                .firstName("Alice").lastName("Smith")
                .role(User.Role.PROJECT_MANAGER)
                .build();

        org = Organization.builder()
                .id(10L).name("Acme Corp")
                .owner(owner)
                .users(new ArrayList<>())
                .maxUsers(10)
                .subscriptionPlan(Organization.SubscriptionPlan.FREE)
                .build();
    }


    @Test
    void getUserOrganizations_returnsOwnerOrgs() {
        given(userRepository.findByEmail("owner@test.com")).willReturn(Optional.of(owner));
        given(organizationRepository.findByOwner(owner)).willReturn(new ArrayList<>(List.of(org)));
        given(organizationRepository.findAll()).willReturn(List.of(org));

        List<OrganizationDto> result = organizationService.getUserOrganizations("owner@test.com");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Acme Corp");
    }

    @Test
    void getUserOrganizations_throwsRuntime_whenUserNotFound() {
        given(userRepository.findByEmail("ghost@test.com")).willReturn(Optional.empty());

        assertThatThrownBy(() -> organizationService.getUserOrganizations("ghost@test.com"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found");
    }


    @Test
    void getOrganizationById_returnsDto_whenOwner() {
        given(userRepository.findByEmail("owner@test.com")).willReturn(Optional.of(owner));
        given(organizationRepository.findById(10L)).willReturn(Optional.of(org));

        OrganizationDto result = organizationService.getOrganizationById(10L, "owner@test.com");

        assertThat(result.getId()).isEqualTo(10L);
    }

    @Test
    void getOrganizationById_throwsAccessDenied_whenNotMember() {
        User outsider = User.builder().id(99L).email("out@test.com")
                .firstName("X").lastName("Y").role(User.Role.TEAM_MEMBER).build();

        given(userRepository.findByEmail("out@test.com")).willReturn(Optional.of(outsider));
        given(organizationRepository.findById(10L)).willReturn(Optional.of(org));

        assertThatThrownBy(() -> organizationService.getOrganizationById(10L, "out@test.com"))
                .isInstanceOf(AccessDeniedException.class);
    }


    @Test
    void createOrganization_createsSuccessfully_whenDomainIsUnique() {
        CreateOrganizationRequest req = new CreateOrganizationRequest();
        req.setName("NewCorp");
        req.setDomain("newcorp.io");

        Organization saved = Organization.builder()
                .id(20L).name("NewCorp").domain("newcorp.io")
                .owner(owner).users(new ArrayList<>())
                .subscriptionPlan(Organization.SubscriptionPlan.FREE)
                .maxUsers(10)
                .build();

        given(userRepository.findByEmail("owner@test.com")).willReturn(Optional.of(owner));
        given(organizationRepository.findByDomain("newcorp.io")).willReturn(Optional.empty());
        given(organizationRepository.save(any(Organization.class))).willReturn(saved);
        given(userRepository.save(any(User.class))).willReturn(owner);

        OrganizationDto result = organizationService.createOrganization(req, "owner@test.com");

        assertThat(result.getName()).isEqualTo("NewCorp");
        verify(organizationRepository).save(any());
    }

    @Test
    void createOrganization_throwsIllegalState_whenDomainTaken() {
        CreateOrganizationRequest req = new CreateOrganizationRequest();
        req.setName("X");
        req.setDomain("taken.io");

        given(userRepository.findByEmail("owner@test.com")).willReturn(Optional.of(owner));
        given(organizationRepository.findByDomain("taken.io")).willReturn(Optional.of(org));

        assertThatThrownBy(() -> organizationService.createOrganization(req, "owner@test.com"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Domain already exists");
    }


    @Test
    void addUserToOrganization_addsUser_whenRequesterIsOwner() {
        User target = User.builder().id(2L).email("target@test.com")
                .firstName("Bob").lastName("Jones").role(User.Role.TEAM_MEMBER).build();

        given(userRepository.findByEmail("owner@test.com")).willReturn(Optional.of(owner));
        given(organizationRepository.findById(10L)).willReturn(Optional.of(org));
        given(userRepository.findByEmail("target@test.com")).willReturn(Optional.of(target));
        given(userRepository.save(target)).willReturn(target);
        given(organizationRepository.findById(10L)).willReturn(Optional.of(org));

        OrganizationDto result = organizationService.addUserToOrganization(10L, "target@test.com", "owner@test.com");

        assertThat(result).isNotNull();
        verify(userRepository).save(target);
    }

    @Test
    void addUserToOrganization_throwsAccessDenied_whenNotOwner() {
        User other = User.builder().id(99L).email("other@test.com")
                .firstName("X").lastName("Y").role(User.Role.TEAM_MEMBER).build();

        given(userRepository.findByEmail("other@test.com")).willReturn(Optional.of(other));
        given(organizationRepository.findById(10L)).willReturn(Optional.of(org));

        assertThatThrownBy(() -> organizationService.addUserToOrganization(10L, "target@test.com", "other@test.com"))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void addUserToOrganization_throwsIllegalState_whenLimitReached() {
        // fill org to capacity
        for (int i = 0; i < 10; i++) {
            org.getUsers().add(User.builder().id((long)(i + 100)).email("u" + i + "@x.com")
                    .firstName("U").lastName("" + i).role(User.Role.TEAM_MEMBER).build());
        }

        given(userRepository.findByEmail("owner@test.com")).willReturn(Optional.of(owner));
        given(organizationRepository.findById(10L)).willReturn(Optional.of(org));

        assertThatThrownBy(() -> organizationService.addUserToOrganization(10L, "new@test.com", "owner@test.com"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("user limit");
    }


    @Test
    void deleteOrganization_deletesSuccessfully_whenOwner() {
        given(userRepository.findByEmail("owner@test.com")).willReturn(Optional.of(owner));
        given(organizationRepository.findById(10L)).willReturn(Optional.of(org));

        organizationService.deleteOrganization(10L, "owner@test.com");

        verify(organizationRepository).delete(org);
    }

    @Test
    void deleteOrganization_throwsAccessDenied_whenNotOwner() {
        User other = User.builder().id(99L).email("other@test.com")
                .firstName("X").lastName("Y").role(User.Role.TEAM_MEMBER).build();

        given(userRepository.findByEmail("other@test.com")).willReturn(Optional.of(other));
        given(organizationRepository.findById(10L)).willReturn(Optional.of(org));

        assertThatThrownBy(() -> organizationService.deleteOrganization(10L, "other@test.com"))
                .isInstanceOf(AccessDeniedException.class);

        verify(organizationRepository, never()).delete(any());
    }
}
