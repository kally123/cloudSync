package com.cloudsync.dto;

public class StorageStats {

    private long usedStorage;
    private long maxStorage;
    private long availableStorage;
    private int totalFiles;
    private int totalFolders;
    private double usedPercentage;

    public StorageStats() {}

    public StorageStats(long usedStorage, long maxStorage, int totalFiles, int totalFolders) {
        this.usedStorage = usedStorage;
        this.maxStorage = maxStorage;
        this.availableStorage = maxStorage - usedStorage;
        this.totalFiles = totalFiles;
        this.totalFolders = totalFolders;
        this.usedPercentage = maxStorage > 0 ? (usedStorage * 100.0 / maxStorage) : 0;
    }

    // Getters and Setters
    public long getUsedStorage() {
        return usedStorage;
    }

    public void setUsedStorage(long usedStorage) {
        this.usedStorage = usedStorage;
    }

    public long getMaxStorage() {
        return maxStorage;
    }

    public void setMaxStorage(long maxStorage) {
        this.maxStorage = maxStorage;
    }

    public long getAvailableStorage() {
        return availableStorage;
    }

    public void setAvailableStorage(long availableStorage) {
        this.availableStorage = availableStorage;
    }

    public int getTotalFiles() {
        return totalFiles;
    }

    public void setTotalFiles(int totalFiles) {
        this.totalFiles = totalFiles;
    }

    public int getTotalFolders() {
        return totalFolders;
    }

    public void setTotalFolders(int totalFolders) {
        this.totalFolders = totalFolders;
    }

    public double getUsedPercentage() {
        return usedPercentage;
    }

    public void setUsedPercentage(double usedPercentage) {
        this.usedPercentage = usedPercentage;
    }

    public String getFormattedUsedStorage() {
        return formatBytes(usedStorage);
    }

    public String getFormattedMaxStorage() {
        return formatBytes(maxStorage);
    }

    public String getFormattedAvailableStorage() {
        return formatBytes(availableStorage);
    }

    private String formatBytes(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.2f KB", bytes / 1024.0);
        if (bytes < 1024 * 1024 * 1024) return String.format("%.2f MB", bytes / (1024.0 * 1024));
        return String.format("%.2f GB", bytes / (1024.0 * 1024 * 1024));
    }
}
