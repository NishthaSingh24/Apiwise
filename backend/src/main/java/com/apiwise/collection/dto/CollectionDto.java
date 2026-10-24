package com.apiwise.collection.dto;

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
public class CollectionDto {
    private UUID id;
    private UUID projectId;
    private UUID parentId;
    private String name;
    private String description;
    private int orderIndex;
    private long requestCount;
    @Builder.Default
    private List<CollectionDto> children = new ArrayList<>();
    private Instant createdAt;
    private Instant updatedAt;
}
