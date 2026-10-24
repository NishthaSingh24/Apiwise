package com.apiwise.project;

import com.apiwise.collection.CollectionRepository;
import com.apiwise.exception.ResourceNotFoundException;
import com.apiwise.project.dto.CreateProjectRequest;
import com.apiwise.project.dto.ProjectDto;
import com.apiwise.workspace.Workspace;
import com.apiwise.workspace.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final WorkspaceRepository workspaceRepository;
    private final CollectionRepository collectionRepository;

    @Transactional(readOnly = true)
    public List<ProjectDto> getWorkspaceProjects(UUID workspaceId) {
        return projectRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProjectDto getProject(UUID workspaceId, UUID projectId) {
        Project project = projectRepository.findByIdAndWorkspaceId(projectId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));
        return toDto(project);
    }

    @Transactional
    public ProjectDto createProject(UUID workspaceId, CreateProjectRequest request) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace", "id", workspaceId));

        Project project = Project.builder()
                .workspace(workspace)
                .name(request.getName().trim())
                .description(request.getDescription())
                .build();
        project = projectRepository.save(project);

        return toDto(project);
    }

    @Transactional
    public ProjectDto updateProject(UUID workspaceId, UUID projectId, CreateProjectRequest request) {
        Project project = projectRepository.findByIdAndWorkspaceId(projectId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        project.setName(request.getName().trim());
        project.setDescription(request.getDescription());
        project = projectRepository.save(project);

        return toDto(project);
    }

    @Transactional
    public void deleteProject(UUID workspaceId, UUID projectId) {
        Project project = projectRepository.findByIdAndWorkspaceId(projectId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));
        projectRepository.delete(project);
    }

    private ProjectDto toDto(Project project) {
        long collectionCount = collectionRepository.countByProjectId(project.getId());
        return ProjectDto.builder()
                .id(project.getId())
                .workspaceId(project.getWorkspace().getId())
                .name(project.getName())
                .description(project.getDescription())
                .collectionCount(collectionCount)
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }
}
