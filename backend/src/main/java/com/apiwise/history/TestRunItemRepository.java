package com.apiwise.history;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TestRunItemRepository extends JpaRepository<TestRunItem, UUID> {
    List<TestRunItem> findByTestRunIdOrderByExecutedAtAsc(UUID testRunId);

    @Query("SELECT AVG(tri.responseTimeMs) FROM TestRunItem tri WHERE tri.testRun.workspace.id = :workspaceId AND tri.responseTimeMs IS NOT NULL")
    Double getAverageResponseTime(@Param("workspaceId") UUID workspaceId);

    @Query("SELECT COUNT(tri) FROM TestRunItem tri WHERE tri.testRun.workspace.id = :workspaceId")
    long countTotalRequestsExecuted(@Param("workspaceId") UUID workspaceId);
}
