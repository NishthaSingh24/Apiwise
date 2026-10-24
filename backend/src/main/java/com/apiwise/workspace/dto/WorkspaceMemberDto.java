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
public class WorkspaceMemberDto {
    private UUID id;
    private UUID userId;
    private String email;
    private String fullName;
    private WorkspaceRole role;
    private Instant createdAt;
}
