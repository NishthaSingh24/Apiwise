package com.apiwise.environment;

import com.apiwise.common.ApiResponse;
import com.apiwise.environment.dto.EnvironmentDto;
import com.apiwise.environment.dto.SaveEnvironmentRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workspaces/{workspaceId}/environments")
@RequiredArgsConstructor
@Tag(name = "Environments", description = "Workspace environment and variable configuration")
public class EnvironmentController {

    private final EnvironmentService environmentService;

    @GetMapping
    @PreAuthorize("@workspaceSecurity.hasAccess(#workspaceId, 'VIEWER')")
    @Operation(summary = "Get all environments in workspace")
    public ResponseEntity<ApiResponse<List<EnvironmentDto>>> getEnvironments(@PathVariable UUID workspaceId) {
        List<EnvironmentDto> environments = environmentService.getWorkspaceEnvironments(workspaceId);
        return ResponseEntity.ok(ApiResponse.success(environments));
    }

    @GetMapping("/{environmentId}")
    @PreAuthorize("@workspaceSecurity.hasAccess(#workspaceId, 'VIEWER')")
    @Operation(summary = "Get environment details by ID")
    public ResponseEntity<ApiResponse<EnvironmentDto>> getEnvironment(
            @PathVariable UUID workspaceId,
            @PathVariable UUID environmentId) {
        EnvironmentDto environment = environmentService.getEnvironment(workspaceId, environmentId);
        return ResponseEntity.ok(ApiResponse.success(environment));
    }

    @PostMapping
    @PreAuthorize("@workspaceSecurity.hasAccess(#workspaceId, 'MEMBER')")
    @Operation(summary = "Create a new environment with variables")
    public ResponseEntity<ApiResponse<EnvironmentDto>> createEnvironment(
            @PathVariable UUID workspaceId,
            @Valid @RequestBody SaveEnvironmentRequest request) {
        EnvironmentDto environment = environmentService.createEnvironment(workspaceId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Environment created successfully", environment));
    }

    @PutMapping("/{environmentId}")
    @PreAuthorize("@workspaceSecurity.hasAccess(#workspaceId, 'MEMBER')")
    @Operation(summary = "Update environment details and variables")
    public ResponseEntity<ApiResponse<EnvironmentDto>> updateEnvironment(
            @PathVariable UUID workspaceId,
            @PathVariable UUID environmentId,
            @Valid @RequestBody SaveEnvironmentRequest request) {
        EnvironmentDto environment = environmentService.updateEnvironment(workspaceId, environmentId, request);
        return ResponseEntity.ok(ApiResponse.success("Environment updated successfully", environment));
    }

    @DeleteMapping("/{environmentId}")
    @PreAuthorize("@workspaceSecurity.hasAccess(#workspaceId, 'ADMIN')")
    @Operation(summary = "Delete environment")
    public ResponseEntity<ApiResponse<Void>> deleteEnvironment(
            @PathVariable UUID workspaceId,
            @PathVariable UUID environmentId) {
        environmentService.deleteEnvironment(workspaceId, environmentId);
        return ResponseEntity.ok(ApiResponse.success("Environment deleted successfully", null));
    }
}
