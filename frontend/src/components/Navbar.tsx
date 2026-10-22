import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  RotateCcw,
  Clock,
  Globe,
  Radio,
  CheckCircle,
  ShieldAlert,
  Sliders,
  Layers,
  Sparkles,
  GitGraph
} from 'lucide-react';
import { Project, HealthStatus } from '../types';

interface NavbarProps {
  project: Project | null;
  health: HealthStatus | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onResetDemo: () => Promise<void>;
  isResetting: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  project,
  health,
  activeTab,
  setActiveTab,
  onResetDemo,
  isResetting
}) => {
  const [timeLeft, setTimeLeft] = useState<string>('06:00:00');

  useEffect(() => {
    if (!project?.deadline) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const target = new Date(project.deadline).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft('00:00:00 - Overdue');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [project?.deadline]);

  const navItems = [
    { id: 'mission-control', label: 'Mission Control', icon: Activity },
    { id: 'dependencies', label: 'Dependency Flow', icon: GitGraph },
    { id: 'tasks', label: 'Task Management', icon: Layers },
    { id: 'recovery', label: 'Recovery Center', icon: Sparkles, badge: 'Adaptive' },
    { id: 'research', label: 'TinyFish Research', icon: Globe },
    { id: 'timeline', label: 'Activity Audit', icon: Clock }
  ];

  return (
    <header className="border-b border-[#1f2e4d] bg-[#090f1d]/95 backdrop-blur-md sticky top-0 z-50">
      {/* Top Header Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-cyan-500 p-[2px] shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-[#080d1a] rounded-[10px] flex items-center justify-center">
                <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                  TeamPulse
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  MVP 2026
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium tracking-wide">
                Detect. Diagnose. Recover.
              </p>
            </div>
          </div>

          {/* Center: Live Deadline Countdown */}
          <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#0e172a] border border-[#1f2e4d] shadow-inner">
            <Clock className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Deadline Countdown:
            </span>
            <span className="font-mono text-sm font-bold text-amber-300 tracking-wider">
              {timeLeft}
            </span>
          </div>

          {/* Right Status Controls */}
          <div className="flex items-center gap-3">
            {/* TinyFish Status Badge */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium border ${
                health?.tinyfish_configured
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              }`}
              title={
                health?.tinyfish_configured
                  ? 'TinyFish Search & Fetch Live API connected'
                  : 'TinyFish offline demo mode active (curated guidance). Set TINYFISH_API_KEY in .env to enable live search.'
              }
            >
              <Globe className="w-3.5 h-3.5" />
              <span>
                {health?.tinyfish_configured ? 'TinyFish: LIVE' : 'TinyFish: DEMO MODE'}
              </span>
            </div>

            {/* Risk Badge */}
            {project && (
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${
                  project.risk_level === 'HIGH'
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/40 shadow-sm shadow-rose-500/20'
                    : project.risk_level === 'MEDIUM'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/40'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40'
                }`}
              >
                {project.risk_level === 'HIGH' ? (
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>{project.risk_level} RISK</span>
              </div>
            )}

            {/* Reset Demo Button */}
            <button
              onClick={onResetDemo}
              disabled={isResetting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-[#142036] hover:bg-[#1a2c4e] border border-[#233558] transition-all duration-150 disabled:opacity-50"
              title="Reset the primary Hackathon App scenario to its initial blocked state for video presentation"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span>{isResetting ? 'Resetting...' : 'Reset Demo'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-bar */}
      <div className="bg-[#0b1222] border-t border-[#18253e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 overflow-x-auto py-1.5 scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-indigo-600/20 text-cyan-300 border border-indigo-500/40 shadow-sm shadow-indigo-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#121c32]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-semibold shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
