package com.apiwise.execution;

import com.apiwise.exception.SsrfException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SsrfProtectionServiceTest {

    private SsrfProtectionService ssrfService;

    @BeforeEach
    void setUp() {
        // Strict production mode: loopback not allowed
        ssrfService = new SsrfProtectionService(false);
    }

    @Test
    @DisplayName("Should block loopback localhost")
    void shouldBlockLocalhost() {
        assertThrows(SsrfException.class, () -> ssrfService.validateUrl("http://localhost:8080/api"));
        assertThrows(SsrfException.class, () -> ssrfService.validateUrl("http://127.0.0.1:3000"));
    }

    @Test
    @DisplayName("Should block AWS/GCP cloud metadata IP")
    void shouldBlockCloudMetadata() {
        assertThrows(SsrfException.class, () -> ssrfService.validateUrl("http://169.254.169.254/latest/meta-data"));
        assertThrows(SsrfException.class, () -> ssrfService.validateUrl("http://metadata.google.internal/computeMetadata/v1/"));
    }

    @Test
    @DisplayName("Should block private IP addresses (RFC 1918)")
    void shouldBlockPrivateIps() {
        assertThrows(SsrfException.class, () -> ssrfService.validateUrl("http://10.0.0.1/admin"));
        assertThrows(SsrfException.class, () -> ssrfService.validateUrl("http://192.168.1.10/login"));
        assertThrows(SsrfException.class, () -> ssrfService.validateUrl("http://172.16.5.20:8000/internal"));
    }

    @Test
    @DisplayName("Should block non-http/https protocols")
    void shouldBlockNonHttpProtocols() {
        assertThrows(SsrfException.class, () -> ssrfService.validateUrl("file:///etc/passwd"));
        assertThrows(SsrfException.class, () -> ssrfService.validateUrl("ftp://ftp.example.com/data"));
        assertThrows(SsrfException.class, () -> ssrfService.validateUrl("gopher://example.com/test"));
    }

    @Test
    @DisplayName("Should allow safe public internet domains")
    void shouldAllowPublicDomains() {
        assertDoesNotThrow(() -> ssrfService.validateUrl("https://httpbin.org/get"));
        assertDoesNotThrow(() -> ssrfService.validateUrl("https://jsonplaceholder.typicode.com/todos/1"));
    }

    @Test
    @DisplayName("Should permit loopback when explicitly allowed for local testing mode")
    void shouldPermitLoopbackWhenConfigured() {
        SsrfProtectionService permissiveService = new SsrfProtectionService(true);
        assertDoesNotThrow(() -> permissiveService.validateUrl("http://localhost:8080/health"));
    }
}
