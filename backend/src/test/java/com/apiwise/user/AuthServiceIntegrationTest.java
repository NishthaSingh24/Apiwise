package com.apiwise.user;

import com.apiwise.exception.BadRequestException;
import com.apiwise.user.dto.AuthResponse;
import com.apiwise.user.dto.LoginRequest;
import com.apiwise.user.dto.RegisterRequest;
import com.apiwise.workspace.Workspace;
import com.apiwise.workspace.WorkspaceRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AuthServiceIntegrationTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WorkspaceRepository workspaceRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    @DisplayName("User registration should hash password and auto-create default workspace")
    void shouldRegisterUserAndCreateWorkspace() {
        RegisterRequest req = RegisterRequest.builder()
                .fullName("Alex Morgan")
                .email("alex@example.com")
                .password("supersecret123")
                .build();

        AuthResponse resp = authService.register(req);

        assertNotNull(resp);
        assertNotNull(resp.getAccessToken());
        assertNotNull(resp.getRefreshToken());
        assertEquals("alex@example.com", resp.getUser().getEmail());
        assertEquals("Alex Morgan", resp.getUser().getFullName());

        // Verify password hash in DB
        User dbUser = userRepository.findByEmail("alex@example.com").orElseThrow();
        assertNotEquals("supersecret123", dbUser.getPasswordHash());
        assertTrue(passwordEncoder.matches("supersecret123", dbUser.getPasswordHash()));

        // Verify workspace was auto-created
        List<Workspace> workspaces = workspaceRepository.findAllUserAccessibleWorkspaces(dbUser.getId());
        assertEquals(1, workspaces.size());
        assertEquals("Alex Morgan's Workspace", workspaces.get(0).getName());
    }

    @Test
    @DisplayName("Duplicate registration should be rejected")
    void shouldRejectDuplicateEmail() {
        RegisterRequest req1 = RegisterRequest.builder()
                .fullName("Taylor Swift")
                .email("taylor@example.com")
                .password("password123")
                .build();
        authService.register(req1);

        RegisterRequest req2 = RegisterRequest.builder()
                .fullName("Taylor Duplicate")
                .email("taylor@example.com")
                .password("otherpassword")
                .build();

        assertThrows(BadRequestException.class, () -> authService.register(req2));
    }

    @Test
    @DisplayName("User login should authenticate and issue JWT")
    void shouldLoginSuccessfully() {
        RegisterRequest regReq = RegisterRequest.builder()
                .fullName("Sam Wilson")
                .email("sam@example.com")
                .password("falcon123")
                .build();
        authService.register(regReq);

        LoginRequest loginReq = LoginRequest.builder()
                .email("sam@example.com")
                .password("falcon123")
                .build();

        AuthResponse loginResp = authService.login(loginReq);
        assertNotNull(loginResp);
        assertNotNull(loginResp.getAccessToken());
        assertEquals("sam@example.com", loginResp.getUser().getEmail());
    }
}
