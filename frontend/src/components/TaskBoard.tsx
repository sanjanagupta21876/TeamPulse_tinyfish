import React, { useState } from 'react';
import { Task } from '../types';
import {
  Layers,
  Plus,
  Edit2,
  AlertTriangle,
  Clock,
  CheckCircle,
  ShieldAlert,
  ArrowRight,
  User,
  MessageSquare,
  Zap,
  X
} from 'lucide-react';

interface TaskBoardProps {
  tasks: Task[];
  onUpdateTask: (taskId: string, data: Partial<Task>) => Promise<void>;
  onCreateTask: (data: any) => Promise<void>;
  onStartRecovery: (taskId: string) => void;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({
  tasks,
  onUpdateTask,
  onCreateTask,
  onStartRecovery
}) => {
  const [filter, setFilter] = useState<string>('ALL');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [formId, setFormId] = useState<string>('');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formOwner, setFormOwner] = useState<string>('');
  const [formStatus, setFormStatus] = useState<any>('NOT_STARTED');
  const [formPriority, setFormPriority] = useState<any>('MEDIUM');
  const [formHours, setFormHours] = useState<number>(2.0);
  const [formDeps, setFormDeps] = useState<string[]>([]);
  const [formHasBlocker, setFormHasBlocker] = useState<boolean>(false);
  const [formBlockerDesc, setFormBlockerDesc] = useState<string>('');

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'ALL') return true;
    if (filter === 'BLOCKED') return t.status === 'BLOCKED' || t.has_blocker;
    if (filter === 'WAITING') return t.status === 'WAITING';
    if (filter === 'COMPLETED') return t.status === 'COMPLETED';
    return t.status === filter;
  });

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDescription(task.description || '');
    setFormOwner(task.owner);
    setFormStatus(task.status);
    setFormPriority(task.priority);
    setFormHours(task.estimated_hours);
    setFormDeps([...task.depends_on_ids]);
    setFormHasBlocker(task.has_blocker);
    setFormBlockerDesc(task.blocker_description || '');
    setErrorMessage(null);
  };

  const openCreateModal = () => {
    setIsCreating(true);
    setFormId(`TASK-${100 + tasks.length + 1}`);
    setFormTitle('');
    setFormDescription('');
    setFormOwner('Alex (Backend Lead)');
    setFormStatus('NOT_STARTED');
    setFormPriority('MEDIUM');
    setFormHours(2.0);
    setFormDeps([]);
    setFormHasBlocker(false);
    setFormBlockerDesc('');
    setErrorMessage(null);
  };

  const handleSaveEdit = async () => {
    if (!editingTask) return;
    try {
      await onUpdateTask(editingTask.id, {
        title: formTitle,
        description: formDescription,
        owner: formOwner,
        status: formStatus,
        priority: formPriority,
        estimated_hours: formHours,
        depends_on_ids: formDeps,
        has_blocker: formHasBlocker,
        blocker_description: formHasBlocker ? formBlockerDesc : undefined
      });
      setEditingTask(null);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update task');
    }
  };

  const handleSaveCreate = async () => {
    try {
      await onCreateTask({
        id: formId,
        project_id: tasks[0]?.project_id || 'hackathon-app-2026',
        title: formTitle,
        description: formDescription,
        owner: formOwner,
        status: formStatus,
        priority: formPriority,
        estimated_hours: formHours,
        depends_on_ids: formDeps,
        has_blocker: formHasBlocker,
        blocker_description: formHasBlocker ? formBlockerDesc : undefined
      });
      setIsCreating(false);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create task');
    }
  };

  const toggleDep = (depId: string) => {
    if (formDeps.includes(depId)) {
      setFormDeps(formDeps.filter((id) => id !== depId));
    } else {
      setFormDeps([...formDeps, depId]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Task Board Header */}
      <div className="bg-[#0e172a] border border-[#1f2e4d] rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Sprint Task Inventory
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Persisted in SQLite database. Dependency validation prevents circular references.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter Pills */}
          <div className="flex items-center bg-[#142036] p-1 rounded-xl border border-[#233558] text-xs">
            {['ALL', 'BLOCKED', 'WAITING', 'COMPLETED'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  filter === f
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 shadow-md shadow-cyan-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Task Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className={`bg-[#0d1527] border rounded-2xl p-5 shadow-lg relative flex flex-col justify-between transition-all ${
              task.status === 'BLOCKED'
                ? 'border-rose-500/50 shadow-rose-950/20'
                : task.status === 'WAITING'
                ? 'border-amber-500/40'
                : 'border-[#1f2e4d]'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#16233d] text-cyan-400 border border-[#24375e]">
                    {task.id}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                      task.status === 'BLOCKED'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : task.status === 'WAITING'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : task.status === 'COMPLETED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-700/50 text-slate-300'
                    }`}
                  >
                    {task.status}
                  </span>
                  {task.is_overdue && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-900/60 text-rose-300 border border-rose-700">
                      OVERDUE
                    </span>
                  )}
                </div>

                <button
                  onClick={() => openEditModal(task)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a2948] transition-all"
                  title="Edit Task & Dependencies"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <h3 className="text-base font-bold text-white mt-2.5">{task.title}</h3>
              <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                {task.description || 'No description provided.'}
              </p>

              {/* Blocker alert box if blocked */}
              {task.blocker_description && (
                <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                  <div className="flex items-center gap-1.5 font-bold text-rose-200">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    <span>Reported Blocker</span>
                  </div>
                  <p className="mt-1 text-slate-200 font-medium">{task.blocker_description}</p>
                </div>
              )}

              {/* Upstream / Downstream Metadata */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[#1a2846] text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Upstream Dependencies:</span>
                  <span className="font-mono text-slate-300 font-medium">
                    {task.depends_on_ids.length > 0 ? task.depends_on_ids.join(', ') : 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Downstream Impact:</span>
                  <span className="font-mono text-amber-300 font-semibold">
                    {task.downstream_ids.length > 0
                      ? `Stalling ${task.downstream_ids.join(', ')}`
                      : 'None'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Row: Owner, Last Updated & Actions */}
            <div className="mt-4 pt-3 border-t border-[#1a2846] flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-slate-300">{task.owner}</span>
                <span className="text-slate-500">•</span>
                <span className="font-mono">~{task.estimated_hours}h</span>
              </div>

              <div className="flex items-center gap-2">
                {task.status === 'BLOCKED' && (
                  <button
                    onClick={() => onStartRecovery(task.id)}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition-all"
                  >
                    <Zap className="w-3 h-3 text-cyan-300" />
                    <span>Recover</span>
                  </button>
                )}
                {task.status !== 'COMPLETED' && (
                  <button
                    onClick={() => onUpdateTask(task.id, { status: 'COMPLETED' })}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/30 transition-all"
                  >
                    <CheckCircle className="w-3 h-3" />
                    <span>Resolve</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Create Task Modal */}
      {(editingTask || isCreating) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0e172a] border border-[#233558] rounded-2xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#1f2e4d]">
              <h3 className="text-lg font-bold text-white">
                {isCreating ? 'Create Sprint Task' : `Edit ${editingTask?.id}`}
              </h3>
              <button
                onClick={() => {
                  setEditingTask(null);
                  setIsCreating(false);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-4 mt-4 text-xs">
              {isCreating && (
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Task ID</label>
                  <input
                    type="text"
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    className="w-full bg-[#142036] border border-[#24375e] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
              )}

              <div>
                <label className="text-slate-300 font-medium block mb-1">Task Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-[#142036] border border-[#24375e] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                  placeholder="e.g. Backend REST API Endpoints"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-[#142036] border border-[#24375e] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Owner</label>
                  <input
                    type="text"
                    value={formOwner}
                    onChange={(e) => setFormOwner(e.target.value)}
                    className="w-full bg-[#142036] border border-[#24375e] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full bg-[#142036] border border-[#24375e] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="NOT_STARTED">NOT_STARTED</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="WAITING">WAITING</option>
                    <option value="BLOCKED">BLOCKED</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Priority</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value)}
                    className="w-full bg-[#142036] border border-[#24375e] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formHours}
                    onChange={(e) => setFormHours(parseFloat(e.target.value) || 1)}
                    className="w-full bg-[#142036] border border-[#24375e] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Upstream Dependencies Selection */}
              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Upstream Dependencies (Tasks this task depends on)
                </label>
                <div className="space-y-1.5 max-h-32 overflow-y-auto p-2 bg-[#121c32] rounded-xl border border-[#24375e]">
                  {tasks
                    .filter((t) => (editingTask ? t.id !== editingTask.id : true))
                    .map((t) => (
                      <label
                        key={t.id}
                        className="flex items-center gap-2 cursor-pointer hover:bg-[#1a2948] p-1 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={formDeps.includes(t.id)}
                          onChange={() => toggleDep(t.id)}
                          className="rounded border-slate-600 text-indigo-600 focus:ring-0"
                        />
                        <span className="font-mono text-cyan-300 font-semibold">{t.id}</span>
                        <span className="text-slate-300 truncate">{t.title}</span>
                      </label>
                    ))}
                </div>
              </div>

              {/* Blocker reporting toggle */}
              <div className="p-3 bg-[#121c32] rounded-xl border border-[#233558] space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formHasBlocker}
                    onChange={(e) => {
                      setFormHasBlocker(e.target.checked);
                      if (e.target.checked) setFormStatus('BLOCKED');
                    }}
                    className="rounded border-slate-600 text-rose-500 focus:ring-0"
                  />
                  <span className="text-rose-300 font-semibold">Report Technical Blocker</span>
                </label>

                {formHasBlocker && (
                  <div>
                    <label className="text-slate-400 block mb-1">Blocker Description</label>
                    <textarea
                      value={formBlockerDesc}
                      onChange={(e) => setFormBlockerDesc(e.target.value)}
                      placeholder="e.g. API integration is failing because the API contract is unclear."
                      className="w-full bg-[#16233d] border border-rose-500/40 rounded-lg px-2.5 py-1.5 text-white focus:outline-none"
                      rows={2}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-[#1f2e4d]">
              <button
                onClick={() => {
                  setEditingTask(null);
                  setIsCreating(false);
                }}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={isCreating ? handleSaveCreate : handleSaveEdit}
                className="px-5 py-2 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30"
              >
                {isCreating ? 'Create Task' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
