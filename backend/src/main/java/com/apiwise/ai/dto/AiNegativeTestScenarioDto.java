package com.apiwise.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiNegativeTestScenarioDto {
    private String name;
    private String description;
    private String modifiedMethod;
    private String modifiedUrl;
    private String modifiedHeaders;
    private String modifiedBody;
    private int expectedStatus;
    private String reasoning;
}
