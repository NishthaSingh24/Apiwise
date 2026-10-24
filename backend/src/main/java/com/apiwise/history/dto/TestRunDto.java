package com.apiwise.history.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestRunDto {
    private UUID id;
    private UUID workspaceId;
    private UUID projectId;
    private String projectName;
    private UUID collectionId;
    private String collectionName;
    private UUID environmentId;
    private String environmentName;
    private String status;
    private int totalRequests;
    private int passedRequests;
    private int failedRequests;
    private int totalAssertions;
    private int passedAssertions;
    private int failedAssertions;
    private long totalDurationMs;
    private String triggeredByName;
    private Instant startedAt;
    private Instant completedAt;
    private Instant createdAt;
    @Builder.Default
    private List<TestRunItemDto> items = new ArrayList<>();
}
