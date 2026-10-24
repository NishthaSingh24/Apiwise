package com.apiwise.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiAssertionSuggestionDto {
    private String name;
    private String assertionType;
    private String target;
    private String operator;
    private String expectedValue;
    private String reasoning;
}
