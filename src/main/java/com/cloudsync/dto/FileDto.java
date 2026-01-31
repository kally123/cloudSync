package com.cloudsync.dto;

import com.cloudsync.entity.StoredFile;
import java.time.LocalDateTime;

/**
 * Immutable DTO representing file information for API responses.
 * Uses Java record for performance and immutability as per coding guidelines.
 */
public record FileDto(
        Long id,
        String name,
        String originalName,
        String contentType,
        long size,
        String path,
        Long folderId,
        String folderName,
        boolean isPublic,
        String shareToken,
        long downloadCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    /**
     * Creates a FileDto from a StoredFile entity.
     * Converts entity to DTO for API layer separation.
     */
    public static FileDto fromEntity(StoredFile file) {
        return new FileDto(
                file.getId(),
                file.getName(),
                file.getOriginalName(),
                file.getContentType(),
                file.getSize(),
                file.getPath(),
                file.getFolder() != null ? file.getFolder().getId() : null,
                file.getFolder() != null ? file.getFolder().getName() : null,
                file.isPublic(),
                file.getShareToken(),
                file.getDownloadCount(),
                file.getCreatedAt(),
                file.getUpdatedAt()
        );
    }

    /**
     * Returns human-readable file size format.
     */
    public String formattedSize() {
        if (size < 1024) return size + " B";
        if (size < 1024 * 1024) return String.format("%.2f KB", size / 1024.0);
        if (size < 1024 * 1024 * 1024) return String.format("%.2f MB", size / (1024.0 * 1024));
        return String.format("%.2f GB", size / (1024.0 * 1024 * 1024));
    }
}
