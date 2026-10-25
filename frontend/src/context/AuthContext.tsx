import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Workspace, Environment } from '../types';
import { authService, workspaceService, environmentService } from '../services/appServices';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  setActiveWorkspace: (ws: Workspace | null) => void;
  environments: Environment[];
  activeEnvironment: Environment | null;
  setActiveEnvironment: (env: Environment | null) => void;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
  refreshWorkspaces: () => Promise<void>;
  refreshEnvironments: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('apiwise_user') : null;
      return saved && saved !== 'undefined' && saved !== 'null' ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => (typeof window !== 'undefined' ? localStorage.getItem('apiwise_token') : null));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(null);

  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [activeEnvironment, setActiveEnvironmentState] = useState<Environment | null>(null);

  const setActiveWorkspace = (ws: Workspace | null) => {
    setActiveWorkspaceState(ws);
    if (ws) {
      localStorage.setItem('apiwise_active_workspace_id', ws.id);
    } else {
      localStorage.removeItem('apiwise_active_workspace_id');
    }
  };

  const setActiveEnvironment = (env: Environment | null) => {
    setActiveEnvironmentState(env);
    if (env) {
      localStorage.setItem('apiwise_active_env_id', env.id);
    } else {
      localStorage.removeItem('apiwise_active_env_id');
    }
  };

  const refreshWorkspaces = async () => {
    if (!token) return;
    try {
      const wsList = await workspaceService.list();
      setWorkspaces(wsList);

      const savedWsId = localStorage.getItem('apiwise_active_workspace_id');
      const found = wsList.find((w) => w.id === savedWsId);
      if (found) {
        setActiveWorkspace(found);
      } else if (wsList.length > 0) {
        setActiveWorkspace(wsList[0]);
      } else {
        setActiveWorkspace(null);
      }
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    }
  };

  const refreshEnvironments = async () => {
    if (!activeWorkspace) {
      setEnvironments([]);
      setActiveEnvironment(null);
      return;
    }
    try {
      const envList = await environmentService.list(activeWorkspace.id);
      setEnvironments(envList);

      const savedEnvId = localStorage.getItem('apiwise_active_env_id');
      const found = envList.find((e) => e.id === savedEnvId);
      if (found) {
        setActiveEnvironment(found);
      } else {
        const def = envList.find((e) => e.isDefault);
        setActiveEnvironment(def || (envList.length > 0 ? envList[0] : null));
      }
    } catch (err) {
      console.error('Failed to load environments:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      const storedToken = localStorage.getItem('apiwise_token');
      if (storedToken) {
        try {
          const profile = await authService.me();
          setUser(profile);
          localStorage.setItem('apiwise_user', JSON.stringify(profile));
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (user && token) {
      refreshWorkspaces();
    }
  }, [user, token]);

  useEffect(() => {
    if (activeWorkspace) {
      refreshEnvironments();
    }
  }, [activeWorkspace?.id]);

  const login = async (email: string, pass: string) => {
    const res = await authService.login({ email, password: pass });
    setToken(res.accessToken);
    setUser(res.user);
    localStorage.setItem('apiwise_token', res.accessToken);
    localStorage.setItem('apiwise_user', JSON.stringify(res.user));
    await refreshWorkspaces();
  };

  const register = async (name: string, email: string, pass: string) => {
    const res = await authService.register({ fullName: name, email, password: pass });
    setToken(res.accessToken);
    setUser(res.user);
    localStorage.setItem('apiwise_token', res.accessToken);
    localStorage.setItem('apiwise_user', JSON.stringify(res.user));
    await refreshWorkspaces();
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setActiveWorkspace(null);
    setActiveEnvironment(null);
    setWorkspaces([]);
    setEnvironments([]);
    localStorage.removeItem('apiwise_token');
    localStorage.removeItem('apiwise_user');
    localStorage.removeItem('apiwise_active_workspace_id');
    localStorage.removeItem('apiwise_active_env_id');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        workspaces,
        activeWorkspace,
        setActiveWorkspace,
        environments,
        activeEnvironment,
        setActiveEnvironment,
        login,
        register,
        logout,
        refreshWorkspaces,
        refreshEnvironments,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
