import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { workspaceService } from '../../services/appServices';
import {
  Layers,
  Plus,
  LogOut,
  ChevronDown,
  Sparkles,
  Zap,
  Globe,
  Settings,
  Shield,
  User as UserIcon,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    user,
    workspaces,
    activeWorkspace,
    setActiveWorkspace,
    refreshWorkspaces,
    environments,
    activeEnvironment,
    setActiveEnvironment,
    logout,
  } = useAuth();

  const navigate = useNavigate();

  const [isWsOpen, setIsWsOpen] = useState(false);
  const [isEnvOpen, setIsEnvOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showCreateWsModal, setShowCreateWsModal] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsDesc, setNewWsDesc] = useState('');
  const [isCreatingWs, setIsCreatingWs] = useState(false);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    try {
      setIsCreatingWs(true);
      const created = await workspaceService.create({
        name: newWsName.trim(),
        description: newWsDesc.trim(),
      });
      await refreshWorkspaces();
      setActiveWorkspace(created);
      setShowCreateWsModal(false);
      setNewWsName('');
      setNewWsDesc('');
    } catch (err: any) {
      alert(err.message || 'Failed to create workspace');
    } finally {
      setIsCreatingWs(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="h-14 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-4">
        {/* Left: Brand & Workspace Switcher */}
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
              APIWise
            </span>
            <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              v1.0
            </span>
          </Link>

          <div className="h-4 w-px bg-slate-800" />

          {/* Workspace Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setIsWsOpen(!isWsOpen);
                setIsEnvOpen(false);
                setIsProfileOpen(false);
              }}
              className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-200 transition-colors"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="max-w-[140px] truncate">
                {activeWorkspace ? activeWorkspace.name : 'Select Workspace'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isWsOpen && (
              <div className="absolute left-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="text-[10px] font-semibold uppercase text-slate-500 px-2 py-1">
                  Workspaces
                </div>
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      setActiveWorkspace(ws);
                      setIsWsOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      activeWorkspace?.id === ws.id
                        ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30'
                        : 'text-slate-300 hover:bg-slate-800/80'
                    }`}
                  >
                    <span className="truncate">{ws.name}</span>
                    <span className="text-[10px] text-slate-500 uppercase">{ws.userRole}</span>
                  </button>
                ))}
                <div className="my-1 border-t border-slate-800/60" />
                <button
                  onClick={() => {
                    setIsWsOpen(false);
                    setShowCreateWsModal(true);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-indigo-400 hover:bg-indigo-950/40 flex items-center space-x-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Workspace</span>
                </button>
              </div>
            )}
          </div>

          {/* Environment Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setIsEnvOpen(!isEnvOpen);
                setIsWsOpen(false);
                setIsProfileOpen(false);
              }}
              className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-200 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span className="max-w-[130px] truncate">
                {activeEnvironment ? activeEnvironment.name : 'No Environment'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isEnvOpen && (
              <div className="absolute left-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="text-[10px] font-semibold uppercase text-slate-500 px-2 py-1">
                  Active Environment
                </div>
                <button
                  onClick={() => {
                    setActiveEnvironment(null);
                    setIsEnvOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                    activeEnvironment === null
                      ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30'
                      : 'text-slate-400 hover:bg-slate-800/80'
                  }`}
                >
                  No Environment (Globals Only)
                </button>
                {environments.map((env) => (
                  <button
                    key={env.id}
                    onClick={() => {
                      setActiveEnvironment(env);
                      setIsEnvOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      activeEnvironment?.id === env.id
                        ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30'
                        : 'text-slate-300 hover:bg-slate-800/80'
                    }`}
                  >
                    <span className="truncate">{env.name}</span>
                    {env.isDefault && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400">
                        Default
                      </span>
                    )}
                  </button>
                ))}
                <div className="my-1 border-t border-slate-800/60" />
                <button
                  onClick={() => {
                    setIsEnvOpen(false);
                    navigate('/environments');
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-indigo-400 hover:bg-indigo-950/40 flex items-center space-x-1.5 transition-colors"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Manage Environments</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick Actions & Profile */}
        <div className="flex items-center space-x-3">
          <Link
            to="/openapi"
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>OpenAPI Import</span>
          </Link>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => {
                setIsProfileOpen(!isProfileOpen);
                setIsWsOpen(false);
                setIsEnvOpen(false);
              }}
              className="flex items-center space-x-2 p-1 pl-2 rounded-full hover:bg-slate-800/80 transition-colors border border-transparent hover:border-slate-800"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white shadow-sm">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2.5 py-2 border-b border-slate-800/80">
                  <p className="text-xs font-semibold text-white truncate">{user?.fullName}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                </div>
                <div className="py-1">
                  <Link
                    to="/settings"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>Workspace Settings</span>
                  </Link>
                </div>
                <div className="border-t border-slate-800/80 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-950/30 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Create Workspace Modal */}
      {showCreateWsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-white mb-1">Create New Workspace</h3>
            <p className="text-xs text-slate-400 mb-4">
              Workspaces isolate collections, projects, environment variables, and test runs.
            </p>
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Workspace Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Payments Team, Production APIs"
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="What is this workspace for?"
                  value={newWsDesc}
                  onChange={(e) => setNewWsDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateWsModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingWs}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                >
                  {isCreatingWs ? 'Creating...' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
