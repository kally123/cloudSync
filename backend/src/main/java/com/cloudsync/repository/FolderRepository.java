package com.cloudsync.repository;

import com.cloudsync.entity.Folder;
import com.cloudsync.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FolderRepository extends JpaRepository<Folder, Long> {
    
    List<Folder> findByOwnerAndParentIsNull(User owner);
    
    List<Folder> findByOwnerAndParent(User owner, Folder parent);
    
    Optional<Folder> findByIdAndOwner(Long id, User owner);
    
    Optional<Folder> findByNameAndOwnerAndParent(String name, User owner, Folder parent);
    
    @Query("SELECT f FROM Folder f WHERE f.owner = :owner AND f.parent.id = :parentId")
    List<Folder> findByOwnerAndParentId(@Param("owner") User owner, @Param("parentId") Long parentId);
    
    boolean existsByNameAndOwnerAndParent(String name, User owner, Folder parent);
}
