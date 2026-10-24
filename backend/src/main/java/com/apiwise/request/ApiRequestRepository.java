package com.apiwise.request;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ApiRequestRepository extends JpaRepository<ApiRequest, UUID> {
    List<ApiRequest> findByCollectionIdOrderByOrderIndexAscCreatedAtAsc(UUID collectionId);
    Optional<ApiRequest> findByIdAndCollectionId(UUID id, UUID collectionId);
    long countByCollectionId(UUID collectionId);
}
