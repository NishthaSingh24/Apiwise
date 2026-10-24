package com.apiwise.execution;

import com.apiwise.common.ApiResponse;
import com.apiwise.execution.dto.ExecuteRequestPayload;
import com.apiwise.execution.dto.ExecutionResultDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@Tag(name = "HTTP Execution Engine", description = "Execute single API requests or ad-hoc test executions")
public class ExecutionController {

    private final HttpExecutionService executionService;

    @PostMapping("/api/v1/requests/{requestId}/execute")
    @Operation(summary = "Execute saved request and evaluate assertions")
    public ResponseEntity<ApiResponse<ExecutionResultDto>> executeSavedRequest(
            @PathVariable UUID requestId,
            @RequestParam(required = false) UUID environmentId) {
        ExecutionResultDto result = executionService.executeSavedRequest(requestId, environmentId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/api/v1/requests/execute-ad-hoc")
    @Operation(summary = "Execute arbitrary HTTP request without saving")
    public ResponseEntity<ApiResponse<ExecutionResultDto>> executeAdHoc(
            @RequestBody ExecuteRequestPayload payload) {
        ExecutionResultDto result = executionService.executeAdHoc(payload);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
