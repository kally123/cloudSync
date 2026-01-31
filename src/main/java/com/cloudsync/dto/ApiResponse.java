package com.cloudsync.dto;

/**
 * Immutable generic API response wrapper.
 * Provides consistent response structure across all API endpoints.
 */
public record ApiResponse<T>(
        boolean success,
        String message,
        T data
) {
    /**
     * Creates a successful response with message only.
     */
    public static <T> ApiResponse<T> success(String message) {
        return new ApiResponse<>(true, message, null);
    }

    /**
     * Creates a successful response with message and data payload.
     */
    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(true, message, data);
    }

    /**
     * Creates an error response with message.
     */
    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, message, null);
    }
}
