package com.cloudsync.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Immutable login request containing user credentials.
 */
public record LoginRequest(
        @NotBlank(message = "Username is required")
        String username,

        @NotBlank(message = "Password is required")
        String password
) {}
