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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

/**
 * Service for handling file storage operations on the file system.
 * Manages file persistence, quota enforcement, and checksum calculation.
 */
@Service
public class StorageService {

    private static final Logger log = LoggerFactory.getLogger(StorageService.class);

    private final StorageConfig storageConfig;
    private final FileRepository fileRepository;
    private Path rootLocation;

    public StorageService(StorageConfig storageConfig, FileRepository fileRepository) {
        this.storageConfig = storageConfig;
        this.fileRepository = fileRepository;
    }

    /**
     * Initializes the storage root directory on application startup.
     */
    @PostConstruct
    public void init() {
        try {
            this.rootLocation = Paths.get(storageConfig.getPath()).toAbsolutePath().normalize();
            Files.createDirectories(rootLocation);
            log.info("Storage initialized at: {}", rootLocation);
        } catch (IOException e) {
            log.error("Failed to initialize storage location", e);
            throw new FileStorageException("Could not initialize storage location", e);
        }
    }

    /**
     * Stores a file in the user's directory and creates the database record.
     * Validates file, checks quota, and calculates checksum.
     */
    public StoredFile store(MultipartFile file, User owner, Folder folder) {
        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
        
        validateFile(file, originalFilename);
        validateStorageQuota(owner, file.getSize());

        try {
            String storedName = generateUniqueFilename(originalFilename);
            Path userDir = ensureUserDirectoryExists(owner);
            Path destinationFile = resolveDestinationPath(userDir, storedName);

            copyFileToStorage(file, destinationFile);
            String checksum = calculateChecksum(destinationFile);

            StoredFile storedFile = createStoredFileEntity(
                    storedName, originalFilename, file.getContentType(), 
                    file.getSize(), destinationFile.toString(), owner, folder, checksum
            );

            owner.addStorageUsed(file.getSize());

            log.debug("File stored: path={}, size={}", destinationFile, file.getSize());

            return fileRepository.save(storedFile);

        } catch (IOException e) {
            log.error("Failed to store file: {}", originalFilename, e);
            throw new FileStorageException("Failed to store file: " + originalFilename, e);
        }
    }

    /**
     * Loads a stored file as a Spring Resource for download.
     */
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
            log.error("Failed to load file as resource: {}", file.getOriginalName(), e);
            throw new FileStorageException("Could not read file: " + file.getOriginalName(), e);
        }
    }

    /**
     * Deletes a file from the file system.
     */
    public void delete(StoredFile file) {
        try {
            Path filePath = Paths.get(file.getStoragePath());
            Files.deleteIfExists(filePath);
            log.debug("File deleted from storage: {}", filePath);
        } catch (IOException e) {
            log.error("Failed to delete file: {}", file.getOriginalName(), e);
            throw new FileStorageException("Could not delete file: " + file.getOriginalName(), e);
        }
    }

    /**
     * Deletes an entire user directory and all its contents.
     */
    public void deleteUserDirectory(User user) {
        try {
            Path userDir = rootLocation.resolve(String.valueOf(user.getId()));
            if (Files.exists(userDir)) {
                Files.walk(userDir)
                        .sorted((a, b) -> b.compareTo(a))
                        .forEach(this::deletePathSilently);
                log.info("User directory deleted: userId={}", user.getId());
            }
        } catch (IOException e) {
            log.error("Failed to delete user directory: userId={}", user.getId(), e);
            throw new FileStorageException("Could not delete user directory", e);
        }
    }

    public Path getRootLocation() {
        return rootLocation;
    }

    // --- Private helper methods ---

    private void validateFile(MultipartFile file, String filename) {
        if (file.isEmpty()) {
            throw new FileStorageException("Cannot store empty file");
        }
        if (filename.contains("..")) {
            throw new FileStorageException("Invalid file path: " + filename);
        }
    }

    private void validateStorageQuota(User owner, long fileSize) {
        if (owner.getStorageUsed() + fileSize > storageConfig.getMaxUserStorage()) {
            throw new StorageQuotaExceededException("Storage quota exceeded. Maximum: " + 
                    formatBytes(storageConfig.getMaxUserStorage()) + ", Used: " + 
                    formatBytes(owner.getStorageUsed()));
        }
    }

    private String generateUniqueFilename(String originalFilename) {
        String extension = FilenameUtils.getExtension(originalFilename);
        return UUID.randomUUID().toString() + (extension.isEmpty() ? "" : "." + extension);
    }

    private Path ensureUserDirectoryExists(User owner) throws IOException {
        Path userDir = rootLocation.resolve(String.valueOf(owner.getId()));
        Files.createDirectories(userDir);
        return userDir;
    }

    private Path resolveDestinationPath(Path userDir, String storedName) {
        Path destinationFile = userDir.resolve(storedName).normalize();
        if (!destinationFile.getParent().equals(userDir)) {
            throw new FileStorageException("Cannot store file outside user directory");
        }
        return destinationFile;
    }

    private void copyFileToStorage(MultipartFile file, Path destination) throws IOException {
        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, destination, StandardCopyOption.REPLACE_EXISTING);
        }
    }

    private StoredFile createStoredFileEntity(String storedName, String originalFilename, 
            String contentType, long size, String path, User owner, Folder folder, String checksum) {
        StoredFile storedFile = new StoredFile(storedName, originalFilename, contentType, size, path, owner);
        storedFile.setChecksum(checksum);
        storedFile.setFolder(folder);
        return storedFile;
    }

    private String calculateChecksum(Path file) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] fileBytes = Files.readAllBytes(file);
            byte[] hashBytes = digest.digest(fileBytes);
            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException | IOException e) {
            log.warn("Failed to calculate checksum for file: {}", file, e);
            return null;
        }
    }

    private void deletePathSilently(Path path) {
        try {
            Files.delete(path);
        } catch (IOException e) {
            throw new FileStorageException("Could not delete: " + path, e);
        }
    }

    private static String formatBytes(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.2f KB", bytes / 1024.0);
        if (bytes < 1024 * 1024 * 1024) return String.format("%.2f MB", bytes / (1024.0 * 1024));
        return String.format("%.2f GB", bytes / (1024.0 * 1024 * 1024));
    }
}
