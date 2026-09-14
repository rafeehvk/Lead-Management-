import React from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  Sparkles,
  CalendarClock,
  UserCheck,
  FileCheck2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { SmartAlert } from './dashboardTypes';

interface SmartInsightsBannerProps {
  alerts: SmartAlert[];
  onActionClick: (alert: SmartAlert) => void;
}

export const SmartInsightsBanner: React.FC<SmartInsightsBannerProps> = ({
  alerts,
  onActionClick,
}) => {
  if (alerts.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-blue-500/10 border border-amber-200/80 rounded-2xl p-4 mb-6 shadow-2xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-amber-500 text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs md:text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>Executive Intelligent Insights & Critical Warnings</span>
              <span className="text-[10px] font-bold px-2 py-0.2 bg-amber-100 text-amber-900 rounded-full border border-amber-300">
                {alerts.length} Items Detected
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Cross-module real-time intelligence detecting operational risks and pending management approvals.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {alerts.slice(0, 4).map((alert) => {
          const isCritical = alert.urgency === 'critical';
          const isHigh = alert.urgency === 'high';

          let borderClass = 'border-blue-200 bg-white';
          let iconBg = 'bg-blue-100 text-blue-700';
          let Icon = TrendingUp;

          if (isCritical) {
            borderClass = 'border-red-300 bg-red-50/70 text-red-900';
            iconBg = 'bg-red-600 text-white';
            Icon = AlertOctagon;
          } else if (isHigh) {
            borderClass = 'border-amber-300 bg-amber-50/70 text-amber-900';
            iconBg = 'bg-amber-500 text-white';
            Icon = AlertTriangle;
          } else if (alert.module === 'hr') {
            Icon = UserCheck;
            iconBg = 'bg-emerald-100 text-emerald-800';
          } else if (alert.module === 'lead') {
            Icon = CalendarClock;
            iconBg = 'bg-purple-100 text-purple-800';
          }

          return (
            <div
              key={alert.id}
              className={`rounded-xl border p-3 flex flex-col justify-between shadow-2xs transition-all hover:shadow-xs ${borderClass}`}
            >
              <div>
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <div className="flex items-center space-x-1.5">
                    <span className={`p-1 rounded-md ${iconBg}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider">
                      {alert.module}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                      isCritical
                        ? 'bg-red-600 text-white'
                        : isHigh
                        ? 'bg-amber-200 text-amber-900'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {alert.urgency}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{alert.title}</h4>
                <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{alert.description}</p>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                <button
                  onClick={() => onActionClick(alert)}
                  className="text-[11px] font-bold text-[#0B5D2A] hover:text-[#168A45] flex items-center space-x-1 cursor-pointer"
                >
                  <span>{alert.actionLabel || 'Review & Resolve'}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
