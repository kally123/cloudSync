package com.cloudsync.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "cloudsync.storage")
public class StorageConfig {
    
    private String path = "./storage";
    private long maxUserStorage = 10737418240L; // 10 GB

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public long getMaxUserStorage() {
        return maxUserStorage;
    }

    public void setMaxUserStorage(long maxUserStorage) {
        this.maxUserStorage = maxUserStorage;
    }
}
