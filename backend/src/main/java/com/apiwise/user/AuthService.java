package com.apiwise.user;

import com.apiwise.environment.Environment;
import com.apiwise.environment.EnvironmentRepository;
import com.apiwise.environment.EnvironmentVariable;
import com.apiwise.environment.EnvironmentVariableRepository;
import com.apiwise.exception.BadRequestException;
import com.apiwise.exception.ResourceNotFoundException;
import com.apiwise.security.JwtTokenProvider;
import com.apiwise.security.UserPrincipal;
import com.apiwise.user.dto.AuthResponse;
import com.apiwise.user.dto.LoginRequest;
import com.apiwise.user.dto.RegisterRequest;
import com.apiwise.user.dto.UserDto;
import com.apiwise.workspace.Workspace;
import com.apiwise.workspace.WorkspaceMember;
import com.apiwise.workspace.WorkspaceMemberRepository;
import com.apiwise.workspace.WorkspaceRepository;
import com.apiwise.workspace.WorkspaceRole;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository memberRepository;
    private final EnvironmentRepository environmentRepository;
    private final EnvironmentVariableRepository variableRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email is already registered: " + email);
        }

        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .role("ROLE_USER")
                .build();

        user = userRepository.save(user);

        // Auto-create default workspace
        String slugBase = request.getFullName().toLowerCase().replaceAll("[^a-z0-9]", "-");
        if (slugBase.isBlank()) {
            slugBase = "workspace";
        }
        String slug = slugBase + "-" + UUID.randomUUID().toString().substring(0, 8);

        Workspace workspace = Workspace.builder()
                .name(request.getFullName().trim() + "'s Workspace")
                .slug(slug)
                .description("Default workspace for " + request.getFullName().trim())
                .owner(user)
                .build();
        workspace = workspaceRepository.save(workspace);

        WorkspaceMember member = WorkspaceMember.builder()
                .workspace(workspace)
                .user(user)
                .role(WorkspaceRole.OWNER)
                .build();
        memberRepository.save(member);

        // Auto-create default Development environment
        Environment environment = Environment.builder()
                .workspace(workspace)
                .name("Development")
                .isDefault(true)
                .build();
        environment = environmentRepository.save(environment);

        // Add default baseUrl variable
        EnvironmentVariable var = EnvironmentVariable.builder()
                .environment(environment)
                .key("baseUrl")
                .value("https://httpbin.org")
                .isSecret(false)
                .enabled(true)
                .build();
        variableRepository.save(var);

        String accessToken = tokenProvider.generateAccessToken(user.getId(), user.getEmail());
        String refreshToken = tokenProvider.generateRefreshToken(user.getId());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(toDto(user))
                .build();
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword())
        );

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getId()));

        String accessToken = tokenProvider.generateAccessToken(user.getId(), user.getEmail());
        String refreshToken = tokenProvider.generateRefreshToken(user.getId());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(toDto(user))
                .build();
    }

    @Transactional(readOnly = true)
    public AuthResponse refreshToken(String refreshToken) {
        if (!tokenProvider.validateToken(refreshToken)) {
            throw new BadRequestException("Invalid or expired refresh token");
        }
        UUID userId = tokenProvider.getUserIdFromToken(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        String newAccessToken = tokenProvider.generateAccessToken(user.getId(), user.getEmail());
        String newRefreshToken = tokenProvider.generateRefreshToken(user.getId());

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .user(toDto(user))
                .build();
    }

    @Transactional(readOnly = true)
    public UserDto getCurrentUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        return toDto(user);
    }

    private UserDto toDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
