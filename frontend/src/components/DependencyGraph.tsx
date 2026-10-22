import React, { useState } from 'react';
import { Task } from '../types';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  GitFork,
  ArrowRight,
  ShieldAlert,
  Zap,
  Info
} from 'lucide-react';

interface DependencyGraphProps {
  tasks: Task[];
  onStartRecovery: (taskId: string) => void;
}

export const DependencyGraph: React.FC<DependencyGraphProps> = ({
  tasks,
  onStartRecovery
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string>('TASK-101');

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || tasks[0];

  // Visual layout coordinates for the tasks
  // Chain: TASK-101 -> TASK-102 -> TASK-103
  // Branch/Independent: TASK-104
  const nodeLayout: Record<string, { x: number; y: number }> = {
    'TASK-101': { x: 120, y: 150 },
    'TASK-102': { x: 420, y: 150 },
    'TASK-103': { x: 720, y: 150 },
    'TASK-104': { x: 420, y: 320 }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'BLOCKED':
        return {
          stroke: '#f43f5e',
          fill: '#881337',
          bg: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
          glow: 'rgba(244, 63, 94, 0.4)'
        };
      case 'WAITING':
        return {
          stroke: '#f59e0b',
          fill: '#78350f',
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
          glow: 'rgba(245, 158, 11, 0.3)'
        };
      case 'IN_PROGRESS':
        return {
          stroke: '#06b6d4',
          fill: '#164e63',
          bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50',
          glow: 'rgba(6, 182, 212, 0.3)'
        };
      case 'COMPLETED':
        return {
          stroke: '#10b981',
          fill: '#064e3b',
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
          glow: 'rgba(16, 185, 129, 0.3)'
        };
      default:
        return {
          stroke: '#64748b',
          fill: '#1e293b',
          bg: 'bg-slate-700/50 text-slate-300 border-slate-600',
          glow: 'transparent'
        };
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#0e172a] border border-[#1f2e4d] rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <GitFork className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                Sprint Dependency Architecture
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Visualizes the technical critical path. Click any task node to inspect its blocker context and downstream impact.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              Blocked (Bottleneck)
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Waiting
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Completed
            </span>
          </div>
        </div>

        {/* SVG Dependency Diagram */}
        <div className="relative bg-[#080d1a] border border-[#1b2842] rounded-xl p-4 overflow-x-auto">
          <svg className="w-full min-w-[850px] h-[400px]">
            <defs>
              {/* Arrowhead marker */}
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#6366f1" />
              </marker>
              <marker
                id="arrow-blocked"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#f43f5e" />
              </marker>

              {/* Glow filter */}
              <filter id="glow-rose" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Dependency Connectors (Lines) */}
            {/* TASK-101 -> TASK-102 (Dependency line: TASK-102 depends on TASK-101) */}
            <path
              d="M 230 150 L 310 150"
              stroke="#f43f5e"
              strokeWidth="3"
              strokeDasharray="6,4"
              className="animate-pulse"
              markerEnd="url(#arrow-blocked)"
            />
            {/* Text badge over link */}
            <text x="240" y="140" fill="#f43f5e" fontSize="10" fontFamily="monospace">
              BLOCKS
            </text>

            {/* TASK-102 -> TASK-103 (TASK-103 depends on TASK-102) */}
            <path
              d="M 530 150 L 610 150"
              stroke="#f59e0b"
              strokeWidth="2.5"
              markerEnd="url(#arrow)"
            />
            <text x="540" y="140" fill="#f59e0b" fontSize="10" fontFamily="monospace">
              STALLS
            </text>

            {/* Render Nodes */}
            {tasks.map((task) => {
              const pos = nodeLayout[task.id] || { x: 100, y: 100 };
              const colors = getStatusColor(task.status);
              const isSelected = selectedTaskId === task.id;

              return (
                <g
                  key={task.id}
                  transform={`translate(${pos.x}, ${pos.y - 45})`}
                  onClick={() => setSelectedTaskId(task.id)}
                  className="cursor-pointer transition-transform duration-200 hover:scale-105"
                >
                  {/* Node Outer Box */}
                  <rect
                    width="190"
                    height="90"
                    rx="12"
                    fill="#0d1527"
                    stroke={isSelected ? '#38bdf8' : colors.stroke}
                    strokeWidth={isSelected ? '3' : '2'}
                    filter={task.status === 'BLOCKED' ? 'url(#glow-rose)' : undefined}
                  />

                  {/* Top Bar for Task Code & Status */}
                  <rect width="190" height="26" rx="12" fill={colors.fill} opacity="0.3" />
                  <text
                    x="12"
                    y="18"
                    fill="#e2e8f0"
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {task.id}
                  </text>
                  <text
                    x="178"
                    y="18"
                    fill={colors.stroke}
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="end"
                  >
                    {task.status}
                  </text>

                  {/* Task Title */}
                  <text
                    x="12"
                    y="46"
                    fill="#f8fafc"
                    fontSize="11"
                    fontWeight="600"
                    width="166"
                  >
                    {task.title.length > 22 ? `${task.title.slice(0, 22)}...` : task.title}
                  </text>

                  {/* Owner & Effort */}
                  <text x="12" y="66" fill="#94a3b8" fontSize="10">
                    👤 {task.owner.split(' ')[0]} • ~{task.estimated_hours}h
                  </text>

                  {/* Overdue / Blocker Indicator */}
                  {task.status === 'BLOCKED' && (
                    <text x="12" y="80" fill="#f43f5e" fontSize="9" fontWeight="bold">
                      ⚠️ Stalling {task.downstream_ids.length} downstream tasks
                    </text>
                  )}
                  {task.status === 'WAITING' && (
                    <text x="12" y="80" fill="#f59e0b" fontSize="9">
                      ⏳ Waiting on {task.depends_on_ids.join(', ')}
                    </text>
                  )}
                  {task.status === 'COMPLETED' && (
                    <text x="12" y="80" fill="#10b981" fontSize="9" fontWeight="bold">
                      ✓ Ready & Verified
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Task Details Drawer */}
        {selectedTask && (
          <div className="mt-6 bg-[#121c32] border border-[#233558] rounded-xl p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-cyan-400">
                    {selectedTask.id}
                  </span>
                  <h3 className="text-base font-bold text-white">{selectedTask.title}</h3>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded font-mono uppercase font-bold border ${getStatusColor(selectedTask.status).bg}`}
                  >
                    {selectedTask.status}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  {selectedTask.description}
                </p>
              </div>

              {selectedTask.status === 'BLOCKED' && (
                <button
                  onClick={() => onStartRecovery(selectedTask.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 via-indigo-600 to-cyan-600 hover:from-rose-500 hover:to-cyan-500 shadow-md transition-all self-start md:self-center"
                >
                  <Zap className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Launch Blocker Recovery</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-[#1d2c4b] text-xs">
              <div>
                <span className="text-slate-400 block">Owner / Lead</span>
                <span className="font-semibold text-slate-200 mt-0.5 block">
                  {selectedTask.owner}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Upstream Dependencies</span>
                <span className="font-mono text-slate-200 mt-0.5 block">
                  {selectedTask.depends_on_ids.length > 0
                    ? selectedTask.depends_on_ids.join(', ')
                    : 'None (Root Node)'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Downstream Impact</span>
                <span className="font-mono text-amber-300 mt-0.5 block font-semibold">
                  {selectedTask.downstream_ids.length > 0
                    ? `Stalling ${selectedTask.downstream_ids.join(', ')}`
                    : 'None (Leaf Node)'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Last Telemetry</span>
                <span className="font-mono text-slate-200 mt-0.5 block">
                  {selectedTask.last_updated_hours_ago}h ago
                  {selectedTask.is_overdue && ' • Overdue'}
                </span>
              </div>
            </div>

            {selectedTask.blocker_description && (
              <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-start gap-2.5 text-xs text-rose-300">
                <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold text-rose-200">Reported Blocker:</strong>{' '}
                  {selectedTask.blocker_description}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
