package com.cloudsync.dto;

import com.cloudsync.entity.Folder;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class FolderDto {

    private Long id;
    private String name;
    private String path;
    private Long parentId;
    private String parentName;
    private int fileCount;
    private int subfolderCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<FolderDto> subfolders;
    private List<FileDto> files;

    public FolderDto() {}

    public static FolderDto fromEntity(Folder folder) {
        FolderDto dto = new FolderDto();
        dto.setId(folder.getId());
        dto.setName(folder.getName());
        dto.setPath(folder.getPath());
        dto.setParentId(folder.getParent() != null ? folder.getParent().getId() : null);
        dto.setParentName(folder.getParent() != null ? folder.getParent().getName() : null);
        dto.setFileCount(folder.getFiles() != null ? folder.getFiles().size() : 0);
        dto.setSubfolderCount(folder.getSubfolders() != null ? folder.getSubfolders().size() : 0);
        dto.setCreatedAt(folder.getCreatedAt());
        dto.setUpdatedAt(folder.getUpdatedAt());
        return dto;
    }

    public static FolderDto fromEntityWithContents(Folder folder) {
        FolderDto dto = fromEntity(folder);
        if (folder.getSubfolders() != null) {
            dto.setSubfolders(folder.getSubfolders().stream()
                    .map(FolderDto::fromEntity)
                    .collect(Collectors.toList()));
        }
        if (folder.getFiles() != null) {
            dto.setFiles(folder.getFiles().stream()
                    .map(FileDto::fromEntity)
                    .collect(Collectors.toList()));
        }
        return dto;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public Long getParentId() {
        return parentId;
    }

    public void setParentId(Long parentId) {
        this.parentId = parentId;
    }

    public String getParentName() {
        return parentName;
    }

    public void setParentName(String parentName) {
        this.parentName = parentName;
    }

    public int getFileCount() {
        return fileCount;
    }

    public void setFileCount(int fileCount) {
        this.fileCount = fileCount;
    }

    public int getSubfolderCount() {
        return subfolderCount;
    }

    public void setSubfolderCount(int subfolderCount) {
        this.subfolderCount = subfolderCount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<FolderDto> getSubfolders() {
        return subfolders;
    }

    public void setSubfolders(List<FolderDto> subfolders) {
        this.subfolders = subfolders;
    }

    public List<FileDto> getFiles() {
        return files;
    }

    public void setFiles(List<FileDto> files) {
        this.files = files;
    }
}
