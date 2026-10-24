package com.apiwise.workspace;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkspaceRepository extends JpaRepository<Workspace, UUID> {
    Optional<Workspace> findBySlug(String slug);
    boolean existsBySlug(String slug);
    boolean existsByIdAndOwnerId(UUID id, UUID ownerId);

    @Query("SELECT w FROM Workspace w WHERE w.owner.id = :userId OR w.id IN " +
           "(SELECT wm.workspace.id FROM WorkspaceMember wm WHERE wm.user.id = :userId) " +
           "ORDER BY w.createdAt DESC")
    List<Workspace> findAllUserAccessibleWorkspaces(@Param("userId") UUID userId);
}
