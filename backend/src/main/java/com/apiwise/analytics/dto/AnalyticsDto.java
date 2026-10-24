package com.apiwise.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsDto {
    private long totalRuns;
    private long successfulRuns;
    private long totalRequestsExecuted;
    private long totalAssertions;
    private long passedAssertions;
    private double overallPassRate;
    private double averageResponseTimeMs;

    @Builder.Default
    private List<RunTrendPointDto> recentTrend = new ArrayList<>();

    @Builder.Default
    private Map<String, Long> failureBreakdown = new HashMap<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RunTrendPointDto {
        private String date;
        private int runsCount;
        private int passedCount;
        private int failedCount;
    }
}
