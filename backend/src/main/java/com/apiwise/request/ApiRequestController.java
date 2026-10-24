package com.apiwise.request;

import com.apiwise.common.ApiResponse;
import com.apiwise.request.dto.ApiRequestDto;
import com.apiwise.request.dto.SaveApiRequest;
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
@RequiredArgsConstructor
@Tag(name = "API Requests", description = "CRUD and configuration for saved API requests")
public class ApiRequestController {

    private final ApiRequestService requestService;

    @GetMapping("/api/v1/collections/{collectionId}/requests")
    @Operation(summary = "Get all requests in collection")
    public ResponseEntity<ApiResponse<List<ApiRequestDto>>> getCollectionRequests(@PathVariable UUID collectionId) {
        List<ApiRequestDto> requests = requestService.getCollectionRequests(collectionId);
        return ResponseEntity.ok(ApiResponse.success(requests));
    }

    @PostMapping("/api/v1/collections/{collectionId}/requests")
    @Operation(summary = "Create a new saved request in collection")
    public ResponseEntity<ApiResponse<ApiRequestDto>> createRequest(
            @PathVariable UUID collectionId,
            @Valid @RequestBody SaveApiRequest request) {
        ApiRequestDto created = requestService.createRequest(collectionId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Request created successfully", created));
    }

    @GetMapping("/api/v1/requests/{requestId}")
    @Operation(summary = "Get request by ID")
    public ResponseEntity<ApiResponse<ApiRequestDto>> getRequest(@PathVariable UUID requestId) {
        ApiRequestDto request = requestService.getRequest(requestId);
        return ResponseEntity.ok(ApiResponse.success(request));
    }

    @PutMapping("/api/v1/requests/{requestId}")
    @Operation(summary = "Update request details, parameters, headers, and body")
    public ResponseEntity<ApiResponse<ApiRequestDto>> updateRequest(
            @PathVariable UUID requestId,
            @Valid @RequestBody SaveApiRequest request) {
        ApiRequestDto updated = requestService.updateRequest(requestId, request);
        return ResponseEntity.ok(ApiResponse.success("Request updated successfully", updated));
    }

    @PostMapping("/api/v1/requests/{requestId}/duplicate")
    @Operation(summary = "Duplicate request and its assertions")
    public ResponseEntity<ApiResponse<ApiRequestDto>> duplicateRequest(@PathVariable UUID requestId) {
        ApiRequestDto duplicated = requestService.duplicateRequest(requestId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Request duplicated successfully", duplicated));
    }

    @DeleteMapping("/api/v1/requests/{requestId}")
    @Operation(summary = "Delete request and associated assertions")
    public ResponseEntity<ApiResponse<Void>> deleteRequest(@PathVariable UUID requestId) {
        requestService.deleteRequest(requestId);
        return ResponseEntity.ok(ApiResponse.success("Request deleted successfully", null));
    }
}
