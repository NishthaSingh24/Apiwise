package com.apiwise.collection.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCollectionRequest {
    @NotBlank(message = "Collection name is required")
    @Size(min = 1, max = 100, message = "Collection name must be between 1 and 100 characters")
    private String name;

    private String description;

    private UUID parentId;

    private int orderIndex;
}
