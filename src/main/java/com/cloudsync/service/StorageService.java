package com.cloudsync.service;

import com.cloudsync.config.StorageConfig;
import com.cloudsync.entity.Folder;
import com.cloudsync.entity.StoredFile;
import com.cloudsync.entity.User;
import com.cloudsync.exception.FileStorageException;
import com.cloudsync.exception.StorageQuotaExceededException;
import com.cloudsync.repository.FileRepository;
import jakarta.annotation.PostConstruct;
import org.apache.commons.io.FilenameUtils;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class StorageService {

    private final StorageConfig storageConfig;
    private final FileRepository fileRepository;
    private Path rootLocation;

    public StorageService(StorageConfig storageConfig, FileRepository fileRepository) {
        this.storageConfig = storageConfig;
        this.fileRepository = fileRepository;
    }

    @PostConstruct
    public void init() {
        try {
            this.rootLocation = Paths.get(storageConfig.getPath()).toAbsolutePath().normalize();
            Files.createDirectories(rootLocation);
        } catch (IOException e) {
            throw new FileStorageException("Could not initialize storage location", e);
        }
    }

    public StoredFile store(MultipartFile file, User owner, Folder folder) {
        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
        
        // Validate file
        if (file.isEmpty()) {
            throw new FileStorageException("Cannot store empty file");
        }
        if (originalFilename.contains("..")) {
            throw new FileStorageException("Invalid file path: " + originalFilename);
        }

        // Check storage quota
        long fileSize = file.getSize();
        if (owner.getStorageUsed() + fileSize > storageConfig.getMaxUserStorage()) {
            throw new StorageQuotaExceededException("Storage quota exceeded. Maximum: " + 
                    formatBytes(storageConfig.getMaxUserStorage()) + ", Used: " + 
                    formatBytes(owner.getStorageUsed()));
        }

        try {
            // Generate unique filename
            String extension = FilenameUtils.getExtension(originalFilename);
            String storedName = UUID.randomUUID().toString() + (extension.isEmpty() ? "" : "." + extension);

            // Create user directory if it doesn't exist
            Path userDir = rootLocation.resolve(String.valueOf(owner.getId()));
            Files.createDirectories(userDir);

            // Store file
            Path destinationFile = userDir.resolve(storedName).normalize();
            if (!destinationFile.getParent().equals(userDir)) {
                throw new FileStorageException("Cannot store file outside user directory");
            }

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
            }

            // Calculate checksum
            String checksum = calculateChecksum(destinationFile);

            // Create file entity
            StoredFile storedFile = new StoredFile(
                    storedName,
                    originalFilename,
                    file.getContentType(),
                    fileSize,
                    destinationFile.toString(),
                    owner
            );
            storedFile.setChecksum(checksum);
            storedFile.setFolder(folder);

            // Update user storage
            owner.addStorageUsed(fileSize);

            return fileRepository.save(storedFile);

        } catch (IOException e) {
            throw new FileStorageException("Failed to store file: " + originalFilename, e);
        }
    }

    public Resource loadAsResource(StoredFile file) {
        try {
            Path filePath = Paths.get(file.getStoragePath());
            Resource resource = new UrlResource(filePath.toUri());
            
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new FileStorageException("Could not read file: " + file.getOriginalName());
            }
        } catch (MalformedURLException e) {
            throw new FileStorageException("Could not read file: " + file.getOriginalName(), e);
        }
    }

    public void delete(StoredFile file) {
        try {
            Path filePath = Paths.get(file.getStoragePath());
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            throw new FileStorageException("Could not delete file: " + file.getOriginalName(), e);
        }
    }

    public void deleteUserDirectory(User user) {
        try {
            Path userDir = rootLocation.resolve(String.valueOf(user.getId()));
            if (Files.exists(userDir)) {
                Files.walk(userDir)
                        .sorted((a, b) -> b.compareTo(a))
                        .forEach(path -> {
                            try {
                                Files.delete(path);
                            } catch (IOException e) {
                                throw new FileStorageException("Could not delete user directory", e);
                            }
                        });
            }
        } catch (IOException e) {
            throw new FileStorageException("Could not delete user directory", e);
        }
    }

    private String calculateChecksum(Path file) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] fileBytes = Files.readAllBytes(file);
            byte[] hashBytes = digest.digest(fileBytes);
            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException | IOException e) {
            return null;
        }
    }

    private String formatBytes(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.2f KB", bytes / 1024.0);
        if (bytes < 1024 * 1024 * 1024) return String.format("%.2f MB", bytes / (1024.0 * 1024));
        return String.format("%.2f GB", bytes / (1024.0 * 1024 * 1024));
    }

    public Path getRootLocation() {
        return rootLocation;
    }
}
