package com.apiwise.analytics;

import com.apiwise.analytics.dto.AnalyticsDto;
import com.apiwise.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workspaces/{workspaceId}/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics & Dashboard", description = "Real-time metrics, pass rates, and trends")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping
    @PreAuthorize("@workspaceSecurity.hasAccess(#workspaceId, 'VIEWER')")
    @Operation(summary = "Get workspace aggregated testing metrics and performance analytics")
    public ResponseEntity<ApiResponse<AnalyticsDto>> getAnalytics(@PathVariable UUID workspaceId) {
        AnalyticsDto analytics = analyticsService.getWorkspaceAnalytics(workspaceId);
        return ResponseEntity.ok(ApiResponse.success(analytics));
    }
}
