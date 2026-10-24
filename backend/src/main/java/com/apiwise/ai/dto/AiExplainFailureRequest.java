package com.apiwise.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiExplainFailureRequest {
    private String requestName;
    private String method;
    private String url;
    private int statusCode;
    private String responseBody;
    private String assertionName;
    private String assertionType;
    private String target;
    private String expected;
    private String actual;
    private String errorMessage;
}
