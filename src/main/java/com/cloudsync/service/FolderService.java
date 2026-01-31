package com.cloudsync.service;

import com.cloudsync.dto.FolderDto;
import com.cloudsync.entity.Folder;
import com.cloudsync.entity.User;
import com.cloudsync.exception.FolderNotFoundException;
import com.cloudsync.repository.FolderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class FolderService {

    private final FolderRepository folderRepository;

    public FolderService(FolderRepository folderRepository) {
        this.folderRepository = folderRepository;
    }

    public FolderDto createFolder(String name, User user, Long parentId) {
        Folder parent = null;
        if (parentId != null) {
            parent = folderRepository.findByIdAndOwner(parentId, user)
                    .orElseThrow(() -> new FolderNotFoundException("Parent folder not found"));
        }

        // Check if folder with same name exists
        if (folderRepository.existsByNameAndOwnerAndParent(name, user, parent)) {
            throw new IllegalArgumentException("Folder with name '" + name + "' already exists");
        }

        Folder folder = new Folder(name, user, parent);
        return FolderDto.fromEntity(folderRepository.save(folder));
    }

    public FolderDto getFolder(Long folderId, User user) {
        Folder folder = folderRepository.findByIdAndOwner(folderId, user)
                .orElseThrow(() -> new FolderNotFoundException("Folder not found"));
        return FolderDto.fromEntityWithContents(folder);
    }

    public List<FolderDto> getRootFolders(User user) {
        return folderRepository.findByOwnerAndParentIsNull(user).stream()
                .map(FolderDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<FolderDto> getSubfolders(Long parentId, User user) {
        Folder parent = folderRepository.findByIdAndOwner(parentId, user)
                .orElseThrow(() -> new FolderNotFoundException("Parent folder not found"));
        return folderRepository.findByOwnerAndParent(user, parent).stream()
                .map(FolderDto::fromEntity)
                .collect(Collectors.toList());
    }

    public FolderDto renameFolder(Long folderId, User user, String newName) {
        Folder folder = folderRepository.findByIdAndOwner(folderId, user)
                .orElseThrow(() -> new FolderNotFoundException("Folder not found"));

        // Check if folder with same name exists at same level
        if (folderRepository.existsByNameAndOwnerAndParent(newName, user, folder.getParent())) {
            throw new IllegalArgumentException("Folder with name '" + newName + "' already exists");
        }

        folder.setName(newName);
        return FolderDto.fromEntity(folderRepository.save(folder));
    }

    public FolderDto moveFolder(Long folderId, User user, Long targetParentId) {
        Folder folder = folderRepository.findByIdAndOwner(folderId, user)
                .orElseThrow(() -> new FolderNotFoundException("Folder not found"));

        Folder targetParent = null;
        if (targetParentId != null) {
            targetParent = folderRepository.findByIdAndOwner(targetParentId, user)
                    .orElseThrow(() -> new FolderNotFoundException("Target folder not found"));

            // Prevent moving folder into itself or its children
            if (isDescendant(targetParent, folder)) {
                throw new IllegalArgumentException("Cannot move folder into itself or its children");
            }
        }

        // Check if folder with same name exists at target level
        if (folderRepository.existsByNameAndOwnerAndParent(folder.getName(), user, targetParent)) {
            throw new IllegalArgumentException("Folder with name '" + folder.getName() + "' already exists at target location");
        }

        folder.setParent(targetParent);
        return FolderDto.fromEntity(folderRepository.save(folder));
    }

    public void deleteFolder(Long folderId, User user) {
        Folder folder = folderRepository.findByIdAndOwner(folderId, user)
                .orElseThrow(() -> new FolderNotFoundException("Folder not found"));
        folderRepository.delete(folder);
    }

    private boolean isDescendant(Folder potentialDescendant, Folder ancestor) {
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
