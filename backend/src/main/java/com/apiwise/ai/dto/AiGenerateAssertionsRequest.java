package com.apiwise.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiGenerateAssertionsRequest {
    private String method;
    private String url;
    private Integer statusCode;
    private String responseHeaders;
    private String responseBody;
}
