package com.apiwise.report;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/runs/{runId}/export")
@RequiredArgsConstructor
@Tag(name = "Reports & Exports", description = "Export test reports to PDF and CSV")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/pdf")
    @Operation(summary = "Export test execution report as PDF")
    public ResponseEntity<byte[]> exportPdf(@PathVariable UUID runId) {
        byte[] pdfBytes = reportService.generatePdfReport(runId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"apiwise-run-" + runId + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }

    @GetMapping("/csv")
    @Operation(summary = "Export test execution results as CSV")
    public ResponseEntity<byte[]> exportCsv(@PathVariable UUID runId) {
        String csv = reportService.generateCsvReport(runId);
        byte[] csvBytes = csv.getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"apiwise-run-" + runId + ".csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csvBytes);
    }
}
