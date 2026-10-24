package com.apiwise.analytics;

import com.apiwise.analytics.dto.AnalyticsDto;
import com.apiwise.history.AssertionResultRepository;
import com.apiwise.history.TestRun;
import com.apiwise.history.TestRunItemRepository;
import com.apiwise.history.TestRunRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final TestRunRepository testRunRepository;
    private final TestRunItemRepository testRunItemRepository;
    private final AssertionResultRepository assertionResultRepository;

    @Transactional(readOnly = true)
    public AnalyticsDto getWorkspaceAnalytics(UUID workspaceId) {
        long totalRuns = testRunRepository.countByWorkspaceId(workspaceId);
        long successfulRuns = testRunRepository.countSuccessfulRunsByWorkspaceId(workspaceId);
        long totalRequests = testRunItemRepository.countTotalRequestsExecuted(workspaceId);
        long totalAssertions = assertionResultRepository.countTotalAssertions(workspaceId);
        long passedAssertions = assertionResultRepository.countPassedAssertions(workspaceId);

        Double avgTime = testRunItemRepository.getAverageResponseTime(workspaceId);
        double averageResponseTimeMs = avgTime != null ? Math.round(avgTime * 10.0) / 10.0 : 0.0;

        double overallPassRate = 0.0;
        if (totalAssertions > 0) {
            overallPassRate = Math.round((passedAssertions * 1000.0) / totalAssertions) / 10.0;
        } else if (totalRuns > 0) {
            overallPassRate = Math.round((successfulRuns * 1000.0) / totalRuns) / 10.0;
        }

        // Failure breakdown
        Map<String, Long> failureBreakdown = new HashMap<>();
        List<Object[]> rawFailures = assertionResultRepository.countFailuresByType(workspaceId);
        for (Object[] row : rawFailures) {
            String type = (String) row[0];
            Long count = (Long) row[1];
            failureBreakdown.put(type, count);
        }

        // Recent trend for last 7 days
        Instant sevenDaysAgo = Instant.now().minus(7, ChronoUnit.DAYS);
        List<TestRun> recentRuns = testRunRepository.findRecentRuns(workspaceId, sevenDaysAgo);

        Map<String, AnalyticsDto.RunTrendPointDto> trendMap = new LinkedHashMap<>();
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        for (int i = 6; i >= 0; i--) {
            LocalDate d = LocalDate.now().minusDays(i);
            String dateStr = d.format(dtf);
            trendMap.put(dateStr, AnalyticsDto.RunTrendPointDto.builder()
                    .date(dateStr)
                    .runsCount(0)
                    .passedCount(0)
                    .failedCount(0)
                    .build());
        }

        for (TestRun r : recentRuns) {
            LocalDate runDate = r.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate();
            String dateStr = runDate.format(dtf);
            AnalyticsDto.RunTrendPointDto point = trendMap.get(dateStr);
            if (point != null) {
                point.setRunsCount(point.getRunsCount() + 1);
                if (r.getFailedRequests() == 0 && "COMPLETED".equalsIgnoreCase(r.getStatus())) {
                    point.setPassedCount(point.getPassedCount() + 1);
                } else {
                    point.setFailedCount(point.getFailedCount() + 1);
                }
            }
        }

        return AnalyticsDto.builder()
                .totalRuns(totalRuns)
                .successfulRuns(successfulRuns)
                .totalRequestsExecuted(totalRequests)
                .totalAssertions(totalAssertions)
                .passedAssertions(passedAssertions)
                .overallPassRate(overallPassRate)
                .averageResponseTimeMs(averageResponseTimeMs)
                .recentTrend(new ArrayList<>(trendMap.values()))
                .failureBreakdown(failureBreakdown)
                .build();
    }
}
