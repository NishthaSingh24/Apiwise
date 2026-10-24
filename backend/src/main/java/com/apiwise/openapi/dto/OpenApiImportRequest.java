package com.apiwise.openapi.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OpenApiImportRequest {
    @NotNull(message = "Target project ID is required")
    private UUID projectId;

    private UUID collectionId; // If provided, adds to existing collection, otherwise creates new

    private String collectionName; // Name if creating new collection

    private String specContent;

    private String specUrl;

    private String baseUrl;

    @Builder.Default
    private List<String> selectedEndpointIds = new ArrayList<>();
}
