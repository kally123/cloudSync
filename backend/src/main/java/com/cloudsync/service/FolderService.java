package com.cloudsync.service;

import com.cloudsync.dto.FolderDto;
import com.cloudsync.entity.Folder;
import com.cloudsync.entity.User;
import com.cloudsync.exception.FolderNotFoundException;
import com.cloudsync.repository.FolderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service for managing folder operations including creation, navigation, and hierarchy management.
 * Enforces business rules for folder naming and prevents circular references.
 */
@Service
@Transactional
public class FolderService {

    private static final Logger log = LoggerFactory.getLogger(FolderService.class);

    private final FolderRepository folderRepository;

    public FolderService(FolderRepository folderRepository) {
        this.folderRepository = folderRepository;
    }

    /**
     * Creates a new folder with the given name under the specified parent.
     * Validates that no duplicate folder name exists at the same level.
     */
    public FolderDto createFolder(String name, User user, Long parentId) {
        Folder parent = resolveParentFolder(parentId, user);

        validateUniqueFolderName(name, user, parent);

        Folder folder = new Folder(name, user, parent);
        Folder savedFolder = folderRepository.save(folder);
        
        log.info("Folder created: userId={}, folderId={}, name={}", 
                user.getId(), savedFolder.getId(), name);
        
        return FolderDto.fromEntity(savedFolder);
    }

    /**
     * Retrieves folder details including contents (subfolders and files).
     */
    @Transactional(readOnly = true)
    public FolderDto getFolder(Long folderId, User user) {
        Folder folder = findFolderByIdAndOwner(folderId, user);
        return FolderDto.fromEntityWithContents(folder);
    }

    /**
     * Retrieves all root-level folders for the user.
     */
    @Transactional(readOnly = true)
    public List<FolderDto> getRootFolders(User user) {
        return folderRepository.findByOwnerAndParentIsNull(user).stream()
                .map(FolderDto::fromEntity)
                .toList();
    }

    /**
     * Retrieves all subfolders of a specific folder.
     */
    @Transactional(readOnly = true)
    public List<FolderDto> getSubfolders(Long parentId, User user) {
        Folder parent = findFolderByIdAndOwner(parentId, user);
        return folderRepository.findByOwnerAndParent(user, parent).stream()
                .map(FolderDto::fromEntity)
                .toList();
    }

    /**
     * Renames a folder. Validates that no duplicate name exists at the same level.
     */
    public FolderDto renameFolder(Long folderId, User user, String newName) {
        Folder folder = findFolderByIdAndOwner(folderId, user);

        validateUniqueFolderName(newName, user, folder.getParent());

        folder.setName(newName);
        return FolderDto.fromEntity(folderRepository.save(folder));
    }

    /**
     * Moves a folder to a new parent. Validates hierarchy to prevent circular references.
     */
    public FolderDto moveFolder(Long folderId, User user, Long targetParentId) {
        Folder folder = findFolderByIdAndOwner(folderId, user);
        Folder targetParent = resolveTargetParentForMove(targetParentId, user, folder);

        validateUniqueFolderName(folder.getName(), user, targetParent);

        folder.setParent(targetParent);
        
        log.info("Folder moved: userId={}, folderId={}, newParentId={}", 
                user.getId(), folderId, targetParentId);
        
        return FolderDto.fromEntity(folderRepository.save(folder));
    }

    /**
     * Deletes a folder and all its contents (cascade delete).
     */
    public void deleteFolder(Long folderId, User user) {
        Folder folder = findFolderByIdAndOwner(folderId, user);
        folderRepository.delete(folder);
        
        log.info("Folder deleted: userId={}, folderId={}", user.getId(), folderId);
    }

    // --- Private helper methods ---

    private Folder findFolderByIdAndOwner(Long folderId, User user) {
        return folderRepository.findByIdAndOwner(folderId, user)
                .orElseThrow(() -> new FolderNotFoundException("Folder not found"));
    }

    private Folder resolveParentFolder(Long parentId, User user) {
        if (parentId == null) {
            return null;
        }
        return folderRepository.findByIdAndOwner(parentId, user)
                .orElseThrow(() -> new FolderNotFoundException("Parent folder not found"));
    }

    private Folder resolveTargetParentForMove(Long targetParentId, User user, Folder folderToMove) {
        if (targetParentId == null) {
            return null;
        }
        
        Folder targetParent = folderRepository.findByIdAndOwner(targetParentId, user)
                .orElseThrow(() -> new FolderNotFoundException("Target folder not found"));

        // Prevent moving folder into itself or its descendants
        if (isDescendantOf(targetParent, folderToMove)) {
            throw new IllegalArgumentException("Cannot move folder into itself or its children");
        }
        
        return targetParent;
    }

    private void validateUniqueFolderName(String name, User user, Folder parent) {
        if (folderRepository.existsByNameAndOwnerAndParent(name, user, parent)) {
            throw new IllegalArgumentException("Folder with name '" + name + "' already exists");
        }
    }

    /**
     * Checks if potentialDescendant is the same as or a descendant of ancestor.
     * Used to prevent circular folder references during move operations.
     */
    private boolean isDescendantOf(Folder potentialDescendant, Folder ancestor) {
        if (potentialDescendant.getId().equals(ancestor.getId())) {
            return true;
        }
        Folder current = potentialDescendant.getParent();
        while (current != null) {
            if (current.getId().equals(ancestor.getId())) {
                return true;
            }
            current = current.getParent();
        }
        return false;
    }
}
