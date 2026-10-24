package com.apiwise.environment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EnvironmentRepository extends JpaRepository<Environment, UUID> {
    List<Environment> findByWorkspaceIdOrderByCreatedAtAsc(UUID workspaceId);
    Optional<Environment> findByWorkspaceIdAndIsDefaultTrue(UUID workspaceId);
    Optional<Environment> findByIdAndWorkspaceId(UUID id, UUID workspaceId);
}
