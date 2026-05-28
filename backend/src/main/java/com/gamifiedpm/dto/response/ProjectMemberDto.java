package com.gamifiedpm.dto.response;

import com.gamifiedpm.model.entity.ProjectMember;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectMemberDto {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String avatarUrl;
    private String systemRole;
    private Integer level;
    private ProjectMember.ProjectRole projectRole;
    private LocalDateTime joinedAt;
    private String position;

    public static ProjectMemberDto fromEntity(ProjectMember member) {
        return ProjectMemberDto.builder()
            .id(member.getUser().getId())
            .email(member.getUser().getEmail())
            .firstName(member.getUser().getFirstName())
            .lastName(member.getUser().getLastName())
            .avatarUrl(member.getUser().getAvatarUrl())
            .systemRole(member.getUser().getRole().name())
            .level(member.getUser().getLevel())
            .projectRole(member.getRole())
            .joinedAt(member.getJoinedAt())
            .position(member.getUser().getPosition())
            .build();
    }
}
