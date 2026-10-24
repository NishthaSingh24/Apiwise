package com.apiwise.assertion.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaveAssertionRequest {
    @NotBlank(message = "Assertion name is required")
    private String name;

    @NotBlank(message = "Assertion type is required")
    private String assertionType;

    private String target;

    @NotBlank(message = "Operator is required")
    private String operator;

    private String expectedValue;

    @Builder.Default
    private boolean enabled = true;

    private int orderIndex;
}
