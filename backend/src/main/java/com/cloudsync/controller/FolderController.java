package com.cloudsync.controller;

import com.cloudsync.dto.ApiResponse;
import com.cloudsync.dto.FolderDto;
import com.cloudsync.entity.User;
import com.cloudsync.security.CustomUserDetailsService;
import com.cloudsync.service.FolderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/folders")
@Tag(name = "Folders", description = "Folder management APIs")
@SecurityRequirement(name = "bearerAuth")
public class FolderController {

    private final FolderService folderService;
    private final CustomUserDetailsService userDetailsService;

    public FolderController(FolderService folderService, CustomUserDetailsService userDetailsService) {
        this.folderService = folderService;
        this.userDetailsService = userDetailsService;
    }

    @PostMapping
    @Operation(summary = "Create folder", description = "Create a new folder")
    public ResponseEntity<ApiResponse<FolderDto>> createFolder(
            @RequestParam("name") String name,
            @RequestParam(value = "parentId", required = false) Long parentId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userDetailsService.getUserByUsername(userDetails.getUsername());
        FolderDto folder = folderService.createFolder(name, user, parentId);
        return ResponseEntity.ok(ApiResponse.success("Folder created successfully", folder));
    }

    @GetMapping
    @Operation(summary = "Get root folders", description = "Get all root level folders")
    public ResponseEntity<ApiResponse<List<FolderDto>>> getRootFolders(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userDetailsService.getUserByUsername(userDetails.getUsername());
        List<FolderDto> folders = folderService.getRootFolders(user);
        return ResponseEntity.ok(ApiResponse.success("Folders retrieved successfully", folders));
    }

    @GetMapping("/{folderId}")
    @Operation(summary = "Get folder", description = "Get folder details with contents")
    public ResponseEntity<ApiResponse<FolderDto>> getFolder(
            @PathVariable Long folderId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userDetailsService.getUserByUsername(userDetails.getUsername());
        FolderDto folder = folderService.getFolder(folderId, user);
        return ResponseEntity.ok(ApiResponse.success("Folder retrieved successfully", folder));
    }

    @GetMapping("/{folderId}/subfolders")
    @Operation(summary = "Get subfolders", description = "Get all subfolders of a folder")
    public ResponseEntity<ApiResponse<List<FolderDto>>> getSubfolders(
            @PathVariable Long folderId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userDetailsService.getUserByUsername(userDetails.getUsername());
        List<FolderDto> subfolders = folderService.getSubfolders(folderId, user);
        return ResponseEntity.ok(ApiResponse.success("Subfolders retrieved successfully", subfolders));
    }

    @PutMapping("/{folderId}/rename")
    @Operation(summary = "Rename folder", description = "Rename a folder")
    public ResponseEntity<ApiResponse<FolderDto>> renameFolder(
            @PathVariable Long folderId,
            @RequestParam("name") String newName,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userDetailsService.getUserByUsername(userDetails.getUsername());
        FolderDto renamedFolder = folderService.renameFolder(folderId, user, newName);
        return ResponseEntity.ok(ApiResponse.success("Folder renamed successfully", renamedFolder));
    }

    @PutMapping("/{folderId}/move")
    @Operation(summary = "Move folder", description = "Move folder to a different parent folder")
    public ResponseEntity<ApiResponse<FolderDto>> moveFolder(
            @PathVariable Long folderId,
            @RequestParam(value = "parentId", required = false) Long targetParentId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userDetailsService.getUserByUsername(userDetails.getUsername());
        FolderDto movedFolder = folderService.moveFolder(folderId, user, targetParentId);
        return ResponseEntity.ok(ApiResponse.success("Folder moved successfully", movedFolder));
    }

    @DeleteMapping("/{folderId}")
    @Operation(summary = "Delete folder", description = "Delete a folder and all its contents")
    public ResponseEntity<ApiResponse<Void>> deleteFolder(
            @PathVariable Long folderId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userDetailsService.getUserByUsername(userDetails.getUsername());
        folderService.deleteFolder(folderId, user);
        return ResponseEntity.ok(ApiResponse.success("Folder deleted successfully"));
    }
}
