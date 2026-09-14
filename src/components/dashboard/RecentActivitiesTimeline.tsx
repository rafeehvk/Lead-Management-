import React, { useState } from 'react';
import {
  History,
  UserPlus,
  CalendarCheck,
  FileCheck2,
  AlertOctagon,
  RefreshCw,
  Users,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { UnifiedActivityItem } from './dashboardTypes';

interface RecentActivitiesTimelineProps {
  activities: UnifiedActivityItem[];
  onNavigateToModule?: (module: 'lead' | 'hr' | 'document') => void;
}

export const RecentActivitiesTimeline: React.FC<RecentActivitiesTimelineProps> = ({
  activities,
  onNavigateToModule,
}) => {
  const [filterModule, setFilterModule] = useState<'all' | 'lead' | 'hr' | 'document'>('all');

  const filtered = activities.filter((act) => {
    if (filterModule === 'all') return true;
    return act.module === filterModule;
  });

  const getModuleBadge = (mod: string) => {
    switch (mod) {
      case 'lead':
        return { text: 'Lead Event', class: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'hr':
        return { text: 'HR Event', class: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'document':
        return { text: 'Document Event', class: 'bg-amber-100 text-amber-900 border-amber-200' };
      default:
        return { text: 'System', class: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const getModuleIcon = (mod: string) => {
    switch (mod) {
      case 'lead':
        return <UserPlus className="w-3.5 h-3.5 text-blue-600" />;
      case 'hr':
        return <Users className="w-3.5 h-3.5 text-emerald-600" />;
      case 'document':
        return <FileCheck2 className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <History className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 md:p-6 mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100 mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              Recent Unified Activities Timeline
            </h3>
            <p className="text-xs text-slate-500">
              Cross-system audit log of new leads, completed follow-ups, staff movements, and document renewals.
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setFilterModule('all')}
            className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
              filterModule === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Logs ({activities.length})
          </button>
          <button
            onClick={() => setFilterModule('lead')}
            className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
              filterModule === 'lead'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Leads
          </button>
          <button
            onClick={() => setFilterModule('hr')}
            className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
              filterModule === 'hr'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            HR
          </button>
          <button
            onClick={() => setFilterModule('document')}
            className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
              filterModule === 'document'
                ? 'bg-white text-amber-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Documents
          </button>
        </div>
      </div>

      {/* Activity Items */}
      <div className="space-y-3">
        {filtered.slice(0, 7).map((act) => {
          const badge = getModuleBadge(act.module);
          return (
            <div
              key={act.id}
              className="flex items-start justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/40 hover:bg-white transition-all text-xs"
            >
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-white border border-slate-200 mt-0.5 shadow-2xs">
                  {getModuleIcon(act.module)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{act.title}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${badge.class}`}>
                      {badge.text}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">{act.details || act.action}</p>
                  <div className="text-[10px] text-slate-400 mt-1 flex items-center space-x-2">
                    <span>By {act.user}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {act.timestamp}
                    </span>
                  </div>
                </div>
              </div>

              {onNavigateToModule && (
                <button
                  onClick={() => onNavigateToModule(act.module)}
                  className="text-slate-400 hover:text-[#0B5D2A] p-1 cursor-pointer shrink-0"
                  title={`Open ${act.module} module`}
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
