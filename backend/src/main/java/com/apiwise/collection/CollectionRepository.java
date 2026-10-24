package com.apiwise.collection;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CollectionRepository extends JpaRepository<Collection, UUID> {
    List<Collection> findByProjectIdOrderByOrderIndexAscCreatedAtAsc(UUID projectId);
    List<Collection> findByProjectIdAndParentIsNullOrderByOrderIndexAscCreatedAtAsc(UUID projectId);
    List<Collection> findByParentIdOrderByOrderIndexAscCreatedAtAsc(UUID parentId);
    Optional<Collection> findByIdAndProjectId(UUID id, UUID projectId);
    long countByProjectId(UUID projectId);
}
