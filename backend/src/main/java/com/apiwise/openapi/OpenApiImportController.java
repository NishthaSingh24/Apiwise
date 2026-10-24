package com.apiwise.openapi;

import com.apiwise.collection.dto.CollectionDto;
import com.apiwise.common.ApiResponse;
import com.apiwise.openapi.dto.OpenApiImportRequest;
import com.apiwise.openapi.dto.OpenApiPreviewDto;
import com.apiwise.openapi.dto.OpenApiPreviewRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workspaces/{workspaceId}/openapi")
@RequiredArgsConstructor
@Tag(name = "OpenAPI Import", description = "Import OpenAPI 3.x specifications into saved test collections")
public class OpenApiImportController {

    private final OpenApiImportService importService;

    @PostMapping("/preview")
    @PreAuthorize("@workspaceSecurity.hasAccess(#workspaceId, 'VIEWER')")
    @Operation(summary = "Preview OpenAPI 3.x specification and inspect discoverable endpoints")
    public ResponseEntity<ApiResponse<OpenApiPreviewDto>> previewSpec(
            @PathVariable UUID workspaceId,
            @RequestBody OpenApiPreviewRequest request) {
        OpenApiPreviewDto preview = importService.parseAndPreview(request);
        return ResponseEntity.ok(ApiResponse.success(preview));
    }

    @PostMapping("/import")
    @PreAuthorize("@workspaceSecurity.hasAccess(#workspaceId, 'MEMBER')")
    @Operation(summary = "Import selected endpoints from specification into project collection")
    public ResponseEntity<ApiResponse<CollectionDto>> importEndpoints(
            @PathVariable UUID workspaceId,
            @Valid @RequestBody OpenApiImportRequest request) {
        CollectionDto collection = importService.importEndpoints(workspaceId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("OpenAPI endpoints successfully imported", collection));
    }
}
