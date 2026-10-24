package com.apiwise.environment;

import com.apiwise.common.EncryptionService;
import com.apiwise.environment.dto.EnvironmentDto;
import com.apiwise.environment.dto.EnvironmentVariableDto;
import com.apiwise.environment.dto.SaveEnvironmentRequest;
import com.apiwise.exception.ResourceNotFoundException;
import com.apiwise.workspace.Workspace;
import com.apiwise.workspace.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EnvironmentService {

    private final EnvironmentRepository environmentRepository;
    private final EnvironmentVariableRepository variableRepository;
    private final WorkspaceRepository workspaceRepository;
    private final EncryptionService encryptionService;

    @Transactional(readOnly = true)
    public List<EnvironmentDto> getWorkspaceEnvironments(UUID workspaceId) {
        return environmentRepository.findByWorkspaceIdOrderByCreatedAtAsc(workspaceId).stream()
                .map(this::toDtoWithMaskedSecrets)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EnvironmentDto getEnvironment(UUID workspaceId, UUID environmentId) {
        Environment env = environmentRepository.findByIdAndWorkspaceId(environmentId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Environment", "id", environmentId));
        return toDtoWithMaskedSecrets(env);
    }

    @Transactional
    public EnvironmentDto createEnvironment(UUID workspaceId, SaveEnvironmentRequest request) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace", "id", workspaceId));

        if (request.isDefault()) {
            clearDefaultEnvironment(workspaceId);
        }

        Environment environment = Environment.builder()
                .workspace(workspace)
                .name(request.getName().trim())
                .isDefault(request.isDefault())
                .build();
        environment = environmentRepository.save(environment);

        saveVariables(environment, request.getVariables());

        return toDtoWithMaskedSecrets(environment);
    }

    @Transactional
    public EnvironmentDto updateEnvironment(UUID workspaceId, UUID environmentId, SaveEnvironmentRequest request) {
        Environment environment = environmentRepository.findByIdAndWorkspaceId(environmentId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Environment", "id", environmentId));

        if (request.isDefault() && !environment.isDefault()) {
            clearDefaultEnvironment(workspaceId);
        }

        environment.setName(request.getName().trim());
        environment.setDefault(request.isDefault());
        environment = environmentRepository.save(environment);

        variableRepository.deleteByEnvironmentId(environmentId);
        saveVariables(environment, request.getVariables());

        return toDtoWithMaskedSecrets(environment);
    }

    @Transactional
    public void deleteEnvironment(UUID workspaceId, UUID environmentId) {
        Environment environment = environmentRepository.findByIdAndWorkspaceId(environmentId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Environment", "id", environmentId));
        environmentRepository.delete(environment);
    }

    @Transactional(readOnly = true)
    public Map<String, String> resolveDecryptedVariables(UUID environmentId) {
        if (environmentId == null) {
            return Collections.emptyMap();
        }

        List<EnvironmentVariable> vars = variableRepository.findByEnvironmentIdOrderByKeyAsc(environmentId);
        Map<String, String> resolved = new HashMap<>();
        for (EnvironmentVariable var : vars) {
            if (var.isEnabled() && var.getKey() != null && !var.getKey().isBlank()) {
                String val = var.getValue();
                if (var.isSecret() && val != null) {
                    val = encryptionService.decrypt(val);
                }
                resolved.put(var.getKey(), val != null ? val : "");
            }
        }
        return resolved;
    }

    private void saveVariables(Environment environment, List<EnvironmentVariableDto> dtos) {
        if (dtos == null || dtos.isEmpty()) {
            return;
        }

        for (EnvironmentVariableDto dto : dtos) {
            if (dto.getKey() == null || dto.getKey().isBlank()) {
                continue;
            }

            String val = dto.getValue();
            if (dto.isSecret() && val != null && !val.equals("••••••••")) {
                val = encryptionService.encrypt(val);
            }

            EnvironmentVariable var = EnvironmentVariable.builder()
                    .environment(environment)
                    .key(dto.getKey().trim())
                    .value(val)
                    .isSecret(dto.isSecret())
                    .enabled(dto.isEnabled())
                    .build();
            variableRepository.save(var);
        }
    }

    private void clearDefaultEnvironment(UUID workspaceId) {
        environmentRepository.findByWorkspaceIdAndIsDefaultTrue(workspaceId)
                .ifPresent(env -> {
                    env.setDefault(false);
                    environmentRepository.save(env);
                });
    }

    private EnvironmentDto toDtoWithMaskedSecrets(Environment env) {
        List<EnvironmentVariable> vars = variableRepository.findByEnvironmentIdOrderByKeyAsc(env.getId());
        List<EnvironmentVariableDto> varDtos = vars.stream()
                .map(v -> EnvironmentVariableDto.builder()
                        .id(v.getId())
                        .key(v.getKey())
                        .value(v.isSecret() ? "••••••••" : v.getValue())
                        .isSecret(v.isSecret())
                        .enabled(v.isEnabled())
                        .build())
                .collect(Collectors.toList());

        return EnvironmentDto.builder()
                .id(env.getId())
                .workspaceId(env.getWorkspace().getId())
                .name(env.getName())
                .isDefault(env.isDefault())
                .variables(varDtos)
                .createdAt(env.getCreatedAt())
                .updatedAt(env.getUpdatedAt())
                .build();
    }
}
