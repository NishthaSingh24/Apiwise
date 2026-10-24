package com.apiwise.history;

import com.apiwise.common.ApiResponse;
import com.apiwise.history.dto.TestRunDto;
import com.apiwise.report.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@Tag(name = "Execution History", description = "Query past test runs and detailed execution logs")
public class HistoryController {

    private final ReportService reportService;

    @GetMapping("/api/v1/workspaces/{workspaceId}/runs")
    @Operation(summary = "Get execution history for workspace")
    public ResponseEntity<ApiResponse<List<TestRunDto>>> getWorkspaceRuns(@PathVariable UUID workspaceId) {
        List<TestRunDto> runs = reportService.getWorkspaceRuns(workspaceId);
        return ResponseEntity.ok(ApiResponse.success(runs));
    }

    @GetMapping("/api/v1/runs/{runId}")
    @Operation(summary = "Get detailed execution report for a specific test run")
    public ResponseEntity<ApiResponse<TestRunDto>> getRunDetails(@PathVariable UUID runId) {
        TestRunDto run = reportService.getRunDetails(runId);
        return ResponseEntity.ok(ApiResponse.success(run));
    }
}
