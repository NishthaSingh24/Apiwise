package com.apiwise.workspace.dto;

import com.apiwise.workspace.WorkspaceRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkspaceDto {
    private UUID id;
    private String name;
    private String slug;
    private String description;
    private UUID ownerId;
    private String ownerName;
    private WorkspaceRole userRole;
    private Instant createdAt;
    private Instant updatedAt;
}
