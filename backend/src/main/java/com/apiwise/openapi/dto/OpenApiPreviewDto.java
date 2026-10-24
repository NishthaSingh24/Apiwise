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
public class OpenApiPreviewDto {
    private String title;
    private String version;
    private String description;
    @Builder.Default
    private List<String> servers = new ArrayList<>();
    @Builder.Default
    private List<OpenApiEndpointDto> endpoints = new ArrayList<>();
}
