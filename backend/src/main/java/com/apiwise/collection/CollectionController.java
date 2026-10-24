package com.apiwise.collection;

import com.apiwise.collection.dto.CollectionDto;
import com.apiwise.collection.dto.CreateCollectionRequest;
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
@RequestMapping("/api/v1/projects/{projectId}/collections")
@RequiredArgsConstructor
@Tag(name = "Collections", description = "Collections and folder hierarchies management")
public class CollectionController {

    private final CollectionService collectionService;

    @GetMapping
    @Operation(summary = "Get collection tree for project")
    public ResponseEntity<ApiResponse<List<CollectionDto>>> getCollections(@PathVariable UUID projectId) {
        List<CollectionDto> collections = collectionService.getProjectCollections(projectId);
        return ResponseEntity.ok(ApiResponse.success(collections));
    }

    @GetMapping("/{collectionId}")
    @Operation(summary = "Get collection by ID")
    public ResponseEntity<ApiResponse<CollectionDto>> getCollection(
            @PathVariable UUID projectId,
            @PathVariable UUID collectionId) {
        CollectionDto collection = collectionService.getCollection(projectId, collectionId);
        return ResponseEntity.ok(ApiResponse.success(collection));
    }

    @PostMapping
    @Operation(summary = "Create a collection or folder in project")
    public ResponseEntity<ApiResponse<CollectionDto>> createCollection(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateCollectionRequest request) {
        CollectionDto collection = collectionService.createCollection(projectId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Collection created successfully", collection));
    }

    @PutMapping("/{collectionId}")
    @Operation(summary = "Update collection details")
    public ResponseEntity<ApiResponse<CollectionDto>> updateCollection(
            @PathVariable UUID projectId,
            @PathVariable UUID collectionId,
            @Valid @RequestBody CreateCollectionRequest request) {
        CollectionDto collection = collectionService.updateCollection(projectId, collectionId, request);
        return ResponseEntity.ok(ApiResponse.success("Collection updated successfully", collection));
    }

    @DeleteMapping("/{collectionId}")
    @Operation(summary = "Delete collection and its requests")
    public ResponseEntity<ApiResponse<Void>> deleteCollection(
            @PathVariable UUID projectId,
            @PathVariable UUID collectionId) {
        collectionService.deleteCollection(projectId, collectionId);
        return ResponseEntity.ok(ApiResponse.success("Collection deleted successfully", null));
    }
}
