package com.apiwise.openapi;

import com.apiwise.assertion.Assertion;
import com.apiwise.assertion.AssertionRepository;
import com.apiwise.collection.Collection;
import com.apiwise.collection.CollectionRepository;
import com.apiwise.collection.CollectionService;
import com.apiwise.collection.dto.CollectionDto;
import com.apiwise.exception.BadRequestException;
import com.apiwise.exception.ResourceNotFoundException;
import com.apiwise.execution.SsrfProtectionService;
import com.apiwise.openapi.dto.OpenApiEndpointDto;
import com.apiwise.openapi.dto.OpenApiImportRequest;
import com.apiwise.openapi.dto.OpenApiPreviewDto;
import com.apiwise.openapi.dto.OpenApiPreviewRequest;
import com.apiwise.project.Project;
import com.apiwise.project.ProjectRepository;
import com.apiwise.request.ApiRequest;
import com.apiwise.request.ApiRequestRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.parser.OpenAPIV3Parser;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.PathItem;
import io.swagger.v3.oas.models.media.MediaType;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.oas.models.parameters.Parameter;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.parser.core.models.SwaggerParseResult;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

@Service
@RequiredArgsConstructor
public class OpenApiImportService {

    private static final Logger log = LoggerFactory.getLogger(OpenApiImportService.class);

    private final SsrfProtectionService ssrfProtectionService;
    private final ProjectRepository projectRepository;
    private final CollectionRepository collectionRepository;
    private final ApiRequestRepository requestRepository;
    private final AssertionRepository assertionRepository;
    private final CollectionService collectionService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public OpenApiPreviewDto parseAndPreview(OpenApiPreviewRequest request) {
        String content = getSpecContent(request.getSpecContent(), request.getSpecUrl());
        OpenAPI openAPI = parseSpec(content);

        OpenApiPreviewDto preview = new OpenApiPreviewDto();
        if (openAPI.getInfo() != null) {
            preview.setTitle(openAPI.getInfo().getTitle());
            preview.setVersion(openAPI.getInfo().getVersion());
            preview.setDescription(openAPI.getInfo().getDescription());
        }

        if (openAPI.getServers() != null) {
            for (Server s : openAPI.getServers()) {
                if (s.getUrl() != null && !s.getUrl().isBlank()) {
                    preview.getServers().add(s.getUrl());
                }
            }
        }

        if (openAPI.getPaths() != null) {
            for (Map.Entry<String, PathItem> pathEntry : openAPI.getPaths().entrySet()) {
                String path = pathEntry.getKey();
                PathItem pathItem = pathEntry.getValue();

                Map<String, Operation> operations = new LinkedHashMap<>();
                if (pathItem.getGet() != null) operations.put("GET", pathItem.getGet());
                if (pathItem.getPost() != null) operations.put("POST", pathItem.getPost());
                if (pathItem.getPut() != null) operations.put("PUT", pathItem.getPut());
                if (pathItem.getDelete() != null) operations.put("DELETE", pathItem.getDelete());
                if (pathItem.getPatch() != null) operations.put("PATCH", pathItem.getPatch());
                if (pathItem.getHead() != null) operations.put("HEAD", pathItem.getHead());
                if (pathItem.getOptions() != null) operations.put("OPTIONS", pathItem.getOptions());

                for (Map.Entry<String, Operation> opEntry : operations.entrySet()) {
                    String method = opEntry.getKey();
                    Operation op = opEntry.getValue();

                    OpenApiEndpointDto endpoint = convertOperation(path, method, op);
                    preview.getEndpoints().add(endpoint);
                }
            }
        }

        return preview;
    }

