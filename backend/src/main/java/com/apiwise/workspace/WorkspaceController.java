package com.apiwise.workspace;

import com.apiwise.common.ApiResponse;
import com.apiwise.security.UserPrincipal;
import com.apiwise.workspace.dto.CreateWorkspaceRequest;
import com.apiwise.workspace.dto.WorkspaceDto;
import com.apiwise.workspace.dto.WorkspaceMemberDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workspaces")
@RequiredArgsConstructor
@Tag(name = "Workspaces", description = "Workspace and team membership management")
public class WorkspaceController {

    private final WorkspaceService workspaceService;

    @GetMapping
    @Operation(summary = "Get all accessible workspaces for current user")
    public ResponseEntity<ApiResponse<List<WorkspaceDto>>> getUserWorkspaces(@AuthenticationPrincipal UserPrincipal principal) {
        List<WorkspaceDto> workspaces = workspaceService.getUserWorkspaces(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(workspaces));
    }

    @GetMapping("/{workspaceId}")
    @Operation(summary = "Get workspace details by ID")
    public ResponseEntity<ApiResponse<WorkspaceDto>> getWorkspace(
            @PathVariable UUID workspaceId,
            @AuthenticationPrincipal UserPrincipal principal) {
        WorkspaceDto workspace = workspaceService.getWorkspace(workspaceId, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(workspace));
    }

    @PostMapping
    @Operation(summary = "Create a new workspace")
    public ResponseEntity<ApiResponse<WorkspaceDto>> createWorkspace(
            @Valid @RequestBody CreateWorkspaceRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        WorkspaceDto workspace = workspaceService.createWorkspace(request, principal.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Workspace created successfully", workspace));
    }

    @PutMapping("/{workspaceId}")
    @Operation(summary = "Update workspace details")
    public ResponseEntity<ApiResponse<WorkspaceDto>> updateWorkspace(
            @PathVariable UUID workspaceId,
            @Valid @RequestBody CreateWorkspaceRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        WorkspaceDto workspace = workspaceService.updateWorkspace(workspaceId, request, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Workspace updated successfully", workspace));
    }

    @DeleteMapping("/{workspaceId}")
    @Operation(summary = "Delete workspace")
    public ResponseEntity<ApiResponse<Void>> deleteWorkspace(
            @PathVariable UUID workspaceId,
            @AuthenticationPrincipal UserPrincipal principal) {
        workspaceService.deleteWorkspace(workspaceId, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Workspace deleted successfully", null));
    }

    @GetMapping("/{workspaceId}/members")
    @Operation(summary = "Get all members of a workspace")
    public ResponseEntity<ApiResponse<List<WorkspaceMemberDto>>> getMembers(
            @PathVariable UUID workspaceId,
            @AuthenticationPrincipal UserPrincipal principal) {
        List<WorkspaceMemberDto> members = workspaceService.getMembers(workspaceId, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(members));
    }

    @PostMapping("/{workspaceId}/members")
    @Operation(summary = "Add a member to the workspace")
    public ResponseEntity<ApiResponse<WorkspaceMemberDto>> addMember(
            @PathVariable UUID workspaceId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal) {
        String email = body.get("email");
        String roleStr = body.getOrDefault("role", "MEMBER");
        WorkspaceRole role = WorkspaceRole.valueOf(roleStr.toUpperCase());

        WorkspaceMemberDto member = workspaceService.addMember(workspaceId, email, role, principal.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Member added successfully", member));
    }

    @DeleteMapping("/{workspaceId}/members/{memberId}")
    @Operation(summary = "Remove a member from the workspace")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable UUID workspaceId,
            @PathVariable UUID memberId,
            @AuthenticationPrincipal UserPrincipal principal) {
        workspaceService.removeMember(workspaceId, memberId, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Member removed successfully", null));
    }
}
