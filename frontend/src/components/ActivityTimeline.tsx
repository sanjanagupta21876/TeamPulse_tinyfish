import React from 'react';
import { ActivityEvent } from '../types';
import {
  Clock,
  ShieldAlert,
  GitPullRequest,
  Search,
  Sparkles,
  CheckCircle2,
  FileCheck,
  RotateCw,
  Info
} from 'lucide-react';

interface ActivityTimelineProps {
  events: ActivityEvent[];
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ events }) => {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'RISK_DETECTED':
        return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      case 'DEPENDENCY_CHAIN_IDENTIFIED':
        return <GitPullRequest className="w-4 h-4 text-cyan-400" />;
      case 'RESEARCH_STARTED':
      case 'SOURCES_RETRIEVED':
        return <Search className="w-4 h-4 text-cyan-400" />;
      case 'PLAN_GENERATED':
        return <Sparkles className="w-4 h-4 text-indigo-400" />;
      case 'PLAN_APPROVED':
        return <FileCheck className="w-4 h-4 text-emerald-400" />;
      case 'FOLLOWUP_SUBMITTED':
      case 'PLAN_ADAPTED':
        return <RotateCw className="w-4 h-4 text-amber-400" />;
      case 'TASK_RESOLVED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      default:
        return <Info className="w-4 h-4 text-slate-400" />;
    }
  };

  const formatTimestamp = (iso: string) => {
    try {
      const date = new Date(iso);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#0e172a] border border-[#1f2e4d] rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Real-time Activity Audit Trail
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {events.length} System Events Recorded
          </span>
        </div>

        {events.length > 0 ? (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#1f2e4d]">
            {events.map((event) => (
              <div key={event.id} className="relative group">
                {/* Icon Marker */}
                <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-[#080d1a] border border-[#233558] flex items-center justify-center">
                  {getEventIcon(event.event_type)}
                </div>

                <div className="bg-[#121c32] border border-[#233558] group-hover:border-cyan-500/40 rounded-xl p-4 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#182644] text-cyan-300 border border-[#273d6a]">
                        {event.event_type.replace(/_/g, ' ')}
                      </span>
                      <h4 className="text-sm font-bold text-white">{event.title}</h4>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      {formatTimestamp(event.created_at)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {event.description}
                  </p>

                  {event.metadata_json && (
                    <div className="mt-2 text-[10px] font-mono text-slate-500 truncate">
                      Metadata: {event.metadata_json}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400">No activity events recorded yet.</p>
        )}
      </div>
    </div>
  );
};
