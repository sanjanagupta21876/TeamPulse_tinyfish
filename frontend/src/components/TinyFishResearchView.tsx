import React, { useState } from 'react';
import { ResearchResult, ResearchSource, HealthStatus } from '../types';
import {
  Globe,
  Search,
  ExternalLink,
  FileText,
  Key,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Copy,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Terminal,
  BookOpen
} from 'lucide-react';

interface TinyFishResearchViewProps {
  researchResult: ResearchResult | null;
  sources: ResearchSource[];
  health: HealthStatus | null;
  isSearching: boolean;
  onSearch: (query: string, purpose?: string) => Promise<void>;
}

export const TinyFishResearchView: React.FC<TinyFishResearchViewProps> = ({
  researchResult,
  sources,
  health,
  isSearching,
  onSearch
}) => {
  const defaultQuery =
    'Official documentation and troubleshooting guidance for REST API integration, HTTP status codes, request and response schemas, JSON validation, and mock API testing.';

  const [queryInput, setQueryInput] = useState<string>(researchResult?.query || defaultQuery);
  const [purposeInput, setPurposeInput] = useState<string>(
    'Investigate technical blockers and API contract recovery strategies for Hackathon software project.'
  );
  const [selectedSource, setSelectedSource] = useState<ResearchSource | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const displaySources = researchResult?.sources || sources;

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header: TinyFish Overview & Configuration State */}
      <div className="bg-[#0e172a] border border-[#1f2e4d] rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <Globe className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                TinyFish Live Web Research & Evidence
              </h2>
              <span
                className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                  health?.tinyfish_configured
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/40'
                }`}
              >
                {health?.tinyfish_configured ? 'API Connected (Live Mode)' : 'Offline Demo Fallback Mode'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-2 max-w-3xl leading-relaxed">
              TeamPulse queries TinyFish&apos;s Search API (<code>https://api.search.tinyfish.ai</code>) to find relevant public technical guidance and the Fetch API (<code>https://api.fetch.tinyfish.ai</code>) to extract clean markdown directly from documentation pages.
            </p>
          </div>

          {/* Config Indicator */}
          <div className="bg-[#121c32] border border-[#233558] rounded-xl p-3 text-xs font-mono max-w-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Key className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold">TINYFISH_API_KEY:</span>
            </div>
            <p className="text-slate-400 mt-1 text-[11px]">
              {health?.tinyfish_configured
                ? 'Configured in backend environment.'
                : 'Not detected in backend .env. Demonstrating with verified fallback documentation.'}
            </p>
          </div>
        </div>

        {/* Search Query Runner */}
        <div className="mt-5 pt-5 border-t border-[#1f2e4d] space-y-3">
          <div>
            <label className="text-xs text-slate-400 font-mono block mb-1">
              Search Query String:
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  className="w-full bg-[#121c32] border border-[#233558] rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                  placeholder="Enter technical search query..."
                />
              </div>

              <button
                onClick={() => onSearch(queryInput, purposeInput)}
                disabled={isSearching}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 shadow-md shadow-cyan-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSearching ? 'animate-spin' : ''}`} />
                <span>{isSearching ? 'Querying TinyFish...' : 'Run Search'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="font-mono text-slate-500">Quick queries:</span>
            <button
              onClick={() => {
                setQueryInput(defaultQuery);
                onSearch(defaultQuery);
              }}
              className="text-cyan-400 hover:underline"
            >
              API Contract & Mocking (Primary Scenario)
            </button>
            <span>•</span>
            <button
              onClick={() => {
                const q = 'FastAPI response model validation and Pydantic schema troubleshooting';
                setQueryInput(q);
                onSearch(q);
              }}
              className="text-cyan-400 hover:underline"
            >
              FastAPI & Pydantic 422 Errors
            </button>
          </div>
        </div>
      </div>

      {/* Provider & Metadata Callout */}
      {researchResult && (
        <div className="bg-[#0b1222] border border-[#1b2842] rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400">Search Provider:</span>
            <strong className="text-white font-mono">{researchResult.provider}</strong>
          </div>
          <span className="text-slate-400 italic">{researchResult.message}</span>
        </div>
      )}

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displaySources.map((source) => (
          <div
            key={source.id}
            className="bg-[#0d1527] border border-[#1f2e4d] hover:border-cyan-500/40 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all group"
          >
            <div>
              <div className="flex items-center justify-between gap-2 text-xs font-mono text-cyan-400">
                <span className="truncate bg-[#142036] px-2 py-0.5 rounded border border-[#233558]">
                  {source.domain}
                </span>
                <span className="text-[10px] text-slate-500">
                  {source.is_live ? '✓ Live Search' : 'Curated Fallback'}
                </span>
              </div>

              <h3 className="text-sm font-bold text-white mt-3 group-hover:text-cyan-300 transition-colors">
                {source.title}
              </h3>

              <p className="text-xs text-slate-300 mt-2 line-clamp-3 leading-relaxed">
                {source.snippet}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-[#1a2846] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open URL</span>
                </a>
                <button
                  onClick={() => handleCopy(source.url)}
                  className="text-slate-400 hover:text-white"
                  title="Copy URL"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                {copiedUrl === source.url && (
                  <span className="text-[10px] text-emerald-400">Copied!</span>
                )}
              </div>

              {source.fetched_content && (
                <button
                  onClick={() => setSelectedSource(source)}
                  className="flex items-center gap-1 font-mono text-cyan-400 hover:text-cyan-300 font-semibold"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View Fetched Text</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* TinyFish Fetch Content Preview Modal */}
      {selectedSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0e172a] border border-[#233558] rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between pb-4 border-b border-[#1f2e4d]">
              <div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  TinyFish Fetch Clean Content
                </span>
                <h3 className="text-base font-bold text-white mt-1.5">{selectedSource.title}</h3>
                <a
                  href={selectedSource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-cyan-400 hover:underline flex items-center gap-1 mt-0.5"
                >
                  <span>{selectedSource.url}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <button
                onClick={() => setSelectedSource(null)}
                className="text-slate-400 hover:text-white text-sm px-2 py-1"
              >
                ✕ Close
              </button>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto bg-[#080d1a] border border-[#1b2842] rounded-xl p-4 text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed">
              {selectedSource.fetched_content || 'No content fetched for this URL.'}
            </div>

            <div className="mt-4 pt-3 border-t border-[#1f2e4d] flex items-center justify-between text-xs text-slate-400">
              <span>Fetched via managed Chromium fleet without ads or tracking scripts.</span>
              <button
                onClick={() => setSelectedSource(null)}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
