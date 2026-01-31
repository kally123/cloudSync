package com.cloudsync.dto;

import com.cloudsync.entity.Folder;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

/**
 * Immutable DTO representing folder information for API responses.
 * Uses Java record for performance and immutability as per coding guidelines.
 */
public record FolderDto(
        Long id,
        String name,
        String path,
        Long parentId,
        String parentName,
        int fileCount,
        int subfolderCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<FolderDto> subfolders,
        List<FileDto> files
) {
    /**
     * Canonical constructor ensuring immutable collections.
     */
    public FolderDto {
        subfolders = subfolders != null ? List.copyOf(subfolders) : Collections.emptyList();
        files = files != null ? List.copyOf(files) : Collections.emptyList();
    }

    /**
     * Creates a FolderDto from a Folder entity without loading contents.
     * Use for list responses to avoid unnecessary data transfer.
     */
    public static FolderDto fromEntity(Folder folder) {
        return new FolderDto(
                folder.getId(),
                folder.getName(),
                folder.getPath(),
                folder.getParent() != null ? folder.getParent().getId() : null,
                folder.getParent() != null ? folder.getParent().getName() : null,
                folder.getFiles() != null ? folder.getFiles().size() : 0,
                folder.getSubfolders() != null ? folder.getSubfolders().size() : 0,
                folder.getCreatedAt(),
                folder.getUpdatedAt(),
                Collections.emptyList(),
                Collections.emptyList()
        );
    }

    /**
     * Creates a FolderDto from a Folder entity including contents.
     * Use for detailed folder view with subfolders and files.
     */
    public static FolderDto fromEntityWithContents(Folder folder) {
        List<FolderDto> subfolderDtos = folder.getSubfolders() != null
                ? folder.getSubfolders().stream().map(FolderDto::fromEntity).toList()
                : Collections.emptyList();
        
        List<FileDto> fileDtos = folder.getFiles() != null
                ? folder.getFiles().stream().map(FileDto::fromEntity).toList()
                : Collections.emptyList();

        return new FolderDto(
                folder.getId(),
                folder.getName(),
                folder.getPath(),
                folder.getParent() != null ? folder.getParent().getId() : null,
                folder.getParent() != null ? folder.getParent().getName() : null,
                fileDtos.size(),
                subfolderDtos.size(),
                folder.getCreatedAt(),
                folder.getUpdatedAt(),
                subfolderDtos,
                fileDtos
        );
    }
}
