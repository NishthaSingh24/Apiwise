package com.apiwise.openapi;

import com.apiwise.assertion.AssertionRepository;
import com.apiwise.collection.CollectionRepository;
import com.apiwise.collection.CollectionService;
import com.apiwise.execution.SsrfProtectionService;
import com.apiwise.openapi.dto.OpenApiPreviewDto;
import com.apiwise.openapi.dto.OpenApiPreviewRequest;
import com.apiwise.project.ProjectRepository;
import com.apiwise.request.ApiRequestRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import static org.junit.jupiter.api.Assertions.*;

class OpenApiImportServiceTest {

    private OpenApiImportService importService;

    @BeforeEach
    void setUp() {
        SsrfProtectionService ssrfService = new SsrfProtectionService(true);
        ProjectRepository projectRepo = Mockito.mock(ProjectRepository.class);
        CollectionRepository collectionRepo = Mockito.mock(CollectionRepository.class);
        ApiRequestRepository requestRepo = Mockito.mock(ApiRequestRepository.class);
        AssertionRepository assertionRepo = Mockito.mock(AssertionRepository.class);
        CollectionService collectionService = Mockito.mock(CollectionService.class);

        importService = new OpenApiImportService(
                ssrfService,
                projectRepo,
                collectionRepo,
                requestRepo,
                assertionRepo,
                collectionService
        );
    }

    @Test
    @DisplayName("Parse valid OpenAPI 3.0 YAML/JSON specification")
    void shouldParseOpenApiSpec() {
        String spec = """
                openapi: 3.0.0
                info:
                  title: Sample Pet Store API
                  version: 1.0.0
                  description: A sample API for testing
                servers:
                  - url: https://api.petstore.com/v1
                paths:
                  /pets:
                    get:
                      summary: List all pets
                      responses:
                        '200':
                          description: Successful response
                    post:
                      summary: Create a pet
                      requestBody:
                        content:
                          application/json:
                            schema:
                              type: object
                              properties:
                                name:
                                  type: string
                      responses:
                        '201':
                          description: Created
                  /pets/{petId}:
                    get:
                      summary: Info for a specific pet
                      responses:
                        '200':
                          description: Successful response
                """;

        OpenApiPreviewDto preview = importService.parseAndPreview(OpenApiPreviewRequest.builder()
                .specContent(spec)
                .build());

        assertNotNull(preview);
        assertEquals("Sample Pet Store API", preview.getTitle());
        assertEquals("1.0.0", preview.getVersion());
        assertEquals(1, preview.getServers().size());
        assertEquals("https://api.petstore.com/v1", preview.getServers().get(0));
        assertEquals(3, preview.getEndpoints().size());

        assertTrue(preview.getEndpoints().stream().anyMatch(e -> e.getMethod().equals("GET") && e.getPath().equals("/pets")));
        assertTrue(preview.getEndpoints().stream().anyMatch(e -> e.getMethod().equals("POST") && e.getPath().equals("/pets")));
        assertTrue(preview.getEndpoints().stream().anyMatch(e -> e.getMethod().equals("GET") && e.getPath().equals("/pets/{petId}")));
    }
}
