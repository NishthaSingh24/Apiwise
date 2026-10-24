package com.apiwise.openapi.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OpenApiEndpointDto {
    private String id; // e.g. "GET /pets"
    private String method;
    private String path;
    private String summary;
    private String description;
    @Builder.Default
    private List<String> tags = new ArrayList<>();
    private String queryParams;
    private String headers;
    private String bodyType;
    private String exampleBody;
    @Builder.Default
    private List<String> responseCodes = new ArrayList<>();
}
