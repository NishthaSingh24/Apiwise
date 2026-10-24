package com.apiwise.assertion;

import com.apiwise.assertion.dto.AssertionDto;
import com.apiwise.assertion.dto.SaveAssertionRequest;
import com.apiwise.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/requests/{requestId}/assertions")
@RequiredArgsConstructor
@Tag(name = "Assertions", description = "Automated test assertion rules for API requests")
public class AssertionController {

    private final AssertionService assertionService;

    @GetMapping
    @Operation(summary = "Get all assertions for request")
    public ResponseEntity<ApiResponse<List<AssertionDto>>> getAssertions(@PathVariable UUID requestId) {
        List<AssertionDto> assertions = assertionService.getRequestAssertions(requestId);
        return ResponseEntity.ok(ApiResponse.success(assertions));
    }

    @PostMapping
    @Operation(summary = "Add an automated assertion to request")
    public ResponseEntity<ApiResponse<AssertionDto>> createAssertion(
            @PathVariable UUID requestId,
            @Valid @RequestBody SaveAssertionRequest request) {
        AssertionDto assertion = assertionService.createAssertion(requestId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Assertion added successfully", assertion));
    }

    @PutMapping("/{assertionId}")
    @Operation(summary = "Update an assertion")
    public ResponseEntity<ApiResponse<AssertionDto>> updateAssertion(
            @PathVariable UUID requestId,
            @PathVariable UUID assertionId,
            @Valid @RequestBody SaveAssertionRequest request) {
        AssertionDto assertion = assertionService.updateAssertion(requestId, assertionId, request);
        return ResponseEntity.ok(ApiResponse.success("Assertion updated successfully", assertion));
    }

    @DeleteMapping("/{assertionId}")
    @Operation(summary = "Delete an assertion")
    public ResponseEntity<ApiResponse<Void>> deleteAssertion(
            @PathVariable UUID requestId,
            @PathVariable UUID assertionId) {
        assertionService.deleteAssertion(requestId, assertionId);
        return ResponseEntity.ok(ApiResponse.success("Assertion deleted successfully", null));
    }
}
