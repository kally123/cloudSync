package com.cloudsync.repository;

import com.cloudsync.entity.Folder;
import com.cloudsync.entity.StoredFile;
import com.cloudsync.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FileRepository extends JpaRepository<StoredFile, Long> {
    
    List<StoredFile> findByOwner(User owner);
    
    List<StoredFile> findByOwnerAndFolderIsNull(User owner);
    
    List<StoredFile> findByOwnerAndFolder(User owner, Folder folder);
    
    Optional<StoredFile> findByIdAndOwner(Long id, User owner);
    
    Optional<StoredFile> findByShareToken(String shareToken);
    
    @Query("SELECT f FROM StoredFile f WHERE f.owner = :owner AND f.folder.id = :folderId")
    List<StoredFile> findByOwnerAndFolderId(@Param("owner") User owner, @Param("folderId") Long folderId);
    
    @Query("SELECT COALESCE(SUM(f.size), 0) FROM StoredFile f WHERE f.owner = :owner")
    long calculateTotalStorageByOwner(@Param("owner") User owner);
    
    @Query("SELECT f FROM StoredFile f WHERE f.owner = :owner AND LOWER(f.originalName) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<StoredFile> searchByName(@Param("owner") User owner, @Param("query") String query);
    
    boolean existsByOriginalNameAndOwnerAndFolder(String originalName, User owner, Folder folder);
    
    List<StoredFile> findByIsPublicTrue();
}
