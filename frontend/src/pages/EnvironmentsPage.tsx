import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { environmentService } from '../services/appServices';
import { Environment, EnvironmentVariable } from '../types';
import {
  Layers,
  Plus,
  Trash2,
  Lock,
  Unlock,
  Check,
  Star,
  Globe,
  Save,
  CheckCircle2,
} from 'lucide-react';

export const EnvironmentsPage: React.FC = () => {
  const {
    activeWorkspace,
    environments,
    refreshEnvironments,
    activeEnvironment,
    setActiveEnvironment,
  } = useAuth();

  const [selectedEnv, setSelectedEnv] = useState<Environment | null>(null);
  const [name, setName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [variables, setVariables] = useState<EnvironmentVariable[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New Environment Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [newEnvName, setNewEnvName] = useState('');

  useEffect(() => {
    if (environments.length > 0 && !selectedEnv) {
      handleSelectEnv(environments[0]);
    } else if (environments.length === 0) {
      setSelectedEnv(null);
      setVariables([]);
    }
  }, [environments]);

  const handleSelectEnv = (env: Environment) => {
    setSelectedEnv(env);
    setName(env.name);
    setIsDefault(env.isDefault);
    setVariables(
      env.variables && env.variables.length > 0
        ? [...env.variables, { key: '', value: '', isSecret: false, enabled: true }]
        : [{ key: '', value: '', isSecret: false, enabled: true }]
    );
    setSavedSuccess(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace || !selectedEnv || !name.trim()) return;

    const cleanVars = variables.filter((v) => v.key.trim() !== '');

    setIsSaving(true);
    try {
      const updated = await environmentService.update(activeWorkspace.id, selectedEnv.id, {
        name: name.trim(),
        isDefault,
        variables: cleanVars,
      });
      await refreshEnvironments();
      handleSelectEnv(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err: any) {
      alert(err.message || 'Failed to save environment');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNewEnv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace || !newEnvName.trim()) return;

    try {
      const created = await environmentService.create(activeWorkspace.id, {
        name: newEnvName.trim(),
        isDefault: environments.length === 0,
        variables: [
          { key: 'baseUrl', value: 'https://httpbin.org', isSecret: false, enabled: true },
        ],
      });
      await refreshEnvironments();
      handleSelectEnv(created);
      setShowNewModal(false);
      setNewEnvName('');
    } catch (err: any) {
      alert(err.message || 'Failed to create environment');
    }
  };

  const handleDeleteEnv = async (id: string) => {
    if (!activeWorkspace || !confirm('Are you sure you want to delete this environment?')) return;
    try {
      await environmentService.delete(activeWorkspace.id, id);
      await refreshEnvironments();
      setSelectedEnv(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete environment');
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-slate-950 overflow-hidden">
      {/* Environments List Sidebar */}
      <div className="w-64 border-r border-slate-800 bg-slate-900/30 flex flex-col justify-between">
        <div>
          <div className="p-3 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Environments
            </span>
            <button
              onClick={() => setShowNewModal(true)}
              className="p-1 rounded bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/30"
              title="Add Environment"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-2 space-y-1">
            {environments.map((env) => (
              <button
                key={env.id}
                onClick={() => handleSelectEnv(env)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                  selectedEnv?.id === env.id
                    ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30'
                    : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <span className="flex items-center space-x-2 truncate">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="truncate">{env.name}</span>
                </span>
                {env.isDefault && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 flex items-center space-x-1">
                    <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                    <span>Default</span>
                  </span>
                )}
              </button>
            ))}

            {environments.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-500">
                No environments yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Environment Editor */}
      <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
        {selectedEnv ? (
          <form onSubmit={handleSave} className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 px-6 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 font-bold text-sm text-white focus:outline-none focus:border-indigo-500"
                />

                <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-0"
                  />
                  <span>Set as Default</span>
                </label>
              </div>

              <div className="flex items-center space-x-3">
                {savedSuccess && (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Saved!</span>
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => handleDeleteEnv(selectedEnv.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  title="Delete Environment"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-glow disabled:opacity-50 transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Environment'}</span>
                </button>
              </div>
            </div>

            {/* Variable Editor Table */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 grid grid-cols-12 gap-3 pb-2 border-b border-slate-800">
                <span className="col-span-1 text-center">Active</span>
                <span className="col-span-4">Variable Key</span>
                <span className="col-span-5">Value</span>
                <span className="col-span-1 text-center">Secret</span>
                <span className="col-span-1 text-right">Delete</span>
              </div>

              {variables.map((variable, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-1 text-center">
                    <input
                      type="checkbox"
                      checked={variable.enabled}
                      onChange={(e) => {
                        const next = [...variables];
                        next[index].enabled = e.target.checked;
                        setVariables(next);
                      }}
                      className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-0"
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="e.g. baseUrl, apiKey"
                    value={variable.key}
                    onChange={(e) => {
                      const next = [...variables];
                      next[index].key = e.target.value;
                      if (index === variables.length - 1 && e.target.value) {
                        next.push({ key: '', value: '', isSecret: false, enabled: true });
                      }
                      setVariables(next);
                    }}
                    className="col-span-4 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />

                  <input
                    type={variable.isSecret ? 'password' : 'text'}
                    placeholder={variable.isSecret ? '••••••••' : 'variable value'}
                    value={variable.value}
                    onChange={(e) => {
                      const next = [...variables];
                      next[index].value = e.target.value;
                      setVariables(next);
                    }}
                    className="col-span-5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />

                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...variables];
                        next[index].isSecret = !next[index].isSecret;
                        setVariables(next);
                      }}
                      className={`p-1.5 rounded-lg transition-colors ${
                        variable.isSecret ? 'text-indigo-400 bg-indigo-950/40' : 'text-slate-500 hover:text-slate-300'
                      }`}
                      title={variable.isSecret ? 'Encrypted at rest' : 'Plaintext'}
                    >
                      {variable.isSecret ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="col-span-1 text-right">
                    {variables.length > 1 && index < variables.length - 1 && (
                      <button
                        type="button"
                        onClick={() => setVariables(variables.filter((_, i) => i !== index))}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <p className="text-[11px] text-slate-500 pt-3">
                Use in URLs and headers with syntax: <code className="text-indigo-400 font-mono">&#123;&#123;variableName&#125;&#125;</code>.
                Variables tagged with the lock icon are encrypted at rest using AES-256-GCM.
              </p>
            </div>
          </form>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-slate-500">
            Select or create an environment to manage variables.
          </div>
        )}
      </div>

      {/* New Environment Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">New Environment</h3>
            <form onSubmit={handleCreateNewEnv} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Environment Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Staging, Production, Local Docker"
                  value={newEnvName}
                  onChange={(e) => setNewEnvName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500"
                >
                  Create Environment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
