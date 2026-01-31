package com.cloudsync.dto;

/**
 * Immutable authentication response containing JWT token and user info.
 */
public record AuthResponse(
        String token,
        String username,
        String email,
        String message
) {
    /**
     * Creates an AuthResponse with token and user details.
     */
    public AuthResponse(String token, String username, String email) {
        this(token, username, email, null);
    }

    /**
     * Creates an AuthResponse with message only (for error responses).
     */
    public AuthResponse(String message) {
        this(null, null, null, message);
    }
}