    @Transactional
    public CollectionDto importEndpoints(UUID workspaceId, OpenApiImportRequest request) {
        Project project = projectRepository.findByIdAndWorkspaceId(request.getProjectId(), workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", request.getProjectId()));

        OpenApiPreviewDto preview = parseAndPreview(OpenApiPreviewRequest.builder()
                .specContent(request.getSpecContent())
                .specUrl(request.getSpecUrl())
                .build());

        Collection targetCollection;
        if (request.getCollectionId() != null) {
            targetCollection = collectionRepository.findByIdAndProjectId(request.getCollectionId(), project.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Collection", "id", request.getCollectionId()));
        } else {
            String name = request.getCollectionName() != null && !request.getCollectionName().isBlank()
                    ? request.getCollectionName().trim()
                    : (preview.getTitle() != null ? preview.getTitle() : "Imported OpenAPI Collection");

            targetCollection = Collection.builder()
                    .project(project)
                    .name(name)
                    .description("Imported from OpenAPI: " + (preview.getTitle() != null ? preview.getTitle() : "Specification"))
                    .build();
            targetCollection = collectionRepository.save(targetCollection);
        }

        String baseUrl = request.getBaseUrl();
        if (baseUrl == null || baseUrl.isBlank()) {
            baseUrl = !preview.getServers().isEmpty() ? preview.getServers().get(0) : "{{baseUrl}}";
        }
        if (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }

        Set<String> selectedIds = new HashSet<>(request.getSelectedEndpointIds());
        boolean selectAll = selectedIds.isEmpty();

        int order = 0;
        for (OpenApiEndpointDto ep : preview.getEndpoints()) {
            if (selectAll || selectedIds.contains(ep.getId())) {
                String fullUrl = baseUrl + (ep.getPath().startsWith("/") ? ep.getPath() : "/" + ep.getPath());

                ApiRequest apiReq = ApiRequest.builder()
                        .collection(targetCollection)
                        .name(ep.getSummary() != null && !ep.getSummary().isBlank() ? ep.getSummary() : (ep.getMethod() + " " + ep.getPath()))
                        .description(ep.getDescription())
                        .method(ep.getMethod())
                        .url(fullUrl)
                        .queryParams(ep.getQueryParams() != null ? ep.getQueryParams() : "[]")
                        .headers(ep.getHeaders() != null ? ep.getHeaders() : "[]")
                        .authConfig("{}")
                        .bodyType(ep.getBodyType() != null ? ep.getBodyType() : "NONE")
                        .bodyContent(ep.getExampleBody())
                        .orderIndex(order++)
                        .build();
                apiReq = requestRepository.save(apiReq);

                // Add default status 200 assertion
                Assertion defaultAssertion = Assertion.builder()
                        .apiRequest(apiReq)
                        .name("Status is 200 OK")
                        .assertionType("STATUS_CODE")
                        .target("")
                        .operator("EQUALS")
                        .expectedValue("200")
                        .enabled(true)
                        .orderIndex(0)
                        .build();
                assertionRepository.save(defaultAssertion);
            }
        }

        return collectionService.getCollection(project.getId(), targetCollection.getId());
    }

    private String getSpecContent(String rawContent, String specUrl) {
        if (rawContent != null && !rawContent.isBlank()) {
            return rawContent;
        }

        if (specUrl != null && !specUrl.isBlank()) {
            ssrfProtectionService.validateUrl(specUrl.trim());
            try {
                HttpClient client = HttpClient.newBuilder()
                        .connectTimeout(Duration.ofSeconds(10))
                        .followRedirects(HttpClient.Redirect.NEVER)
                        .build();

                HttpRequest req = HttpRequest.newBuilder()
                        .uri(URI.create(specUrl.trim()))
                        .timeout(Duration.ofSeconds(15))
                        .GET()
                        .build();

                HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
                if (resp.statusCode() >= 200 && resp.statusCode() < 300) {
                    return resp.body();
                } else {
                    throw new BadRequestException("Failed to fetch OpenAPI URL. HTTP " + resp.statusCode());
                }
            } catch (Exception e) {
                throw new BadRequestException("Failed to download OpenAPI specification: " + e.getMessage());
            }
        }

        throw new BadRequestException("Either specContent or specUrl must be provided");
    }

    private OpenAPI parseSpec(String content) {
        SwaggerParseResult result = new OpenAPIV3Parser().readContents(content);
        if (result == null || result.getOpenAPI() == null) {
            String errors = result != null && result.getMessages() != null ? String.join(", ", result.getMessages()) : "Unknown error";
            throw new BadRequestException("Malformed OpenAPI specification: " + errors);
        }
        return result.getOpenAPI();
    }

    private OpenApiEndpointDto convertOperation(String path, String method, Operation op) {
        String id = method.toUpperCase() + " " + path;
        List<Map<String, Object>> queryParams = new ArrayList<>();
        List<Map<String, Object>> headers = new ArrayList<>();

        if (op.getParameters() != null) {
            for (Parameter p : op.getParameters()) {
                if ("query".equalsIgnoreCase(p.getIn())) {
                    queryParams.add(Map.of(
                            "key", p.getName(),
                            "value", p.getExample() != null ? String.valueOf(p.getExample()) : "",
                            "description", p.getDescription() != null ? p.getDescription() : "",
                            "enabled", Boolean.TRUE.equals(p.getRequired())
                    ));
                } else if ("header".equalsIgnoreCase(p.getIn())) {
                    headers.add(Map.of(
                            "key", p.getName(),
                            "value", p.getExample() != null ? String.valueOf(p.getExample()) : "",
                            "description", p.getDescription() != null ? p.getDescription() : "",
                            "enabled", Boolean.TRUE.equals(p.getRequired())
                    ));
                }
            }
        }

        String bodyType = "NONE";
        String exampleBody = null;

        if (op.getRequestBody() != null && op.getRequestBody().getContent() != null) {
            if (op.getRequestBody().getContent().containsKey("application/json")) {
                bodyType = "JSON";
                MediaType mediaType = op.getRequestBody().getContent().get("application/json");
                if (mediaType.getExample() != null) {
                    exampleBody = String.valueOf(mediaType.getExample());
                } else if (mediaType.getSchema() != null) {
                    exampleBody = generateSampleJson(mediaType.getSchema());
                }
            } else if (op.getRequestBody().getContent().containsKey("application/x-www-form-urlencoded")) {
                bodyType = "FORM_URLENCODED";
            }
        }

        List<String> responseCodes = new ArrayList<>();
        if (op.getResponses() != null) {
            responseCodes.addAll(op.getResponses().keySet());
        }

        String qpJson = "[]";
        String hJson = "[]";
        try {
            qpJson = objectMapper.writeValueAsString(queryParams);
            hJson = objectMapper.writeValueAsString(headers);
        } catch (Exception ignored) {}

        return OpenApiEndpointDto.builder()
                .id(id)
                .method(method.toUpperCase())
                .path(path)
                .summary(op.getSummary())
                .description(op.getDescription())
                .tags(op.getTags() != null ? op.getTags() : Collections.emptyList())
                .queryParams(qpJson)
                .headers(hJson)
                .bodyType(bodyType)
                .exampleBody(exampleBody)
                .responseCodes(responseCodes)
                .build();
    }

    private String generateSampleJson(Schema<?> schema) {
        try {
            Map<String, Object> sample = new LinkedHashMap<>();
            if (schema.getProperties() != null) {
                for (Map.Entry<String, Schema> prop : schema.getProperties().entrySet()) {
                    String propName = prop.getKey();
                    Schema<?> propSchema = prop.getValue();
                    String propType = propSchema.getType() != null ? propSchema.getType() : "string";

                    Object val = switch (propType.toLowerCase()) {
                        case "integer", "number" -> 123;
                        case "boolean" -> true;
                        case "array" -> List.of();
                        default -> "sample_" + propName;
                    };
                    sample.put(propName, val);
                }
            }
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(sample);
        } catch (Exception e) {
            return "{}";
        }
    }
}
