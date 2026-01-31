package com.cloudsync.service;

import com.cloudsync.config.StorageConfig;
import com.cloudsync.dto.FileDto;
import com.cloudsync.dto.StorageStats;
import com.cloudsync.entity.Folder;
import com.cloudsync.entity.StoredFile;
import com.cloudsync.entity.User;
import com.cloudsync.exception.FileNotFoundException;
import com.cloudsync.exception.FolderNotFoundException;
import com.cloudsync.repository.FileRepository;
import com.cloudsync.repository.FolderRepository;
import com.cloudsync.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;

/**
 * Service for managing file operations including upload, download, and sharing.
 * Handles file storage, metadata management, and user quota tracking.
 */
@Service
@Transactional
public class FileService {

    private static final Logger log = LoggerFactory.getLogger(FileService.class);

    private final FileRepository fileRepository;
    private final FolderRepository folderRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;
    private final StorageConfig storageConfig;

    public FileService(FileRepository fileRepository, FolderRepository folderRepository,
                       UserRepository userRepository, StorageService storageService,
                       StorageConfig storageConfig) {
        this.fileRepository = fileRepository;
        this.folderRepository = folderRepository;
        this.userRepository = userRepository;
        this.storageService = storageService;
        this.storageConfig = storageConfig;
    }

    /**
     * Uploads a single file to the specified folder.
     */
    public FileDto uploadFile(MultipartFile file, User user, Long folderId) {
        Folder folder = resolveTargetFolder(folderId, user);

        StoredFile storedFile = storageService.store(file, user, folder);
        userRepository.save(user);
        
        log.info("File uploaded: userId={}, fileId={}, size={}", 
                user.getId(), storedFile.getId(), storedFile.getSize());
        
        return FileDto.fromEntity(storedFile);
    }

    /**
     * Uploads multiple files to the specified folder.
     */
    public List<FileDto> uploadFiles(MultipartFile[] files, User user, Long folderId) {
        Folder targetFolder = resolveTargetFolder(folderId, user);

        List<FileDto> uploadedFiles = Arrays.stream(files)
                .map(file -> {
                    StoredFile storedFile = storageService.store(file, user, targetFolder);
                    return FileDto.fromEntity(storedFile);
                })
                .toList();
        
        log.info("Batch upload completed: userId={}, fileCount={}", user.getId(), files.length);
        
        return uploadedFiles;
    }

    /**
     * Retrieves file metadata by ID.
     */
    @Transactional(readOnly = true)
    public FileDto getFile(Long fileId, User user) {
        StoredFile file = findFileByIdAndOwner(fileId, user);
        return FileDto.fromEntity(file);
    }

    /**
     * Retrieves all files owned by the user.
     */
    @Transactional(readOnly = true)
    public List<FileDto> getAllFiles(User user) {
        return fileRepository.findByOwner(user).stream()
                .map(FileDto::fromEntity)
                .toList();
    }

    /**
     * Retrieves files in the root directory (not in any folder).
     */
    @Transactional(readOnly = true)
    public List<FileDto> getFilesInRoot(User user) {
        return fileRepository.findByOwnerAndFolderIsNull(user).stream()
                .map(FileDto::fromEntity)
                .toList();
    }

    /**
     * Retrieves all files in a specific folder.
     */
    @Transactional(readOnly = true)
    public List<FileDto> getFilesInFolder(User user, Long folderId) {
        Folder folder = folderRepository.findByIdAndOwner(folderId, user)
                .orElseThrow(() -> new FolderNotFoundException("Folder not found"));
        return fileRepository.findByOwnerAndFolder(user, folder).stream()
                .map(FileDto::fromEntity)
                .toList();
    }

    /**
     * Downloads a file and increments download counter.
     */
    public Resource downloadFile(Long fileId, User user) {
        StoredFile file = findFileByIdAndOwner(fileId, user);
        file.incrementDownloadCount();
        fileRepository.save(file);
        
        log.debug("File downloaded: fileId={}, downloadCount={}", fileId, file.getDownloadCount());
        
        return storageService.loadAsResource(file);
    }

    /**
     * Retrieves the stored file entity for download operations.
     */
    @Transactional(readOnly = true)
    public StoredFile getStoredFile(Long fileId, User user) {
        return findFileByIdAndOwner(fileId, user);
    }

    /**
     * Deletes a file from storage and database.
     */
    public void deleteFile(Long fileId, User user) {
        StoredFile file = findFileByIdAndOwner(fileId, user);

        storageService.delete(file);
        user.subtractStorageUsed(file.getSize());
        userRepository.save(user);
        fileRepository.delete(file);

        log.info("File deleted: userId={}, fileId={}", user.getId(), fileId);
    }

    /**
     * Renames a file.
     */
    public FileDto renameFile(Long fileId, User user, String newName) {
        StoredFile file = findFileByIdAndOwner(fileId, user);
        file.setOriginalName(newName);
        return FileDto.fromEntity(fileRepository.save(file));
    }

    /**
     * Moves a file to a different folder.
     */
    public FileDto moveFile(Long fileId, User user, Long targetFolderId) {
        StoredFile file = findFileByIdAndOwner(fileId, user);
        Folder targetFolder = resolveTargetFolder(targetFolderId, user);

        file.setFolder(targetFolder);
        return FileDto.fromEntity(fileRepository.save(file));
    }

    /**
     * Enables public sharing for a file by generating a share token.
     */
    public FileDto shareFile(Long fileId, User user) {
        StoredFile file = findFileByIdAndOwner(fileId, user);
        file.generateShareToken();
        file.setPublic(true);
        
        log.info("File shared: userId={}, fileId={}", user.getId(), fileId);
        
        return FileDto.fromEntity(fileRepository.save(file));
    }

    /**
     * Disables public sharing for a file.
     */
    public FileDto unshareFile(Long fileId, User user) {
        StoredFile file = findFileByIdAndOwner(fileId, user);
        file.setShareToken(null);
        file.setPublic(false);
        return FileDto.fromEntity(fileRepository.save(file));
    }

    /**
     * Retrieves a publicly shared file by its share token.
     */
    @Transactional(readOnly = true)
    public StoredFile getSharedFile(String shareToken) {
        return fileRepository.findByShareToken(shareToken)
                .orElseThrow(() -> new FileNotFoundException("Shared file not found"));
    }

    /**
     * Searches for files by name.
     */
    @Transactional(readOnly = true)
    public List<FileDto> searchFiles(User user, String query) {
        return fileRepository.searchByName(user, query).stream()
                .map(FileDto::fromEntity)
                .toList();
    }

    /**
     * Retrieves storage statistics for a user.
     */
    @Transactional(readOnly = true)
    public StorageStats getStorageStats(User user) {
        long usedStorage = fileRepository.calculateTotalStorageByOwner(user);
        int totalFiles = fileRepository.findByOwner(user).size();
        int totalFolders = folderRepository.findByOwnerAndParentIsNull(user).size();
        return new StorageStats(usedStorage, storageConfig.getMaxUserStorage(), totalFiles, totalFolders);
    }

    // --- Private helper methods ---

    private StoredFile findFileByIdAndOwner(Long fileId, User user) {
        return fileRepository.findByIdAndOwner(fileId, user)
                .orElseThrow(() -> new FileNotFoundException("File not found"));
    }

    private Folder resolveTargetFolder(Long folderId, User user) {
        if (folderId == null) {
            return null;
        }
        return folderRepository.findByIdAndOwner(folderId, user)
                .orElseThrow(() -> new FolderNotFoundException("Folder not found"));
    }
}
