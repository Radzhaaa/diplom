package com.gamifiedpm.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    
    @NotBlank(message = "Email обязателен")
    @Email(message = "Некорректный формат email")
    private String email;
    
    @NotBlank(message = "Пароль обязателен")
    @Size(min = 8, message = "Пароль должен содержать минимум 8 символов")
    private String password;
    
    @NotBlank(message = "Имя обязательно")
    private String firstName;
    
    @NotBlank(message = "Фамилия обязательна")
    private String lastName;

    private String inviteToken;
}




