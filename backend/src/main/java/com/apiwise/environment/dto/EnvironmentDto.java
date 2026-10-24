package com.apiwise.environment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnvironmentDto {
    private UUID id;
    private UUID workspaceId;
    private String name;
    private boolean isDefault;
    @Builder.Default
    private List<EnvironmentVariableDto> variables = new ArrayList<>();
    private Instant createdAt;
    private Instant updatedAt;
}
