package com.apiwise.workspace;

import com.apiwise.environment.Environment;
import com.apiwise.environment.EnvironmentRepository;
import com.apiwise.environment.EnvironmentVariable;
import com.apiwise.environment.EnvironmentVariableRepository;
import com.apiwise.exception.BadRequestException;
import com.apiwise.exception.ResourceNotFoundException;
import com.apiwise.exception.UnauthorizedException;
import com.apiwise.user.User;
import com.apiwise.user.UserRepository;
import com.apiwise.workspace.dto.CreateWorkspaceRequest;
import com.apiwise.workspace.dto.WorkspaceDto;
import com.apiwise.workspace.dto.WorkspaceMemberDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final EnvironmentRepository environmentRepository;
    private final EnvironmentVariableRepository variableRepository;

    @Transactional(readOnly = true)
    public List<WorkspaceDto> getUserWorkspaces(UUID userId) {
        List<Workspace> workspaces = workspaceRepository.findAllUserAccessibleWorkspaces(userId);
        return workspaces.stream()
                .map(w -> toDto(w, userId))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WorkspaceDto getWorkspace(UUID workspaceId, UUID userId) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace", "id", workspaceId));
        return toDto(workspace, userId);
    }

    @Transactional
    public WorkspaceDto createWorkspace(CreateWorkspaceRequest request, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        String slugBase = request.getName().toLowerCase().replaceAll("[^a-z0-9]", "-");
        if (slugBase.isBlank()) {
            slugBase = "workspace";
        }
        String slug = slugBase + "-" + UUID.randomUUID().toString().substring(0, 8);

        Workspace workspace = Workspace.builder()
                .name(request.getName().trim())
                .slug(slug)
                .description(request.getDescription())
                .owner(user)
                .build();
        workspace = workspaceRepository.save(workspace);

        WorkspaceMember member = WorkspaceMember.builder()
                .workspace(workspace)
                .user(user)
                .role(WorkspaceRole.OWNER)
                .build();
        memberRepository.save(member);

        // Auto-create default environment
        Environment environment = Environment.builder()
                .workspace(workspace)
                .name("Development")
                .isDefault(true)
                .build();
        environment = environmentRepository.save(environment);

        EnvironmentVariable defaultVar = EnvironmentVariable.builder()
                .environment(environment)
                .key("baseUrl")
                .value("https://httpbin.org")
                .isSecret(false)
                .enabled(true)
                .build();
        variableRepository.save(defaultVar);

        return toDto(workspace, userId);
    }

    @Transactional
    public WorkspaceDto updateWorkspace(UUID workspaceId, CreateWorkspaceRequest request, UUID userId) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace", "id", workspaceId));

        assertRole(workspaceId, userId, WorkspaceRole.ADMIN);

        workspace.setName(request.getName().trim());
        workspace.setDescription(request.getDescription());
        workspace = workspaceRepository.save(workspace);

        return toDto(workspace, userId);
    }

    @Transactional
    public void deleteWorkspace(UUID workspaceId, UUID userId) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace", "id", workspaceId));

        if (!workspace.getOwner().getId().equals(userId)) {
            throw new UnauthorizedException("Only the workspace owner can delete this workspace");
        }

        workspaceRepository.delete(workspace);
    }

    @Transactional(readOnly = true)
    public List<WorkspaceMemberDto> getMembers(UUID workspaceId, UUID userId) {
        assertRole(workspaceId, userId, WorkspaceRole.VIEWER);
        return memberRepository.findByWorkspaceId(workspaceId).stream()
                .map(m -> WorkspaceMemberDto.builder()
                        .id(m.getId())
                        .userId(m.getUser().getId())
                        .email(m.getUser().getEmail())
                        .fullName(m.getUser().getFullName())
                        .role(m.getRole())
                        .createdAt(m.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public WorkspaceMemberDto addMember(UUID workspaceId, String email, WorkspaceRole role, UUID actorId) {
        assertRole(workspaceId, actorId, WorkspaceRole.ADMIN);

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace", "id", workspaceId));

        User targetUser = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        if (memberRepository.existsByWorkspaceIdAndUserId(workspaceId, targetUser.getId())) {
            throw new BadRequestException("User is already a member of this workspace");
        }

        WorkspaceMember member = WorkspaceMember.builder()
                .workspace(workspace)
                .user(targetUser)
                .role(role != null ? role : WorkspaceRole.MEMBER)
                .build();
        member = memberRepository.save(member);

        return WorkspaceMemberDto.builder()
                .id(member.getId())
                .userId(targetUser.getId())
                .email(targetUser.getEmail())
                .fullName(targetUser.getFullName())
                .role(member.getRole())
                .createdAt(member.getCreatedAt())
                .build();
    }

    @Transactional
    public void removeMember(UUID workspaceId, UUID memberId, UUID actorId) {
        assertRole(workspaceId, actorId, WorkspaceRole.ADMIN);
        WorkspaceMember member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("WorkspaceMember", "id", memberId));

        if (member.getRole() == WorkspaceRole.OWNER) {
            throw new BadRequestException("Cannot remove the workspace owner");
        }

        memberRepository.delete(member);
    }

    private void assertRole(UUID workspaceId, UUID userId, WorkspaceRole minRole) {
        boolean isOwner = workspaceRepository.existsByIdAndOwnerId(workspaceId, userId);
        if (isOwner) {
            return;
        }

        WorkspaceMember member = memberRepository.findByWorkspaceIdAndUserId(workspaceId, userId)
                .orElseThrow(() -> new UnauthorizedException("You are not a member of this workspace"));

        if (member.getRole().getLevel() < minRole.getLevel()) {
            throw new UnauthorizedException("Requires minimum role: " + minRole);
        }
    }

    private WorkspaceDto toDto(Workspace workspace, UUID userId) {
        WorkspaceRole role = WorkspaceRole.VIEWER;
        if (workspace.getOwner().getId().equals(userId)) {
            role = WorkspaceRole.OWNER;
        } else {
            var memberOpt = memberRepository.findByWorkspaceIdAndUserId(workspace.getId(), userId);
            if (memberOpt.isPresent()) {
                role = memberOpt.get().getRole();
            }
        }

        return WorkspaceDto.builder()
                .id(workspace.getId())
                .name(workspace.getName())
                .slug(workspace.getSlug())
                .description(workspace.getDescription())
                .ownerId(workspace.getOwner().getId())
                .ownerName(workspace.getOwner().getFullName())
                .userRole(role)
                .createdAt(workspace.getCreatedAt())
                .updatedAt(workspace.getUpdatedAt())
                .build();
    }
}
