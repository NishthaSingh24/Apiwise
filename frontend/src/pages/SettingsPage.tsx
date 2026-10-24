import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { workspaceService, aiService } from '../services/appServices';
import { WorkspaceMember, WorkspaceRole } from '../types';
import {
  Settings,
  Users,
  Shield,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  Lock,
  Zap,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { activeWorkspace, user, refreshWorkspaces } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isUpdatingWs, setIsUpdatingWs] = useState(false);
  const [wsUpdateSuccess, setWsUpdateSuccess] = useState(false);

  // Members
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>('MEMBER');
  const [isInviting, setIsInviting] = useState(false);

  // AI Assistant Diagnostic
  const [aiTestResult, setAiTestResult] = useState<string | null>(null);
  const [isTestingAi, setIsTestingAi] = useState(false);

  useEffect(() => {
    if (activeWorkspace) {
      setName(activeWorkspace.name);
      setDescription(activeWorkspace.description || '');
      loadMembers();
    }
  }, [activeWorkspace?.id]);

  const loadMembers = async () => {
    if (!activeWorkspace) return;
    setLoadingMembers(true);
    try {
      const list = await workspaceService.getMembers(activeWorkspace.id);
      setMembers(list);
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleUpdateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace || !name.trim()) return;
    setIsUpdatingWs(true);
    try {
      await workspaceService.update(activeWorkspace.id, {
        name: name.trim(),
        description: description.trim(),
      });
      await refreshWorkspaces();
      setWsUpdateSuccess(true);
      setTimeout(() => setWsUpdateSuccess(false), 2500);
    } catch (err: any) {
      alert(err.message || 'Failed to update workspace');
    } finally {
      setIsUpdatingWs(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace || !inviteEmail.trim()) return;
    setIsInviting(true);
    try {
      await workspaceService.addMember(activeWorkspace.id, inviteEmail.trim(), inviteRole);
      await loadMembers();
      setShowInviteModal(false);
      setInviteEmail('');
    } catch (err: any) {
      alert(err.message || 'Failed to add member');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!activeWorkspace || !confirm('Are you sure you want to remove this member?')) return;
    try {
      await workspaceService.removeMember(activeWorkspace.id, memberId);
      await loadMembers();
    } catch (err: any) {
      alert(err.message || 'Failed to remove member');
    }
  };

  const handleTestAi = async () => {
    setIsTestingAi(true);
    setAiTestResult(null);
    try {
      const suggestions = await aiService.generateAssertions({
        method: 'GET',
        url: 'https://httpbin.org/get',
        statusCode: 200,
        responseHeaders: '{"Content-Type": "application/json"}',
        responseBody: '{"origin": "1.2.3.4", "url": "https://httpbin.org/get"}',
      });
      setAiTestResult(`AI Module operational! Generated ${suggestions.length} rules.`);
    } catch (err: any) {
      setAiTestResult(`AI Diagnostic: ${err.message}`);
    } finally {
      setIsTestingAi(false);
    }
  };

  if (!activeWorkspace) {
    return <div className="p-8 text-center text-xs text-slate-400">Select a workspace first.</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-white flex items-center space-x-2">
          <Settings className="w-5 h-5 text-indigo-400" />
          <span>Workspace Settings & Access Control</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure workspace identity, team membership, roles, encryption, and AI test engines
        </p>
      </div>

      {/* Workspace Identity */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center space-x-2">
          <Zap className="w-4 h-4 text-indigo-400" />
          <span>General Information</span>
        </h2>

        <form onSubmit={handleUpdateWorkspace} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Workspace Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Workspace Slug (Unique identifier)
              </label>
              <input
                type="text"
                disabled
                value={activeWorkspace.slug}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {wsUpdateSuccess ? (
              <span className="text-xs text-emerald-400 font-semibold flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Workspace updated successfully!</span>
              </span>
            ) : (
              <span />
            )}

            <button
              type="submit"
              disabled={isUpdatingWs}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-glow disabled:opacity-50 transition-all cursor-pointer"
            >
              {isUpdatingWs ? 'Saving...' : 'Update Workspace'}
            </button>
          </div>
        </form>
      </div>

      {/* Team Membership */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Workspace Members ({members.length})</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Control access permissions and collaborator roles within this workspace
            </p>
          </div>

          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-glow transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Member</span>
          </button>
        </div>

        <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-xl overflow-hidden">
          {members.map((m) => (
            <div key={m.id} className="p-3.5 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-indigo-400">
                  {m.fullName.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-white flex items-center space-x-2">
                    <span>{m.fullName}</span>
                    {m.userId === user?.id && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        You
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">{m.email}</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {m.role}
                </span>

                {m.role !== 'OWNER' && (
                  <button
                    onClick={() => handleRemoveMember(m.id)}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title="Remove Member"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security & AI Status Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Security Info */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 text-xs">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Platform Security Architecture</span>
          </h3>
          <ul className="space-y-2 text-slate-300">
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>SSRF Guard: Prohibits loopback, RFC1918, link-local & cloud metadata</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>AES-256-GCM: Secret environment variables encrypted at rest</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>BCrypt & Stateless JWT: Short-lived bearer tokens</span>
            </li>
          </ul>
        </div>

        {/* AI Assistant Info */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>AI Assistant Status</span>
            </h3>
            <button
              onClick={handleTestAi}
              disabled={isTestingAi}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition-colors"
            >
              {isTestingAi ? 'Testing...' : 'Test AI Engine'}
            </button>
          </div>

          <p className="text-slate-400 leading-relaxed">
            The AI engine assists in draft assertion generation, negative test scenario creation, and defect explanations.
            If no external LLM API key is specified, APIWise automatically runs with high-precision rule heuristics without crashing.
          </p>

          {aiTestResult && (
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-indigo-300">
              {aiTestResult}
            </div>
          )}
        </div>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Add Member to Workspace</h3>
            <form onSubmit={handleInviteMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  User Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="collaborator@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Workspace Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as WorkspaceRole)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="VIEWER">VIEWER (Read-only access)</option>
                  <option value="MEMBER">MEMBER (Execute and create requests)</option>
                  <option value="ADMIN">ADMIN (Full management permissions)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
                >
                  {isInviting ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
