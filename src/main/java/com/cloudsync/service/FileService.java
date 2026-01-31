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
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class FileService {

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

    public FileDto uploadFile(MultipartFile file, User user, Long folderId) {
        Folder folder = null;
        if (folderId != null) {
            folder = folderRepository.findByIdAndOwner(folderId, user)
                    .orElseThrow(() -> new FolderNotFoundException("Folder not found"));
        }

        StoredFile storedFile = storageService.store(file, user, folder);
        userRepository.save(user);
        
        return FileDto.fromEntity(storedFile);
    }

    public List<FileDto> uploadFiles(MultipartFile[] files, User user, Long folderId) {
        Folder folder = null;
        if (folderId != null) {
            folder = folderRepository.findByIdAndOwner(folderId, user)
                    .orElseThrow(() -> new FolderNotFoundException("Folder not found"));
        }

        final Folder targetFolder = folder;
        return java.util.Arrays.stream(files)
                .map(file -> {
                    StoredFile storedFile = storageService.store(file, user, targetFolder);
                    return FileDto.fromEntity(storedFile);
                })
                .collect(Collectors.toList());
    }

    public FileDto getFile(Long fileId, User user) {
        StoredFile file = fileRepository.findByIdAndOwner(fileId, user)
                .orElseThrow(() -> new FileNotFoundException("File not found"));
        return FileDto.fromEntity(file);
    }

    public List<FileDto> getAllFiles(User user) {
        return fileRepository.findByOwner(user).stream()
                .map(FileDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<FileDto> getFilesInRoot(User user) {
        return fileRepository.findByOwnerAndFolderIsNull(user).stream()
                .map(FileDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<FileDto> getFilesInFolder(User user, Long folderId) {
        Folder folder = folderRepository.findByIdAndOwner(folderId, user)
                .orElseThrow(() -> new FolderNotFoundException("Folder not found"));
        return fileRepository.findByOwnerAndFolder(user, folder).stream()
                .map(FileDto::fromEntity)
                .collect(Collectors.toList());
    }

    public Resource downloadFile(Long fileId, User user) {
        StoredFile file = fileRepository.findByIdAndOwner(fileId, user)
                .orElseThrow(() -> new FileNotFoundException("File not found"));
        file.incrementDownloadCount();
        fileRepository.save(file);
        return storageService.loadAsResource(file);
    }

    public StoredFile getStoredFile(Long fileId, User user) {
        return fileRepository.findByIdAndOwner(fileId, user)
                .orElseThrow(() -> new FileNotFoundException("File not found"));
    }

    public void deleteFile(Long fileId, User user) {
        StoredFile file = fileRepository.findByIdAndOwner(fileId, user)
                .orElseThrow(() -> new FileNotFoundException("File not found"));

        // Delete from storage
        storageService.delete(file);

        // Update user storage
        user.subtractStorageUsed(file.getSize());
        userRepository.save(user);

        // Delete from database
        fileRepository.delete(file);
    }

    public FileDto renameFile(Long fileId, User user, String newName) {
        StoredFile file = fileRepository.findByIdAndOwner(fileId, user)
                .orElseThrow(() -> new FileNotFoundException("File not found"));
        file.setOriginalName(newName);
        return FileDto.fromEntity(fileRepository.save(file));
    }

    public FileDto moveFile(Long fileId, User user, Long targetFolderId) {
        StoredFile file = fileRepository.findByIdAndOwner(fileId, user)
                .orElseThrow(() -> new FileNotFoundException("File not found"));

        Folder targetFolder = null;
        if (targetFolderId != null) {
            targetFolder = folderRepository.findByIdAndOwner(targetFolderId, user)
                    .orElseThrow(() -> new FolderNotFoundException("Target folder not found"));
        }

        file.setFolder(targetFolder);
        return FileDto.fromEntity(fileRepository.save(file));
    }

    public FileDto shareFile(Long fileId, User user) {
        StoredFile file = fileRepository.findByIdAndOwner(fileId, user)
                .orElseThrow(() -> new FileNotFoundException("File not found"));
        file.generateShareToken();
        file.setPublic(true);
        return FileDto.fromEntity(fileRepository.save(file));
    }

    public FileDto unshareFile(Long fileId, User user) {
        StoredFile file = fileRepository.findByIdAndOwner(fileId, user)
                .orElseThrow(() -> new FileNotFoundException("File not found"));
        file.setShareToken(null);
        file.setPublic(false);
        return FileDto.fromEntity(fileRepository.save(file));
    }

    public StoredFile getSharedFile(String shareToken) {
        return fileRepository.findByShareToken(shareToken)
                .orElseThrow(() -> new FileNotFoundException("Shared file not found"));
    }

    public List<FileDto> searchFiles(User user, String query) {
        return fileRepository.searchByName(user, query).stream()
                .map(FileDto::fromEntity)
                .collect(Collectors.toList());
    }

    public StorageStats getStorageStats(User user) {
        long usedStorage = fileRepository.calculateTotalStorageByOwner(user);
        int totalFiles = fileRepository.findByOwner(user).size();
        int totalFolders = folderRepository.findByOwnerAndParentIsNull(user).size();
        return new StorageStats(usedStorage, storageConfig.getMaxUserStorage(), totalFiles, totalFolders);
    }
}
