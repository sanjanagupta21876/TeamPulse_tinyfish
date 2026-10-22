import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api/client';
import type {
  Project,
  Task,
  RiskAssessment,
  RecoveryPlan,
  ResearchResult,
  ResearchSource,
  ActivityEvent,
  HealthStatus
} from './types';
import { Navbar } from './components/Navbar';
import { MissionControl } from './components/MissionControl';
import { DependencyGraph } from './components/DependencyGraph';
import { TaskBoard } from './components/TaskBoard';
import { RecoveryCenter } from './components/RecoveryCenter';
import { TinyFishResearchView } from './components/TinyFishResearchView';
import { ActivityTimeline } from './components/ActivityTimeline';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('mission-control');
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [activePlan, setActivePlan] = useState<RecoveryPlan | null>(null);
  const [recoveryHistory, setRecoveryHistory] = useState<RecoveryPlan[]>([]);
  const [researchResult, setResearchResult] = useState<ResearchResult | null>(null);
  const [sources, setSources] = useState<ResearchSource[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);

  // Loading states
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = useCallback(async () => {
    try {
      const [healthData, projectsData] = await Promise.all([
        api.getHealth(),
        api.getProjects()
      ]);
      setHealth(healthData);

      if (projectsData.length > 0) {
        const p = projectsData[0];
        setProject(p);

        const [tasksData, riskData, historyData, sourcesData, eventsData] = await Promise.all([
          api.getTasks(p.id),
          api.analyzeRisk(p.id),
          api.getRecoveryHistory(p.id),
          api.getProjectSources(p.id),
          api.getEvents(p.id)
        ]);

        setTasks(tasksData);
        setRiskAssessment(riskData);
        setRecoveryHistory(historyData);
        if (historyData.length > 0) {
          // Set latest proposed or approved plan as active
          setActivePlan(historyData[0]);
        }
        setSources(sourcesData);
        setEvents(eventsData);
      }
    } catch (err: any) {
      console.error('Failed to load TeamPulse data:', err);
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleAnalyzeRisk = async () => {
    if (!project) return;
    setIsAnalyzing(true);
    try {
      const risk = await api.analyzeRisk(project.id);
      setRiskAssessment(risk);
      setProject((prev) => (prev ? { ...prev, risk_level: risk.risk_level } : null));
      const evs = await api.getEvents(project.id);
      setEvents(evs);
      showToast('Risk analysis updated via deterministic rules engine.');
    } catch (err: any) {
      showToast(`Analysis failed: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      await api.resetDemo();
      await loadData();
      setActiveTab('mission-control');
      showToast('Demo scenario reset to initial blocked state (TASK-101 overdue).');
    } catch (err: any) {
      showToast(`Reset failed: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  const handleStartRecovery = (taskId?: string) => {
    setActiveTab('recovery');
    if (taskId && (!activePlan || activePlan.task_id !== taskId)) {
      handleGeneratePlan(taskId);
    }
  };

  const handleGeneratePlan = async (taskId: string, context?: string) => {
    if (!project) return;
    setIsGenerating(true);
    try {
      const plan = await api.generateRecoveryPlan(project.id, taskId, context);
      setActivePlan(plan);
      const [history, evs, s] = await Promise.all([
        api.getRecoveryHistory(project.id),
        api.getEvents(project.id),
        api.getProjectSources(project.id)
      ]);
      setRecoveryHistory(history);
      setEvents(evs);
      setSources(s);
      showToast(`Recovery plan #${plan.iteration} generated with TinyFish guidance.`);
    } catch (err: any) {
      showToast(`Generation failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprovePlan = async (planId: string, notes?: string, customAction?: string) => {
    if (!project) return;
    try {
      const approved = await api.approveRecoveryPlan(planId, notes, customAction);
      setActivePlan(approved);
      const [history, evs] = await Promise.all([
        api.getRecoveryHistory(project.id),
        api.getEvents(project.id)
      ]);
      setRecoveryHistory(history);
      setEvents(evs);
      showToast(`Plan approved! Verification checkpoint is now active.`);
    } catch (err: any) {
      showToast(`Approval failed: ${err.message}`);
    }
  };

  const handleRejectPlan = async (planId: string, reason: string) => {
    if (!project) return;
    try {
      const rejected = await api.rejectRecoveryPlan(planId, reason);
      setActivePlan(rejected);
      const [history, evs] = await Promise.all([
        api.getRecoveryHistory(project.id),
        api.getEvents(project.id)
      ]);
      setRecoveryHistory(history);
      setEvents(evs);
      showToast('Plan rejected.');
    } catch (err: any) {
      showToast(`Rejection failed: ${err.message}`);
    }
  };

  const handleVerifyPlan = async (
    planId: string,
    outcome: 'RESOLVED' | 'PARTIALLY_RESOLVED' | 'STILL_BLOCKED',
    notes: string
  ) => {
    if (!project) return;
    try {
      const res = await api.verifyRecoveryPlan(planId, outcome, notes);
      if (res.adapted_plan) {
        setActivePlan(res.adapted_plan);
      }
      // Reload updated tasks, project risk, events, history
      const [tList, rData, hist, evs] = await Promise.all([
        api.getTasks(project.id),
        api.analyzeRisk(project.id),
        api.getRecoveryHistory(project.id),
        api.getEvents(project.id)
      ]);
      setTasks(tList);
      setRiskAssessment(rData);
      setRecoveryHistory(hist);
      setEvents(evs);
      setProject((prev) => (prev ? { ...prev, risk_level: res.project_risk as any } : null));

      if (res.resolved) {
        showToast('Blocker fully resolved! Downstream tasks unblocked.');
      } else {
        showToast(`Verification submitted: Adaptive plan #${res.adapted_plan?.iteration} generated!`);
      }
    } catch (err: any) {
      showToast(`Verification failed: ${err.message}`);
    }
  };

  const handleUpdateTask = async (taskId: string, data: Partial<Task>) => {
    if (!project) return;
    await api.updateTask(taskId, data);
    const [tList, rData, evs] = await Promise.all([
      api.getTasks(project.id),
      api.analyzeRisk(project.id),
      api.getEvents(project.id)
    ]);
    setTasks(tList);
    setRiskAssessment(rData);
    setEvents(evs);
    setProject((prev) => (prev ? { ...prev, risk_level: rData.risk_level } : null));
    showToast(`Task ${taskId} updated.`);
  };

  const handleCreateTask = async (data: any) => {
    if (!project) return;
    await api.createTask(data);
    const [tList, rData, evs] = await Promise.all([
      api.getTasks(project.id),
      api.analyzeRisk(project.id),
      api.getEvents(project.id)
    ]);
    setTasks(tList);
    setRiskAssessment(rData);
    setEvents(evs);
    showToast(`Task created.`);
  };

  const handleSearch = async (query: string, purpose?: string) => {
    if (!project) return;
    setIsSearching(true);
    try {
      const res = await api.researchBlocker(project.id, { query, purpose });
      setResearchResult(res);
      const [sList, evs] = await Promise.all([
        api.getProjectSources(project.id),
        api.getEvents(project.id)
      ]);
      setSources(sList);
      setEvents(evs);
      showToast(`TinyFish research returned ${res.sources.length} sources.`);
    } catch (err: any) {
      showToast(`Search failed: ${err.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-[#080d1a] flex items-center justify-center text-white font-mono">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-cyan-300">Initializing TeamPulse Mission Control...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#121c32] border border-cyan-500/50 text-white text-xs px-4 py-3 rounded-xl shadow-2xl animate-fade-in flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        project={project}
        health={health}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onResetDemo={handleResetDemo}
        isResetting={isResetting}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'mission-control' && (
          <MissionControl
            project={project}
            tasks={tasks}
            riskAssessment={riskAssessment}
            isAnalyzing={isAnalyzing}
            onAnalyzeRisk={handleAnalyzeRisk}
            onStartRecovery={handleStartRecovery}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'dependencies' && (
          <DependencyGraph
            tasks={tasks}
            onStartRecovery={handleStartRecovery}
          />
        )}

        {activeTab === 'tasks' && (
          <TaskBoard
            tasks={tasks}
            onUpdateTask={handleUpdateTask}
            onCreateTask={handleCreateTask}
            onStartRecovery={handleStartRecovery}
          />
        )}

        {activeTab === 'recovery' && (
          <RecoveryCenter
            project={project}
            tasks={tasks}
            activePlan={activePlan}
            recoveryHistory={recoveryHistory}
            isGenerating={isGenerating}
            onGeneratePlan={handleGeneratePlan}
            onApprovePlan={handleApprovePlan}
            onRejectPlan={handleRejectPlan}
            onVerifyPlan={handleVerifyPlan}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'research' && (
          <TinyFishResearchView
            researchResult={researchResult}
            sources={sources}
            health={health}
            isSearching={isSearching}
            onSearch={handleSearch}
          />
        )}

        {activeTab === 'timeline' && (
          <ActivityTimeline events={events} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1f2e4d] bg-[#090f1d] py-4 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>TeamPulse MVP • Built for Kritical Hacks 2026</span>
          <span className="text-slate-400">
            Powered by TinyFish Search & Fetch Infrastructure
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;
