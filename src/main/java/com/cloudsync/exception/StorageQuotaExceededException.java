package com.cloudsync.exception;

public class StorageQuotaExceededException extends RuntimeException {

    public StorageQuotaExceededException(String message) {
        super(message);
    }

    public StorageQuotaExceededException(String message, Throwable cause) {
        super(message, cause);
    }
}
