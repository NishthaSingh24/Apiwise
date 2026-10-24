package com.apiwise.report;

import com.apiwise.exception.ResourceNotFoundException;
import com.apiwise.history.*;
import com.apiwise.history.dto.AssertionResultDto;
import com.apiwise.history.dto.TestRunDto;
import com.apiwise.history.dto.TestRunItemDto;
import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.StringWriter;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final TestRunRepository testRunRepository;
    private final TestRunItemRepository testRunItemRepository;
    private final AssertionResultRepository assertionResultRepository;

    @Transactional(readOnly = true)
    public List<TestRunDto> getWorkspaceRuns(UUID workspaceId) {
        return testRunRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId).stream()
                .map(this::toSummaryDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TestRunDto getRunDetails(UUID runId) {
        TestRun run = testRunRepository.findById(runId)
                .orElseThrow(() -> new ResourceNotFoundException("TestRun", "id", runId));

        List<TestRunItem> items = testRunItemRepository.findByTestRunIdOrderByExecutedAtAsc(runId);
        List<TestRunItemDto> itemDtos = new ArrayList<>();

        for (TestRunItem item : items) {
            List<AssertionResult> results = assertionResultRepository.findByTestRunItemId(item.getId());
            List<AssertionResultDto> resultDtos = results.stream()
                    .map(r -> AssertionResultDto.builder()
                            .id(r.getId())
                            .assertionId(r.getAssertion() != null ? r.getAssertion().getId() : null)
                            .assertionName(r.getAssertionName())
                            .assertionType(r.getAssertionType())
                            .target(r.getTarget())
                            .operator(r.getOperator())
                            .expectedValue(r.getExpectedValue())
                            .actualValue(r.getActualValue())
                            .passed(r.isPassed())
                            .errorMessage(r.getErrorMessage())
                            .build())
                    .collect(Collectors.toList());

            itemDtos.add(TestRunItemDto.builder()
                    .id(item.getId())
                    .apiRequestId(item.getApiRequest() != null ? item.getApiRequest().getId() : null)
                    .requestName(item.getRequestName())
                    .method(item.getMethod())
                    .executedUrl(item.getExecutedUrl())
                    .statusCode(item.getStatusCode())
                    .responseTimeMs(item.getResponseTimeMs())
                    .responseSizeBytes(item.getResponseSizeBytes())
                    .requestHeaders(item.getRequestHeaders())
                    .responseHeaders(item.getResponseHeaders())
                    .responseBody(item.getResponseBody())
                    .status(item.getStatus())
                    .errorMessage(item.getErrorMessage())
                    .assertionResults(resultDtos)
                    .executedAt(item.getExecutedAt())
                    .build());
        }

        return toFullDto(run, itemDtos);
    }

    @Transactional(readOnly = true)
    public byte[] generatePdfReport(UUID runId) {
        TestRunDto run = getRunDetails(runId);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        Document document = new Document(PageSize.A4, 36, 36, 40, 40);
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Document Header
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, new Color(79, 70, 229));
            Paragraph title = new Paragraph("APIWise — Test Execution Report", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(15);
            document.add(title);

            // Metadata Box
            Font metaFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.DARK_GRAY);
            PdfPTable metaTable = new PdfPTable(2);
            metaTable.setWidthPercentage(100);
            metaTable.setSpacingAfter(15);

            addMetaRow(metaTable, "Run ID:", run.getId().toString(), metaFont);
            addMetaRow(metaTable, "Collection:", run.getCollectionName() != null ? run.getCollectionName() : "N/A", metaFont);
            addMetaRow(metaTable, "Environment:", run.getEnvironmentName() != null ? run.getEnvironmentName() : "Default", metaFont);
            addMetaRow(metaTable, "Executed At:", run.getStartedAt() != null ? run.getStartedAt().toString() : "N/A", metaFont);
            addMetaRow(metaTable, "Duration:", run.getTotalDurationMs() + " ms", metaFont);
            addMetaRow(metaTable, "Overall Status:", run.getStatus(), metaFont);
            document.add(metaTable);

            // Summary Table
            PdfPTable summaryTable = new PdfPTable(5);
            summaryTable.setWidthPercentage(100);
            summaryTable.setSpacingAfter(20);

            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE);
            Color headerBg = new Color(30, 41, 59);

            addCell(summaryTable, "Total Requests", headerFont, headerBg);
            addCell(summaryTable, "Passed", headerFont, new Color(16, 185, 129));
            addCell(summaryTable, "Failed", headerFont, new Color(239, 68, 68));
            addCell(summaryTable, "Total Assertions", headerFont, headerBg);
            addCell(summaryTable, "Pass Rate", headerFont, headerBg);

            Font cellFont = FontFactory.getFont(FontFactory.HELVETICA, 11, Color.BLACK);
            double passRate = run.getTotalAssertions() > 0 ? (run.getPassedAssertions() * 100.0 / run.getTotalAssertions()) : (run.getFailedRequests() == 0 ? 100.0 : 0.0);

            addCell(summaryTable, String.valueOf(run.getTotalRequests()), cellFont, Color.WHITE);
            addCell(summaryTable, String.valueOf(run.getPassedRequests()), cellFont, Color.WHITE);
            addCell(summaryTable, String.valueOf(run.getFailedRequests()), cellFont, Color.WHITE);
            addCell(summaryTable, String.valueOf(run.getTotalAssertions()), cellFont, Color.WHITE);
            addCell(summaryTable, String.format("%.1f%%", passRate), cellFont, Color.WHITE);

            document.add(summaryTable);

            // Requests Section
            Paragraph reqHeading = new Paragraph("Executed Requests", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, Color.BLACK));
            reqHeading.setSpacingAfter(10);
            document.add(reqHeading);

            PdfPTable reqTable = new PdfPTable(new float[]{1.5f, 3.5f, 1.2f, 1.5f, 1.5f});
            reqTable.setWidthPercentage(100);
            reqTable.setSpacingAfter(20);

            addCell(reqTable, "Method", headerFont, headerBg);
            addCell(reqTable, "Request Name", headerFont, headerBg);
            addCell(reqTable, "Status Code", headerFont, headerBg);
            addCell(reqTable, "Duration", headerFont, headerBg);
            addCell(reqTable, "Result", headerFont, headerBg);

            for (TestRunItemDto item : run.getItems()) {
                addCell(reqTable, item.getMethod(), cellFont, Color.WHITE);
                addCell(reqTable, item.getRequestName(), cellFont, Color.WHITE);
                addCell(reqTable, item.getStatusCode() != null ? String.valueOf(item.getStatusCode()) : "ERR", cellFont, Color.WHITE);
                addCell(reqTable, (item.getResponseTimeMs() != null ? item.getResponseTimeMs() : 0) + " ms", cellFont, Color.WHITE);

                Color resColor = "PASSED".equals(item.getStatus()) ? new Color(220, 252, 231) : new Color(254, 226, 226);
                Font resFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, "PASSED".equals(item.getStatus()) ? new Color(22, 101, 52) : new Color(153, 27, 27));
                addCell(reqTable, item.getStatus(), resFont, resColor);
            }
            document.add(reqTable);

            document.close();
            return out.toByteArray();
        } catch (Exception ex) {
            throw new RuntimeException("Failed to generate PDF report: " + ex.getMessage(), ex);
        }
    }

    @Transactional(readOnly = true)
    public String generateCsvReport(UUID runId) {
        TestRunDto run = getRunDetails(runId);
        StringWriter writer = new StringWriter();

        try (CSVPrinter printer = new CSVPrinter(writer, CSVFormat.DEFAULT.builder()
                .setHeader("RunId", "Collection", "Environment", "RequestName", "Method", "ExecutedUrl",
                        "StatusCode", "ResponseTimeMs", "RequestStatus", "AssertionName", "AssertionType",
                        "Target", "Operator", "ExpectedValue", "ActualValue", "AssertionPassed", "ErrorMessage")
                .build())) {

            for (TestRunItemDto item : run.getItems()) {
                if (item.getAssertionResults().isEmpty()) {
                    printer.printRecord(
                            run.getId(),
                            run.getCollectionName(),
                            run.getEnvironmentName(),
                            item.getRequestName(),
                            item.getMethod(),
                            item.getExecutedUrl(),
                            item.getStatusCode(),
                            item.getResponseTimeMs(),
                            item.getStatus(),
                            "", "", "", "", "", "", "",
                            item.getErrorMessage() != null ? item.getErrorMessage() : ""
                    );
                } else {
                    for (AssertionResultDto ar : item.getAssertionResults()) {
                        printer.printRecord(
                                run.getId(),
                                run.getCollectionName(),
                                run.getEnvironmentName(),
                                item.getRequestName(),
                                item.getMethod(),
                                item.getExecutedUrl(),
                                item.getStatusCode(),
                                item.getResponseTimeMs(),
                                item.getStatus(),
                                ar.getAssertionName(),
                                ar.getAssertionType(),
                                ar.getTarget(),
                                ar.getOperator(),
                                ar.getExpectedValue(),
                                ar.getActualValue(),
                                ar.isPassed(),
                                ar.getErrorMessage() != null ? ar.getErrorMessage() : ""
                        );
                    }
                }
            }
            return writer.toString();
        } catch (Exception ex) {
            throw new RuntimeException("Failed to generate CSV report: " + ex.getMessage(), ex);
        }
    }

    private void addMetaRow(PdfPTable table, String label, String value, Font font) {
        PdfPCell c1 = new PdfPCell(new Phrase(label, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.BLACK)));
        c1.setBorder(Rectangle.NO_BORDER);
        table.addCell(c1);

        PdfPCell c2 = new PdfPCell(new Phrase(value, font));
        c2.setBorder(Rectangle.NO_BORDER);
        table.addCell(c2);
    }

    private void addCell(PdfPTable table, String text, Font font, Color bg) {
        PdfPCell cell = new PdfPCell(new Phrase(text != null ? text : "", font));
        cell.setBackgroundColor(bg);
        cell.setPadding(6);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        table.addCell(cell);
    }

    private TestRunDto toSummaryDto(TestRun tr) {
        return TestRunDto.builder()
                .id(tr.getId())
                .workspaceId(tr.getWorkspace().getId())
                .projectId(tr.getProject() != null ? tr.getProject().getId() : null)
                .projectName(tr.getProject() != null ? tr.getProject().getName() : null)
                .collectionId(tr.getCollection() != null ? tr.getCollection().getId() : null)
                .collectionName(tr.getCollection() != null ? tr.getCollection().getName() : null)
                .environmentId(tr.getEnvironment() != null ? tr.getEnvironment().getId() : null)
                .environmentName(tr.getEnvironment() != null ? tr.getEnvironment().getName() : null)
                .status(tr.getStatus())
                .totalRequests(tr.getTotalRequests())
                .passedRequests(tr.getPassedRequests())
                .failedRequests(tr.getFailedRequests())
                .totalAssertions(tr.getTotalAssertions())
                .passedAssertions(tr.getPassedAssertions())
                .failedAssertions(tr.getFailedAssertions())
                .totalDurationMs(tr.getTotalDurationMs())
                .triggeredByName(tr.getTriggeredBy() != null ? tr.getTriggeredBy().getFullName() : "Anonymous")
                .startedAt(tr.getStartedAt())
                .completedAt(tr.getCompletedAt())
                .createdAt(tr.getCreatedAt())
                .items(new ArrayList<>())
                .build();
    }

    private TestRunDto toFullDto(TestRun tr, List<TestRunItemDto> items) {
        TestRunDto dto = toSummaryDto(tr);
        dto.setItems(items);
        return dto;
    }
}
