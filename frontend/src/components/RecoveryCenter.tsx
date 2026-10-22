import React, { useState } from 'react';
import {
  RecoveryPlan,
  Task,
  Project,
  ResearchSource,
  VerificationOutcome
} from '../types';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertOctagon,
  Clock,
  ArrowRight,
  ExternalLink,
  RotateCw,
  Edit3,
  ThumbsUp,
  ThumbsDown,
  Info,
  GitCommit,
  CheckCircle,
  FileText,
  Zap,
  Globe,
  CornerDownRight
} from 'lucide-react';

interface RecoveryCenterProps {
  project: Project | null;
  tasks: Task[];
  activePlan: RecoveryPlan | null;
  recoveryHistory: RecoveryPlan[];
  isGenerating: boolean;
  onGeneratePlan: (taskId: string, context?: string) => Promise<void>;
  onApprovePlan: (planId: string, notes?: string, customAction?: string) => Promise<void>;
  onRejectPlan: (planId: string, reason: string) => Promise<void>;
  onVerifyPlan: (
    planId: string,
    outcome: 'RESOLVED' | 'PARTIALLY_RESOLVED' | 'STILL_BLOCKED',
    notes: string
  ) => Promise<void>;
  onNavigateTab: (tab: string) => void;
}

export const RecoveryCenter: React.FC<RecoveryCenterProps> = ({
  project,
  tasks,
  activePlan,
  recoveryHistory,
  isGenerating,
  onGeneratePlan,
  onApprovePlan,
  onRejectPlan,
  onVerifyPlan,
  onNavigateTab
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string>('TASK-101');
  const [isEditingAction, setIsEditingAction] = useState<boolean>(false);
  const [editedActionText, setEditedActionText] = useState<string>('');

  // Verification outcome state
  const [outcomeType, setOutcomeType] = useState<'RESOLVED' | 'PARTIALLY_RESOLVED' | 'STILL_BLOCKED'>('STILL_BLOCKED');
  const [outcomeNotes, setOutcomeNotes] = useState<string>(
    'The API contract is documented, but the real integration is still failing with schema mismatches and 422 Unprocessable Entity.'
  );
  const [isSubmittingOutcome, setIsSubmittingOutcome] = useState<boolean>(false);

  const blockedTasks = tasks.filter((t) => t.status === 'BLOCKED' || t.has_blocker);
  const currentTask = tasks.find((t) => t.id === selectedTaskId) || blockedTasks[0] || tasks[0];

  // Preset follow-up outcomes for easy 1-click video demo presentation
  const demoScenarios = [
    {
      label: 'Demo Step 1: Still Blocked (Integration 422 Error)',
      type: 'STILL_BLOCKED' as const,
      text: 'The API contract is documented, but the real integration is still failing with schema mismatches and 422 Unprocessable Entity.'
    },
    {
      label: 'Demo Step 2: Fully Resolved (Payloads Aligned)',
      type: 'RESOLVED' as const,
      text: 'Payload schemas aligned and API contract integration test is passing with HTTP 200.'
    }
  ];

  const handleStartApproval = () => {
    if (!activePlan) return;
    onApprovePlan(activePlan.id, 'Approved by Hackathon Team Lead', isEditingAction ? editedActionText : undefined);
    setIsEditingAction(false);
  };

  const handleVerificationSubmit = async () => {
    if (!activePlan) return;
    setIsSubmittingOutcome(true);
    try {
      await onVerifyPlan(activePlan.id, outcomeType, outcomeNotes);
    } finally {
      setIsSubmittingOutcome(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Core Differentiator Callout */}
      <div className="bg-gradient-to-r from-indigo-950/60 via-[#0e172a] to-[#08182b] border border-indigo-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/25">
                <Sparkles className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Adaptive Recovery Planning Engine
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                Live Feedback Loop
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-2 max-w-3xl leading-relaxed">
              <strong className="text-cyan-300">Core Differentiator:</strong> TeamPulse does not stop at detecting a problem or recommending an action. It validates whether the intervention worked and dynamically adapts its next recommendation when recovery fails.
            </p>
          </div>

          {/* Quick Target Task Selector */}
          <div className="flex items-center gap-3">
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="bg-[#121c32] border border-[#233558] rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-400"
            >
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.id}: {t.title.slice(0, 24)}... ({t.status})
                </option>
              ))}
            </select>

            <button
              onClick={() => onGeneratePlan(selectedTaskId)}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-600 via-indigo-600 to-indigo-700 hover:from-cyan-500 hover:to-indigo-600 shadow-md shadow-cyan-600/20 transition-all disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Investigating with TinyFish...' : 'Generate Recovery Plan'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Recovery Plan Card */}
      {activePlan ? (
        <div className="bg-[#0e172a] border border-[#1f2e4d] rounded-2xl p-6 shadow-2xl space-y-5">
          {/* Plan Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1f2e4d]">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                    activePlan.iteration > 1
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 animate-pulse'
                      : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                  }`}
                >
                  {activePlan.iteration > 1 ? `ADAPTIVE RECOVERY #${activePlan.iteration}` : 'INTERVENTION #1'}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Target: <strong className="text-white">{activePlan.task_id}</strong>
                </span>
                <span
                  className={`text-xs font-mono uppercase font-bold px-2 py-0.5 rounded ${
                    activePlan.status === 'APPROVED'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : activePlan.status === 'PROPOSED'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : activePlan.status === 'RESOLVED'
                      ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {activePlan.status}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-2">{activePlan.title}</h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right text-xs">
                <span className="text-slate-400 block">Estimated Effort:</span>
                <span className="font-mono text-cyan-300 font-bold">
                  ~{activePlan.estimated_effort_minutes} mins (Estimated)
                </span>
              </div>
            </div>
          </div>

          {/* Recommended Action Body */}
          <div className="bg-[#121c32] border border-[#233558] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase font-mono font-bold tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                Recommended Action
              </span>
              {activePlan.status === 'PROPOSED' && !isEditingAction && (
                <button
                  onClick={() => {
                    setIsEditingAction(true);
                    setEditedActionText(activePlan.recommended_action);
                  }}
                  className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
                >
                  <Edit3 className="w-3 h-3" />
                  Edit Plan
                </button>
              )}
            </div>

            {isEditingAction ? (
              <div className="space-y-2">
                <textarea
                  value={editedActionText}
                  onChange={(e) => setEditedActionText(e.target.value)}
                  rows={4}
                  className="w-full bg-[#0a0f1d] border border-cyan-500/50 rounded-lg p-2.5 text-xs text-white font-mono focus:outline-none"
                />
                <div className="flex justify-end gap-2 text-xs">
                  <button
                    onClick={() => setIsEditingAction(false)}
                    className="px-3 py-1 rounded text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setIsEditingAction(false)}
                    className="px-3 py-1 rounded bg-cyan-600 text-white font-bold"
                  >
                    Save Draft
                  </button>
                </div>
              </div>
            ) : (
              <pre className="text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                {activePlan.recommended_action}
              </pre>
            )}
          </div>

          {/* Reason & Supporting Evidence */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-[#101a30] border border-[#1d2c4b] rounded-xl p-4">
              <span className="uppercase font-mono font-bold tracking-wider text-slate-400 block mb-2">
                Reason for Recommendation
              </span>
              <p className="text-slate-300 leading-relaxed">{activePlan.reason}</p>

              <div className="mt-3 pt-3 border-t border-[#1a2846]">
                <span className="text-slate-400 font-medium block mb-1">Tasks Unblocked:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {activePlan.tasks_unblocked.length > 0
                    ? activePlan.tasks_unblocked.join(', ')
                    : 'Downstream dependency chain'}
                </span>
              </div>
            </div>

            <div className="bg-[#101a30] border border-[#1d2c4b] rounded-xl p-4">
              <span className="uppercase font-mono font-bold tracking-wider text-slate-400 block mb-2">
                Supporting Evidence & Context
              </span>
              <ul className="space-y-1.5 list-disc list-inside text-slate-300">
                {activePlan.supporting_evidence.map((item, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-3 pt-3 border-t border-[#1a2846]">
                <span className="text-slate-400 font-medium block mb-1">Verification Condition:</span>
                <span className="text-cyan-300 font-medium">{activePlan.verification_condition}</span>
              </div>
            </div>
          </div>

          {/* TinyFish Research Evidence Sources */}
          {activePlan.sources && activePlan.sources.length > 0 && (
            <div className="bg-[#0b1222] border border-[#1b2842] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs uppercase font-mono font-bold text-slate-300 tracking-wider">
                    TinyFish Live Technical Evidence ({activePlan.sources.length} Sources)
                  </span>
                </div>
                <button
                  onClick={() => onNavigateTab('research')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
                >
                  <span>Explore Search Details</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {activePlan.sources.slice(0, 3).map((source) => (
                  <a
                    key={source.id}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 bg-[#121c32] hover:bg-[#16233d] border border-[#233558] hover:border-cyan-500/40 rounded-xl transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 text-[10px] font-mono text-cyan-400 mb-1">
                        <span className="truncate">{source.domain}</span>
                        <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 flex-shrink-0" />
                      </div>
                      <h4 className="text-xs font-semibold text-white line-clamp-1 group-hover:text-cyan-200">
                        {source.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {source.snippet}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono mt-2 block">
                      {source.is_live ? '✓ Live TinyFish' : 'Curated Fallback'}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* HUMAN APPROVAL CONTROLS (When Proposed) */}
          {activePlan.status === 'PROPOSED' && (
            <div className="p-4 bg-gradient-to-r from-indigo-950/40 to-[#121c33] border border-indigo-500/40 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-indigo-400 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-white">Human Approval Checkpoint</h4>
                  <p className="text-xs text-slate-300">
                    TeamPulse never executes or mutates external code without explicit Captain sign-off.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => onRejectPlan(activePlan.id, 'Action rejected by Team Lead')}
                  className="w-1/2 sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-500/10 border border-rose-500/30 transition-all flex items-center justify-center gap-1.5"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
                <button
                  onClick={handleStartApproval}
                  className="w-1/2 sm:w-auto px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Approve & Activate Plan</span>
                </button>
              </div>
            </div>
          )}

          {/* ADAPTIVE VERIFICATION CHECKPOINT (Active once approved) */}
          {activePlan.status === 'APPROVED' && (
            <div className="p-5 bg-gradient-to-r from-[#141b2d] via-[#10203a] to-[#121c33] border-2 border-cyan-500/50 rounded-2xl shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    Adaptive Verification Checkpoint: Did this intervention solve the blocker?
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-cyan-300 uppercase px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/30">
                  Adaptive Loop Active
                </span>
              </div>

              <p className="text-xs text-slate-300">
                Expected Condition:{' '}
                <strong className="text-cyan-200">{activePlan.verification_condition}</strong>
              </p>

              {/* Quick Preset Selector for Demo Video */}
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="text-slate-400 text-xs self-center font-mono">Demo Presets:</span>
                {demoScenarios.map((sc, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setOutcomeType(sc.type);
                      setOutcomeNotes(sc.text);
                    }}
                    className={`px-3 py-1 rounded-lg border text-xs font-medium transition-all ${
                      outcomeType === sc.type
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                        : 'bg-[#18243c] text-slate-300 border-[#24375e] hover:bg-[#1f2f4e]'
                    }`}
                  >
                    {sc.label}
                  </button>
                ))}
              </div>

              {/* Outcome Radio Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label
                  onClick={() => setOutcomeType('STILL_BLOCKED')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 ${
                    outcomeType === 'STILL_BLOCKED'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-200'
                      : 'bg-[#121c32] border-[#233558] text-slate-300 hover:bg-[#16233d]'
                  }`}
                >
                  <AlertOctagon className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-xs block">Still Blocked</span>
                    <span className="text-[10px] text-slate-400">Triggers adaptive next plan</span>
                  </div>
                </label>

                <label
                  onClick={() => setOutcomeType('PARTIALLY_RESOLVED')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 ${
                    outcomeType === 'PARTIALLY_RESOLVED'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                      : 'bg-[#121c32] border-[#233558] text-slate-300 hover:bg-[#16233d]'
                  }`}
                >
                  <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-xs block">Partially Resolved</span>
                    <span className="text-[10px] text-slate-400">Preserves work done</span>
                  </div>
                </label>

                <label
                  onClick={() => setOutcomeType('RESOLVED')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 ${
                    outcomeType === 'RESOLVED'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200'
                      : 'bg-[#121c32] border-[#233558] text-slate-300 hover:bg-[#16233d]'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-xs block">Fully Resolved</span>
                    <span className="text-[10px] text-slate-400">Unblocks downstream tasks</span>
                  </div>
                </label>
              </div>

              {/* Follow-up Notes Textarea */}
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-medium">
                  Follow-up Evidence / Result Notes:
                </label>
                <textarea
                  value={outcomeNotes}
                  onChange={(e) => setOutcomeNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-[#0a0f1d] border border-[#233558] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-sans"
                  placeholder="Describe what occurred during the recovery attempt..."
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleVerificationSubmit}
                  disabled={isSubmittingOutcome}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                  <span>
                    {isSubmittingOutcome
                      ? 'Adapting Plan...'
                      : outcomeType === 'RESOLVED'
                      ? 'Submit & Mark Task Resolved'
                      : 'Submit & Trigger Adaptive Next Recommendation'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Resolved Celebration Card */}
          {activePlan.status === 'RESOLVED' && (
            <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-xl flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-emerald-200">
                  Blocker Successfully Recovered!
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Task <strong className="text-white">{activePlan.task_id}</strong> is now COMPLETED.
                  Dependent tasks ({activePlan.tasks_unblocked.join(', ')}) have been unblocked to IN_PROGRESS.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-[#0e172a] border border-[#1f2e4d] rounded-2xl p-8 text-center shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-cyan-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mt-4">No Active Recovery Plan</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Select a blocked task above and click &ldquo;Generate Recovery Plan&rdquo; to launch TinyFish web research and produce an actionable recovery intervention.
          </p>
          <button
            onClick={() => onGeneratePlan('TASK-101')}
            disabled={isGenerating}
            className="mt-4 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition-all inline-flex items-center gap-2"
          >
            <Zap className="w-4 h-4 text-cyan-300" />
            <span>Recover Primary Blocker (TASK-101)</span>
          </button>
        </div>
      )}

      {/* Recovery History Timeline (The Evolution of the Plan) */}
      <div className="bg-[#0e172a] border border-[#1f2e4d] rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <GitCommit className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-bold text-white tracking-tight">
            Adaptive Recovery History Timeline
          </h2>
        </div>

        {recoveryHistory.length > 0 ? (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#1f2e4d]">
            {recoveryHistory.map((plan) => (
              <div key={plan.id} className="relative">
                {/* Timeline Node Dot */}
                <span
                  className={`absolute -left-6 top-1.5 w-4 h-4 rounded-full border-2 bg-[#080d1a] ${
                    plan.status === 'RESOLVED'
                      ? 'border-emerald-400'
                      : plan.iteration > 1
                      ? 'border-cyan-400 animate-pulse'
                      : 'border-indigo-400'
                  }`}
                />

                <div className="bg-[#121c32] border border-[#233558] rounded-xl p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-cyan-400">
                        Iteration #{plan.iteration}
                      </span>
                      <h4 className="text-sm font-bold text-white">{plan.title}</h4>
                    </div>
                    <span
                      className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded self-start ${
                        plan.status === 'RESOLVED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : plan.status === 'SUPERSEDED'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                      }`}
                    >
                      {plan.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-2 line-clamp-2">
                    {plan.recommended_action}
                  </p>

                  {/* Verification Outcome Log if any */}
                  {plan.verification_outcomes && plan.verification_outcomes.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#1d2c4b] space-y-2">
                      {plan.verification_outcomes.map((v) => (
                        <div
                          key={v.id}
                          className="flex items-start gap-2 text-xs bg-[#090f1d] p-2.5 rounded-lg border border-[#1b2842]"
                        >
                          <CornerDownRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-mono text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
                                  v.outcome === 'RESOLVED'
                                    ? 'text-emerald-400'
                                    : 'text-rose-400'
                                }`}
                              >
                                {v.outcome}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                Checkpoint Log
                              </span>
                            </div>
                            <p className="text-slate-300 mt-1 italic">&ldquo;{v.notes}&rdquo;</p>
                            {v.next_action_taken && (
                              <p className="text-[11px] text-cyan-300 mt-1">
                                ➔ {v.next_action_taken}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400">
            No recovery interventions recorded yet. Click &ldquo;Generate Recovery Plan&rdquo; above to begin.
          </p>
        )}
      </div>
    </div>
  );
};
