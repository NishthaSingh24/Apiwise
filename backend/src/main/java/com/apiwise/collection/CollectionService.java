package com.apiwise.collection;

import com.apiwise.collection.dto.CollectionDto;
import com.apiwise.collection.dto.CreateCollectionRequest;
import com.apiwise.exception.ResourceNotFoundException;
import com.apiwise.project.Project;
import com.apiwise.project.ProjectRepository;
import com.apiwise.request.ApiRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CollectionService {

    private final CollectionRepository collectionRepository;
    private final ProjectRepository projectRepository;
    private final ApiRequestRepository requestRepository;

    @Transactional(readOnly = true)
    public List<CollectionDto> getProjectCollections(UUID projectId) {
        List<Collection> all = collectionRepository.findByProjectIdOrderByOrderIndexAscCreatedAtAsc(projectId);
        Map<UUID, CollectionDto> dtoMap = new HashMap<>();
        List<CollectionDto> roots = new ArrayList<>();

        for (Collection c : all) {
            long reqCount = requestRepository.countByCollectionId(c.getId());
            CollectionDto dto = CollectionDto.builder()
                    .id(c.getId())
                    .projectId(c.getProject().getId())
                    .parentId(c.getParent() != null ? c.getParent().getId() : null)
                    .name(c.getName())
                    .description(c.getDescription())
                    .orderIndex(c.getOrderIndex())
                    .requestCount(reqCount)
                    .children(new ArrayList<>())
                    .createdAt(c.getCreatedAt())
                    .updatedAt(c.getUpdatedAt())
                    .build();
            dtoMap.put(c.getId(), dto);
        }

        for (Collection c : all) {
            CollectionDto current = dtoMap.get(c.getId());
            if (c.getParent() != null && dtoMap.containsKey(c.getParent().getId())) {
                dtoMap.get(c.getParent().getId()).getChildren().add(current);
            } else {
                roots.add(current);
            }
        }

        return roots;
    }

    @Transactional(readOnly = true)
    public CollectionDto getCollection(UUID projectId, UUID collectionId) {
        Collection c = collectionRepository.findByIdAndProjectId(collectionId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Collection", "id", collectionId));
        long reqCount = requestRepository.countByCollectionId(c.getId());
        return CollectionDto.builder()
                .id(c.getId())
                .projectId(c.getProject().getId())
                .parentId(c.getParent() != null ? c.getParent().getId() : null)
                .name(c.getName())
                .description(c.getDescription())
                .orderIndex(c.getOrderIndex())
                .requestCount(reqCount)
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    @Transactional
    public CollectionDto createCollection(UUID projectId, CreateCollectionRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        Collection parent = null;
        if (request.getParentId() != null) {
            parent = collectionRepository.findByIdAndProjectId(request.getParentId(), projectId)
                    .orElseThrow(() -> new ResourceNotFoundException("Parent Collection", "id", request.getParentId()));
        }

        Collection collection = Collection.builder()
                .project(project)
                .parent(parent)
                .name(request.getName().trim())
                .description(request.getDescription())
                .orderIndex(request.getOrderIndex())
                .build();
        collection = collectionRepository.save(collection);

        return CollectionDto.builder()
                .id(collection.getId())
                .projectId(projectId)
                .parentId(parent != null ? parent.getId() : null)
                .name(collection.getName())
                .description(collection.getDescription())
                .orderIndex(collection.getOrderIndex())
                .requestCount(0)
                .createdAt(collection.getCreatedAt())
                .updatedAt(collection.getUpdatedAt())
                .build();
    }

    @Transactional
    public CollectionDto updateCollection(UUID projectId, UUID collectionId, CreateCollectionRequest request) {
        Collection collection = collectionRepository.findByIdAndProjectId(collectionId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Collection", "id", collectionId));

        Collection parent = null;
        if (request.getParentId() != null && !request.getParentId().equals(collectionId)) {
            parent = collectionRepository.findByIdAndProjectId(request.getParentId(), projectId)
                    .orElseThrow(() -> new ResourceNotFoundException("Parent Collection", "id", request.getParentId()));
        }

        collection.setName(request.getName().trim());
        collection.setDescription(request.getDescription());
        collection.setParent(parent);
        collection.setOrderIndex(request.getOrderIndex());
        collection = collectionRepository.save(collection);

        long reqCount = requestRepository.countByCollectionId(collection.getId());

        return CollectionDto.builder()
                .id(collection.getId())
                .projectId(projectId)
                .parentId(parent != null ? parent.getId() : null)
                .name(collection.getName())
                .description(collection.getDescription())
                .orderIndex(collection.getOrderIndex())
                .requestCount(reqCount)
                .createdAt(collection.getCreatedAt())
                .updatedAt(collection.getUpdatedAt())
                .build();
    }

    @Transactional
    public void deleteCollection(UUID projectId, UUID collectionId) {
        Collection collection = collectionRepository.findByIdAndProjectId(collectionId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Collection", "id", collectionId));
        collectionRepository.delete(collection);
    }
}
