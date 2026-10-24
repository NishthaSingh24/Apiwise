package com.apiwise.history;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AssertionResultRepository extends JpaRepository<AssertionResult, UUID> {
    List<AssertionResult> findByTestRunItemId(UUID testRunItemId);

    @Query("SELECT ar.assertionType, COUNT(ar) FROM AssertionResult ar " +
           "WHERE ar.testRunItem.testRun.workspace.id = :workspaceId AND ar.passed = false " +
           "GROUP BY ar.assertionType")
    List<Object[]> countFailuresByType(@Param("workspaceId") UUID workspaceId);

    @Query("SELECT COUNT(ar) FROM AssertionResult ar WHERE ar.testRunItem.testRun.workspace.id = :workspaceId AND ar.passed = true")
    long countPassedAssertions(@Param("workspaceId") UUID workspaceId);

    @Query("SELECT COUNT(ar) FROM AssertionResult ar WHERE ar.testRunItem.testRun.workspace.id = :workspaceId")
    long countTotalAssertions(@Param("workspaceId") UUID workspaceId);
}
