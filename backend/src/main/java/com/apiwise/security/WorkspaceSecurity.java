package com.apiwise.security;

import com.apiwise.workspace.WorkspaceMember;
import com.apiwise.workspace.WorkspaceMemberRepository;
import com.apiwise.workspace.WorkspaceRepository;
import com.apiwise.workspace.WorkspaceRole;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component("workspaceSecurity")
@RequiredArgsConstructor
public class WorkspaceSecurity {

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository memberRepository;

    public boolean hasAccess(UUID workspaceId, String minimumRole) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal principal)) {
            return false;
        }

        UUID userId = principal.getId();

        // Check if workspace owner
        boolean isOwner = workspaceRepository.existsByIdAndOwnerId(workspaceId, userId);
        if (isOwner) {
            return true;
        }

        // Check membership role
        Optional<WorkspaceMember> memberOpt = memberRepository.findByWorkspaceIdAndUserId(workspaceId, userId);
        if (memberOpt.isEmpty()) {
            return false;
        }

        WorkspaceRole userRole = memberOpt.get().getRole();
        WorkspaceRole required = WorkspaceRole.valueOf(minimumRole.toUpperCase());

        return userRole.getLevel() >= required.getLevel();
    }
}
