package com.apiwise.request.dto;

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
public class ApiRequestDto {
    private UUID id;
    private UUID collectionId;
    private String name;
    private String description;
    private String method;
    private String url;
    private String queryParams;
    private String headers;
    private String authConfig;
    private String bodyType;
    private String bodyContent;
    private int orderIndex;
    private long assertionCount;
    private Instant createdAt;
    private Instant updatedAt;
}
