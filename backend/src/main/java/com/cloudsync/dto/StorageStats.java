package com.cloudsync.dto;

/**
 * Immutable DTO representing user storage statistics.
 * Provides computed properties for available storage and usage percentage.
 */
public record StorageStats(
        long usedStorage,
        long maxStorage,
        long availableStorage,
        int totalFiles,
        int totalFolders,
        double usedPercentage
) {
    /**
     * Creates StorageStats with computed fields.
     */
    public StorageStats(long usedStorage, long maxStorage, int totalFiles, int totalFolders) {
        this(
                usedStorage,
                maxStorage,
                maxStorage - usedStorage,
                totalFiles,
                totalFolders,
                maxStorage > 0 ? (usedStorage * 100.0 / maxStorage) : 0
        );
    }

    /**
     * Returns human-readable used storage format.
     */
    public String formattedUsedStorage() {
        return formatBytes(usedStorage);
    }

    /**
     * Returns human-readable max storage format.
     */
    public String formattedMaxStorage() {
        return formatBytes(maxStorage);
    }

    /**
     * Returns human-readable available storage format.
     */
    public String formattedAvailableStorage() {
        return formatBytes(availableStorage);
    }

    private static String formatBytes(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return "%.2f KB".formatted(bytes / 1024.0);
        if (bytes < 1024 * 1024 * 1024) return "%.2f MB".formatted(bytes / (1024.0 * 1024));
        return "%.2f GB".formatted(bytes / (1024.0 * 1024 * 1024));
    }
}
