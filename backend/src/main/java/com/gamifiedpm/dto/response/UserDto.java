package com.gamifiedpm.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.gamifiedpm.model.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    @JsonProperty("avatar")
    private String avatarUrl;
    private User.Role role;
    private Integer level;
    private Integer totalXp;
    // alias so the frontend can read it as "xp"
    @JsonProperty("xp")
    private Integer xpAlias;
    private Integer currentStreak;
    private Integer xpForNextLevel;
    private String bio;
    private String position;
    private String githubUrl;
    private String phone;
    private String telegramUsername;
    private Boolean selfRegisteredAdmin;
    private Long invitedBy;

    public static UserDto fromEntity(User user) {
        return UserDto.builder()
            .id(user.getId())
            .email(user.getEmail())
            .firstName(user.getFirstName())
            .lastName(user.getLastName())
            .avatarUrl(user.getAvatarUrl())
            .role(user.getRole())
            .level(user.getLevel())
            .totalXp(user.getTotalXp())
            .xpAlias(user.getTotalXp())
            .currentStreak(user.getCurrentStreak())
            .xpForNextLevel(user.getXpForNextLevel())
            .bio(user.getBio())
            .position(user.getPosition())
            .githubUrl(user.getGithubUrl())
            .phone(user.getPhone())
            .telegramUsername(user.getTelegramUsername())
            .selfRegisteredAdmin(Boolean.TRUE.equals(user.getSelfRegisteredAdmin()))
            .invitedBy(user.getInvitedBy())
            .build();
    }
}




