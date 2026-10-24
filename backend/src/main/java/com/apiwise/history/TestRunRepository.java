package com.apiwise.history;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TestRunRepository extends JpaRepository<TestRun, UUID> {
    List<TestRun> findByWorkspaceIdOrderByCreatedAtDesc(UUID workspaceId);
    Page<TestRun> findByWorkspaceIdOrderByCreatedAtDesc(UUID workspaceId, Pageable pageable);
    Optional<TestRun> findByIdAndWorkspaceId(UUID id, UUID workspaceId);
    List<TestRun> findByCollectionIdOrderByCreatedAtDesc(UUID collectionId);

    long countByWorkspaceId(UUID workspaceId);

    @Query("SELECT COUNT(r) FROM TestRun r WHERE r.workspace.id = :workspaceId AND r.status = 'COMPLETED' AND r.failedRequests = 0")
    long countSuccessfulRunsByWorkspaceId(@Param("workspaceId") UUID workspaceId);

    @Query("SELECT r FROM TestRun r WHERE r.workspace.id = :workspaceId AND r.createdAt >= :since ORDER BY r.createdAt ASC")
    List<TestRun> findRecentRuns(@Param("workspaceId") UUID workspaceId, @Param("since") Instant since);
}
