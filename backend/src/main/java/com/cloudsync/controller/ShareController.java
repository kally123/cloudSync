package com.cloudsync.controller;

import com.cloudsync.entity.StoredFile;
import com.cloudsync.service.FileService;
import com.cloudsync.service.StorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/share")
@Tag(name = "Public Sharing", description = "Public file sharing APIs")
public class ShareController {

    private final FileService fileService;
    private final StorageService storageService;

    public ShareController(FileService fileService, StorageService storageService) {
        this.fileService = fileService;
        this.storageService = storageService;
    }

    @GetMapping("/{shareToken}")
    @Operation(summary = "Download shared file", description = "Download a publicly shared file using share token")
    public ResponseEntity<Resource> downloadSharedFile(@PathVariable String shareToken) {
        StoredFile file = fileService.getSharedFile(shareToken);
        
        if (!file.isPublic()) {
            return ResponseEntity.notFound().build();
        }

        file.incrementDownloadCount();
        Resource resource = storageService.loadAsResource(file);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(
                        file.getContentType() != null ? file.getContentType() : "application/octet-stream"))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + file.getOriginalName() + "\"")
                .body(resource);
    }

    @GetMapping("/{shareToken}/info")
    @Operation(summary = "Get shared file info", description = "Get information about a shared file")
    public ResponseEntity<?> getSharedFileInfo(@PathVariable String shareToken) {
        StoredFile file = fileService.getSharedFile(shareToken);
        
        if (!file.isPublic()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(new SharedFileInfo(
                file.getOriginalName(),
                file.getContentType(),
                file.getSize(),
                file.getDownloadCount()
        ));
    }

    public record SharedFileInfo(String name, String contentType, long size, long downloadCount) {}
}
