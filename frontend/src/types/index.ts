export interface ProgressUpdate {
  id: string;
  task_id: string;
  author: string;
  content: string;
  status_change?: string;
  created_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  owner: string;
  status: 'BLOCKED' | 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'NOT_STARTED';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  estimated_hours: number;
  deadline?: string;
  last_updated_hours_ago: number;
  is_overdue: boolean;
  has_blocker: boolean;
  blocker_description?: string;
  blocker_category?: string;
  created_at: string;
  updated_at: string;
  depends_on_ids: string[];
  downstream_ids: string[];
  progress_updates: ProgressUpdate[];
}

export interface RiskCondition {
  factor: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  impact: string;
  affected_task_ids: string[];
}

export interface RiskAssessment {
  project_id: string;
  risk_level: 'HIGH' | 'MEDIUM' | 'LOW';
  score: number;
  summary: string;
  hours_remaining: number;
  critical_path_hours: number;
  total_tasks: number;
  blocked_tasks: number;
  overdue_tasks: number;
  waiting_tasks: number;
  conditions: RiskCondition[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  deadline: string;
  risk_level: 'HIGH' | 'MEDIUM' | 'LOW';
  hours_remaining: number;
  created_at: string;
  updated_at: string;
  tasks_count: number;
  blocked_count: number;
}

export interface ResearchSource {
  id: string;
  query: string;
  title: string;
  url: string;
  domain: string;
  snippet: string;
  fetched_content?: string;
  is_live: boolean;
  provider: string;
  created_at: string;
}

export interface ResearchResult {
  is_live: boolean;
  provider: string;
  query: string;
  message: string;
  sources: ResearchSource[];
}

export interface VerificationOutcome {
  id: string;
  plan_id: string;
  outcome: 'RESOLVED' | 'PARTIALLY_RESOLVED' | 'STILL_BLOCKED';
  notes: string;
  reported_at: string;
  next_action_taken?: string;
}

export interface RecoveryPlan {
  id: string;
  project_id: string;
  task_id: string;
  task_title?: string;
  iteration: number;
  title: string;
  recommended_action: string;
  reason: string;
  supporting_evidence: string[];
  expected_result: string;
  estimated_effort_minutes: number;
  tasks_unblocked: string[];
  verification_condition: string;
  alternative_action: string;
  status: 'PROPOSED' | 'APPROVED' | 'REJECTED' | 'SUPERSEDED' | 'RESOLVED';
  created_at: string;
  approved_at?: string;
  sources: ResearchSource[];
  verification_outcomes: VerificationOutcome[];
}

export interface ActivityEvent {
  id: string;
  project_id: string;
  event_type: string;
  title: string;
  description: string;
  metadata_json?: string;
  created_at: string;
}

export interface HealthStatus {
  status: string;
  service: string;
  version: string;
  tinyfish_configured: boolean;
  tinyfish_mode: 'LIVE' | 'DEMO_FALLBACK';
}
