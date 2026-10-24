package com.apiwise.workspace;

public enum WorkspaceRole {
    VIEWER(10),
    MEMBER(20),
    ADMIN(30),
    OWNER(40);

    private final int level;

    WorkspaceRole(int level) {
        this.level = level;
    }

    public int getLevel() {
        return level;
    }
}
