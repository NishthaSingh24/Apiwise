package com.apiwise.environment.dto;

import jakarta.validation.constraints.NotBlank;
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
public class SaveEnvironmentRequest {
    @NotBlank(message = "Environment name is required")
    private String name;

    private boolean isDefault;

    @Builder.Default
    private List<EnvironmentVariableDto> variables = new ArrayList<>();
}
