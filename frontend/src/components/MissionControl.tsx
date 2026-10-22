import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  ArrowRight,
  Sparkles,
  RefreshCw,
  GitPullRequest,
  CheckCircle2,
  Users,
  Search,
  Zap,
  Info
} from 'lucide-react';
import { Project, Task, RiskAssessment } from '../types';

interface MissionControlProps {
  project: Project | null;
  tasks: Task[];
  riskAssessment: RiskAssessment | null;
  isAnalyzing: boolean;
  onAnalyzeRisk: () => Promise<void>;
  onStartRecovery: (taskId?: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const MissionControl: React.FC<MissionControlProps> = ({
  project,
  tasks,
  riskAssessment,
  isAnalyzing,
  onAnalyzeRisk,
  onStartRecovery,
  onNavigateTab
}) => {
  const blockedTasks = tasks.filter((t) => t.status === 'BLOCKED' || t.has_blocker);
  const waitingTasks = tasks.filter((t) => t.status === 'WAITING');
  const overdueTasks = tasks.filter((t) => t.is_overdue);
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');

  // Primary bottleneck task
  const primaryBlocker = tasks.find((t) => t.id === 'TASK-101' || (t.status === 'BLOCKED' && t.downstream_ids.length > 0)) || blockedTasks[0];

  return (
    <div className="space-y-6">
      {/* Top Banner: Project Context & Capacity */}
      <div className="bg-[#0e172a] border border-[#1f2e4d] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {project?.name || 'Hackathon App — Live Collab Canvas'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Kritical Hacks 2026
              </span>
            </div>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              {project?.description ||
                'Adaptive project recovery monitoring. Identifies blocked upstream dependencies, runs TinyFish live technical research, and adapts recommendations.'}
            </p>

            {/* Team Capacity Badges */}
            <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-slate-400">
              <span className="flex items-center gap-1 font-medium text-slate-300">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                Team Roster:
              </span>
              <span className="px-2 py-0.5 bg-[#142036] rounded border border-[#233558] text-slate-300">
                Alex (Backend)
              </span>
              <span className="px-2 py-0.5 bg-[#142036] rounded border border-[#233558] text-slate-300">
                Maya (Frontend)
              </span>
              <span className="px-2 py-0.5 bg-[#142036] rounded border border-[#233558] text-slate-300">
                Devon (QA)
              </span>
              <span className="px-2 py-0.5 bg-[#142036] rounded border border-[#233558] text-slate-300">
                Sarah (Product/Pitch)
              </span>
            </div>
          </div>

          {/* Action Button: Live Risk Analysis */}
          <div className="flex items-center gap-3 self-start md:self-center">
            <button
              onClick={onAnalyzeRisk}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'Analyzing Risk Rules...' : 'Analyze Project Risk'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Prominent Recovery Hero Alert (When Bottleneck is Active) */}
      {primaryBlocker && primaryBlocker.status === 'BLOCKED' && (
        <div className="bg-gradient-to-r from-rose-950/40 via-[#181122] to-[#121c33] border-2 border-rose-500/50 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-500/20 rounded-xl text-rose-400 border border-rose-500/30 flex-shrink-0 animate-pulse">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    Active Blocker Bottleneck
                  </span>
                  <span className="text-xs text-rose-300/80 font-mono">
                    {primaryBlocker.id} • Last updated {primaryBlocker.last_updated_hours_ago}h ago
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  {primaryBlocker.title}: {primaryBlocker.blocker_description}
                </h3>
                <p className="text-sm text-slate-300 mt-1">
                  This task is stalling{' '}
                  <strong className="text-amber-300 font-semibold">
                    {primaryBlocker.downstream_ids.length} downstream tasks
                  </strong>{' '}
                  ({primaryBlocker.downstream_ids.join(', ')}). Without intervention, the project will
                  miss the deadline in {project?.hours_remaining || 6.0} hours.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto">
              <button
                onClick={() => onStartRecovery(primaryBlocker.id)}
                className="w-full lg:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-cyan-500 via-indigo-600 to-indigo-700 hover:from-cyan-400 hover:to-indigo-500 shadow-lg shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5"
              >
                <Sparkles className="w-4 h-4 text-cyan-200" />
                <span>Start Recovery with TinyFish</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4 Core Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Overall Risk */}
        <div className="bg-[#0e172a] border border-[#1f2e4d] rounded-xl p-4 shadow">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>PROJECT RISK LEVEL</span>
            <ShieldAlert
              className={`w-4 h-4 ${
                riskAssessment?.risk_level === 'HIGH'
                  ? 'text-rose-400'
                  : riskAssessment?.risk_level === 'MEDIUM'
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-black tracking-tight ${
                riskAssessment?.risk_level === 'HIGH'
                  ? 'text-rose-400'
                  : riskAssessment?.risk_level === 'MEDIUM'
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {riskAssessment?.risk_level || project?.risk_level || 'HIGH'}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Score: {riskAssessment?.score || 90}/100
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
            {riskAssessment?.summary || 'Critical bottleneck on primary API starving downstream tasks.'}
          </p>
        </div>

        {/* Metric 2: Deadline Countdown */}
        <div className="bg-[#0e172a] border border-[#1f2e4d] rounded-xl p-4 shadow">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>TIME REMAINING</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-300 tracking-tight font-mono">
              {project?.hours_remaining ? `${project.hours_remaining} hrs` : '6.0 hrs'}
            </span>
            <span className="text-xs text-slate-400">to submission</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Critical path requires ~
            {riskAssessment?.critical_path_hours || 7.0}h of remaining dev work.
          </p>
        </div>

        {/* Metric 3: Task Bottleneck Health */}
        <div className="bg-[#0e172a] border border-[#1f2e4d] rounded-xl p-4 shadow">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>TASK PIPELINE STATUS</span>
            <GitPullRequest className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-2xl font-black text-rose-400">{blockedTasks.length}</span>
            <span className="text-xs text-slate-400 font-medium">Blocked</span>
            <span className="text-xl font-bold text-amber-300">{waitingTasks.length}</span>
            <span className="text-xs text-slate-400 font-medium">Waiting</span>
            <span className="text-xl font-bold text-emerald-400">{completedTasks.length}</span>
            <span className="text-xs text-slate-400 font-medium">Done</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Total {tasks.length} tasks in active sprint.
          </p>
        </div>

        {/* Metric 4: Overdue & Stale Telemetry */}
        <div className="bg-[#0e172a] border border-[#1f2e4d] rounded-xl p-4 shadow">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>STALE & OVERDUE</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-400">
              {overdueTasks.length} Overdue
            </span>
            <span className="text-xs text-slate-400">
              ({tasks.filter((t) => t.last_updated_hours_ago >= 12).length} stale &gt;12h)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            TASK-101 has not provided updates in 20 hours.
          </p>
        </div>
      </div>

      {/* Transparent Risk Assessment Conditions (Explainability) */}
      <div className="bg-[#0e172a] border border-[#1f2e4d] rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Transparent Risk Rule Evaluation
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Evaluated by TeamPulse Deterministic Rules Engine
          </span>
        </div>

        {riskAssessment?.conditions && riskAssessment.conditions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {riskAssessment.conditions.map((cond, idx) => (
              <div
                key={idx}
                className="bg-[#121c32] border border-[#233558] rounded-xl p-3.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm text-slate-200">{cond.factor}</span>
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                        cond.severity === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : cond.severity === 'HIGH'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                      }`}
                    >
                      {cond.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {cond.description}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-[#1d2c4b] flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-medium text-slate-400">Impact:</span>
                  <span className="text-slate-300 text-right truncate ml-2">{cond.impact}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400 text-sm">
            Click &ldquo;Analyze Project Risk&rdquo; above to run the deterministic rule engine.
          </div>
        )}
      </div>

      {/* Quick Task Summary & Dependency Chain Preview */}
      <div className="bg-[#0e172a] border border-[#1f2e4d] rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white tracking-tight">
            Sprint Task Dependency Overview
          </h2>
          <button
            onClick={() => onNavigateTab('dependencies')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            <span>View Interactive Dependency Graph</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#142036] text-slate-400 uppercase font-mono text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-4 rounded-l-lg">Task ID</th>
                <th className="py-2.5 px-4">Title</th>
                <th className="py-2.5 px-4">Owner</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Upstream Dependencies</th>
                <th className="py-2.5 px-4">Downstream Impact</th>
                <th className="py-2.5 px-4 rounded-r-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1c2c4a]">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-[#121c32]/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-200">{task.id}</td>
                  <td className="py-3 px-4 font-medium text-white max-w-xs truncate">
                    {task.title}
                    {task.blocker_description && (
                      <p className="text-[11px] text-rose-400 truncate">
                        Blocker: {task.blocker_description}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-300">{task.owner}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                        task.status === 'BLOCKED'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : task.status === 'WAITING'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : task.status === 'COMPLETED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : task.status === 'IN_PROGRESS'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-slate-700/50 text-slate-400'
                      }`}
                    >
                      {task.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">
                    {task.depends_on_ids.length > 0 ? task.depends_on_ids.join(', ') : 'None (Root)'}
                  </td>
                  <td className="py-3 px-4 font-mono">
                    {task.downstream_ids.length > 0 ? (
                      <span className="text-amber-300 font-semibold">
                        Stalling {task.downstream_ids.length} tasks ({task.downstream_ids.join(', ')})
                      </span>
                    ) : (
                      <span className="text-slate-500">None</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {task.status === 'BLOCKED' && (
                      <button
                        onClick={() => onStartRecovery(task.id)}
                        className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1 shadow-sm transition-all"
                      >
                        <Zap className="w-3 h-3 text-cyan-300" />
                        <span>Recover</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
