package com.apiwise.assertion;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AssertionRepository extends JpaRepository<Assertion, UUID> {
    List<Assertion> findByApiRequestIdOrderByOrderIndexAscCreatedAtAsc(UUID apiRequestId);
    Optional<Assertion> findByIdAndApiRequestId(UUID id, UUID apiRequestId);
    long countByApiRequestId(UUID apiRequestId);
    void deleteByApiRequestId(UUID apiRequestId);
}
