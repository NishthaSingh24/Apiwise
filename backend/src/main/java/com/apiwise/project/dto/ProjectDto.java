package com.apiwise.project.dto;

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
public class ProjectDto {
    private UUID id;
    private UUID workspaceId;
    private String name;
    private String description;
    private long collectionCount;
    private Instant createdAt;
    private Instant updatedAt;
}
