package com.apiwise.runner;

import com.apiwise.common.ApiResponse;
import com.apiwise.history.dto.TestRunDto;
import com.apiwise.runner.dto.RunCollectionRequest;
import com.apiwise.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/collections/{collectionId}/run")
@RequiredArgsConstructor
@Tag(name = "Collection Runner", description = "Execute entire API collections and test suites")
public class RunnerController {

    private final CollectionRunnerService runnerService;

    @PostMapping
    @Operation(summary = "Run all requests in a collection and evaluate automated assertions")
    public ResponseEntity<ApiResponse<TestRunDto>> runCollection(
            @PathVariable UUID collectionId,
            @RequestBody(required = false) RunCollectionRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID userId = principal != null ? principal.getId() : null;
        TestRunDto result = runnerService.runCollection(collectionId, request, userId);
        return ResponseEntity.ok(ApiResponse.success("Collection execution completed", result));
    }
}
