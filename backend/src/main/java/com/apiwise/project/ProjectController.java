package com.apiwise.project;

import com.apiwise.common.ApiResponse;
import com.apiwise.project.dto.CreateProjectRequest;
import com.apiwise.project.dto.ProjectDto;
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
@RequestMapping("/api/v1/workspaces/{workspaceId}/projects")
@RequiredArgsConstructor
@Tag(name = "Projects", description = "Workspace projects management")
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    @PreAuthorize("@workspaceSecurity.hasAccess(#workspaceId, 'VIEWER')")
    @Operation(summary = "Get all projects in workspace")
    public ResponseEntity<ApiResponse<List<ProjectDto>>> getProjects(@PathVariable UUID workspaceId) {
        List<ProjectDto> projects = projectService.getWorkspaceProjects(workspaceId);
        return ResponseEntity.ok(ApiResponse.success(projects));
    }

    @GetMapping("/{projectId}")
    @PreAuthorize("@workspaceSecurity.hasAccess(#workspaceId, 'VIEWER')")
    @Operation(summary = "Get project details by ID")
    public ResponseEntity<ApiResponse<ProjectDto>> getProject(
            @PathVariable UUID workspaceId,
            @PathVariable UUID projectId) {
        ProjectDto project = projectService.getProject(workspaceId, projectId);
        return ResponseEntity.ok(ApiResponse.success(project));
    }

    @PostMapping
    @PreAuthorize("@workspaceSecurity.hasAccess(#workspaceId, 'MEMBER')")
    @Operation(summary = "Create a new project in workspace")
    public ResponseEntity<ApiResponse<ProjectDto>> createProject(
            @PathVariable UUID workspaceId,
            @Valid @RequestBody CreateProjectRequest request) {
        ProjectDto project = projectService.createProject(workspaceId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Project created successfully", project));
    }

    @PutMapping("/{projectId}")
    @PreAuthorize("@workspaceSecurity.hasAccess(#workspaceId, 'MEMBER')")
    @Operation(summary = "Update project details")
    public ResponseEntity<ApiResponse<ProjectDto>> updateProject(
            @PathVariable UUID workspaceId,
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateProjectRequest request) {
        ProjectDto project = projectService.updateProject(workspaceId, projectId, request);
        return ResponseEntity.ok(ApiResponse.success("Project updated successfully", project));
    }

    @DeleteMapping("/{projectId}")
    @PreAuthorize("@workspaceSecurity.hasAccess(#workspaceId, 'ADMIN')")
    @Operation(summary = "Delete project")
    public ResponseEntity<ApiResponse<Void>> deleteProject(
            @PathVariable UUID workspaceId,
            @PathVariable UUID projectId) {
        projectService.deleteProject(workspaceId, projectId);
        return ResponseEntity.ok(ApiResponse.success("Project deleted successfully", null));
    }
}
