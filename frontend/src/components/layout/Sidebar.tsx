import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Send,
  FolderGit2,
  ShieldCheck,
  PlayCircle,
  FileCode2,
  Layers,
  Clock,
  BarChart3,
  Settings,
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Request Builder', path: '/request-builder', icon: Send },
  { name: 'Collections', path: '/collections', icon: FolderGit2 },
  { name: 'Test Builder', path: '/test-builder', icon: ShieldCheck },
  { name: 'Collection Runner', path: '/runner', icon: PlayCircle },
  { name: 'OpenAPI Import', path: '/openapi', icon: FileCode2 },
  { name: 'Environments', path: '/environments', icon: Layers },
  { name: 'Execution History', path: '/history', icon: Clock },
  { name: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
  { name: 'Settings & Team', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-60 flex-shrink-0 border-r border-slate-800/80 bg-slate-950/60 backdrop-blur-sm flex flex-col justify-between p-3 select-none">
      <div className="space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Navigation
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-400 font-semibold border border-indigo-500/30 shadow-glow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Bottom system status indicator */}
      <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/60 text-xs">
        <div className="flex items-center space-x-2 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-medium text-[11px]">System Online</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">
          PostgreSQL Connected • SSRF Guard Active
        </p>
      </div>
    </aside>
  );
};
