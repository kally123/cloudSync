package com.cloudsync.controller;

import com.cloudsync.dto.ApiResponse;
import com.cloudsync.dto.FileDto;
import com.cloudsync.dto.StorageStats;
import com.cloudsync.entity.StoredFile;
import com.cloudsync.entity.User;
import com.cloudsync.security.CustomUserDetailsService;
import com.cloudsync.service.FileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/files")
@Tag(name = "Files", description = "File management APIs")
@SecurityRequirement(name = "bearerAuth")
public class FileController {

    private final FileService fileService;
    private final CustomUserDetailsService userDetailsService;

    public FileController(FileService fileService, CustomUserDetailsService userDetailsService) {
        this.fileService = fileService;
        this.userDetailsService = userDetailsService;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload a file", description = "Upload a single file to the cloud storage")
    public ResponseEntity<ApiResponse<FileDto>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folderId", required = false) Long folderId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userDetailsService.getUserByUsername(userDetails.getUsername());
        FileDto uploadedFile = fileService.uploadFile(file, user, folderId);
        return ResponseEntity.ok(ApiResponse.success("File uploaded successfully", uploadedFile));
    }

    @PostMapping(value = "/upload/multiple", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload multiple files", description = "Upload multiple files at once")
    public ResponseEntity<ApiResponse<List<FileDto>>> uploadFiles(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam(value = "folderId", required = false) Long folderId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userDetailsService.getUserByUsername(userDetails.getUsername());
        List<FileDto> uploadedFiles = fileService.uploadFiles(files, user, folderId);
        return ResponseEntity.ok(ApiResponse.success("Files uploaded successfully", uploadedFiles));
    }

    @GetMapping
    @Operation(summary = "Get all files", description = "Retrieve all files belonging to the user")
    public ResponseEntity<ApiResponse<List<FileDto>>> getAllFiles(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userDetailsService.getUserByUsername(userDetails.getUsername());
        List<FileDto> files = fileService.getAllFiles(user);
        return ResponseEntity.ok(ApiResponse.success("Files retrieved successfully", files));
    }

    @GetMapping("/root")
    @Operation(summary = "Get root files", description = "Retrieve files in root directory (not in any folder)")
    public ResponseEntity<ApiResponse<List<FileDto>>> getRootFiles(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userDetailsService.getUserByUsername(userDetails.getUsername());
        List<FileDto> files = fileService.getFilesInRoot(user);
        return ResponseEntity.ok(ApiResponse.success("Root files retrieved successfully", files));
    }

    @GetMapping("/folder/{folderId}")
    @Operation(summary = "Get files in folder", description = "Retrieve all files in a specific folder")
    public ResponseEntity<ApiResponse<List<FileDto>>> getFilesInFolder(
            @PathVariable Long folderId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userDetailsService.getUserByUsername(userDetails.getUsername());
        List<FileDto> files = fileService.getFilesInFolder(user, folderId);
        return ResponseEntity.ok(ApiResponse.success("Files retrieved successfully", files));
    }

    @GetMapping("/{fileId}")
    @Operation(summary = "Get file details", description = "Retrieve details of a specific file")
    public ResponseEntity<ApiResponse<FileDto>> getFile(
            @PathVariable Long fileId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userDetailsService.getUserByUsername(userDetails.getUsername());
        FileDto file = fileService.getFile(fileId, user);
        return ResponseEntity.ok(ApiResponse.success("File retrieved successfully", file));
    }

    @GetMapping("/{fileId}/download")
    @Operation(summary = "Download file", description = "Download a specific file")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable Long fileId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userDetailsService.getUserByUsername(userDetails.getUsername());
        StoredFile storedFile = fileService.getStoredFile(fileId, user);
        Resource resource = fileService.downloadFile(fileId, user);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(
                        storedFile.getContentType() != null ? storedFile.getContentType() : "application/octet-stream"))
                .header(HttpHeaders.CONTENT_DISPOSITION, 
                        "attachment; filename=\"" + storedFile.getOriginalName() + "\"")
                .body(resource);
    }

    @DeleteMapping("/{fileId}")
    @Operation(summary = "Delete file", description = "Delete a specific file")
    public ResponseEntity<ApiResponse<Void>> deleteFile(
            @PathVariable Long fileId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userDetailsService.getUserByUsername(userDetails.getUsername());
        fileService.deleteFile(fileId, user);
        return ResponseEntity.ok(ApiResponse.success("File deleted successfully"));
    }

    @PutMapping("/{fileId}/rename")
    @Operation(summary = "Rename file", description = "Rename a specific file")
    public ResponseEntity<ApiResponse<FileDto>> renameFile(
            @PathVariable Long fileId,
            @RequestParam("name") String newName,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userDetailsService.getUserByUsername(userDetails.getUsername());
        FileDto renamedFile = fileService.renameFile(fileId, user, newName);
        return ResponseEntity.ok(ApiResponse.success("File renamed successfully", renamedFile));
    }

    @PutMapping("/{fileId}/move")
    @Operation(summary = "Move file", description = "Move file to a different folder")
    public ResponseEntity<ApiResponse<FileDto>> moveFile(
            @PathVariable Long fileId,
            @RequestParam(value = "folderId", required = false) Long targetFolderId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userDetailsService.getUserByUsername(userDetails.getUsername());
        FileDto movedFile = fileService.moveFile(fileId, user, targetFolderId);
        return ResponseEntity.ok(ApiResponse.success("File moved successfully", movedFile));
    }

    @PostMapping("/{fileId}/share")
    @Operation(summary = "Share file", description = "Generate a public share link for the file")
    public ResponseEntity<ApiResponse<FileDto>> shareFile(
            @PathVariable Long fileId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userDetailsService.getUserByUsername(userDetails.getUsername());
        FileDto sharedFile = fileService.shareFile(fileId, user);
        return ResponseEntity.ok(ApiResponse.success("File shared successfully", sharedFile));
    }

    @DeleteMapping("/{fileId}/share")
    @Operation(summary = "Unshare file", description = "Remove public sharing from file")
    public ResponseEntity<ApiResponse<FileDto>> unshareFile(
            @PathVariable Long fileId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userDetailsService.getUserByUsername(userDetails.getUsername());
        FileDto unsharedFile = fileService.unshareFile(fileId, user);
        return ResponseEntity.ok(ApiResponse.success("File unshared successfully", unsharedFile));
    }

    @GetMapping("/search")
    @Operation(summary = "Search files", description = "Search files by name")
    public ResponseEntity<ApiResponse<List<FileDto>>> searchFiles(
            @RequestParam("q") String query,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userDetailsService.getUserByUsername(userDetails.getUsername());
        List<FileDto> files = fileService.searchFiles(user, query);
        return ResponseEntity.ok(ApiResponse.success("Search completed", files));
    }

    @GetMapping("/stats")
    @Operation(summary = "Get storage stats", description = "Get storage usage statistics")
    public ResponseEntity<ApiResponse<StorageStats>> getStorageStats(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userDetailsService.getUserByUsername(userDetails.getUsername());
        StorageStats stats = fileService.getStorageStats(user);
        return ResponseEntity.ok(ApiResponse.success("Stats retrieved successfully", stats));
    }
}
