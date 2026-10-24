package com.apiwise.request.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaveApiRequest {
    @NotBlank(message = "Request name is required")
    private String name;

    private String description;

    @NotBlank(message = "HTTP method is required")
    @Builder.Default
    private String method = "GET";

    @NotBlank(message = "URL is required")
    private String url;

    @Builder.Default
    private String queryParams = "[]";

    @Builder.Default
    private String headers = "[]";

    @Builder.Default
    private String authConfig = "{}";

    @Builder.Default
    private String bodyType = "NONE";

    private String bodyContent;

    private int orderIndex;
}
