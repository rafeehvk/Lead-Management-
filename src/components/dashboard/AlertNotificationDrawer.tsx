import React, { useState } from 'react';
import {
  X,
  Bell,
  CheckCheck,
  AlertOctagon,
  AlertTriangle,
  Clock,
  UserCheck,
  FileClock,
  ArrowRight,
} from 'lucide-react';
import { SmartAlert } from './dashboardTypes';

interface AlertNotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: SmartAlert[];
  onAlertClick: (alert: SmartAlert) => void;
}

export const AlertNotificationDrawer: React.FC<AlertNotificationDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  onAlertClick,
}) => {
  const [readAlertIds, setReadAlertIds] = useState<Set<string>>(new Set());
  const [filterModule, setFilterModule] = useState<'all' | 'lead' | 'hr' | 'document'>('all');

  if (!isOpen) return null;

  const handleMarkAllRead = () => {
    setReadAlertIds(new Set(alerts.map((a) => a.id)));
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filterModule === 'all') return true;
    return a.module === filterModule;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-red-100 text-red-700">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Alert & Notification Center</h3>
                <p className="text-xs text-slate-500">
                  {alerts.length - readAlertIds.size} Unread Management Notifications
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Bar & Mark Read */}
          <div className="px-4 sm:px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setFilterModule('all')}
                className={`px-2 py-1 rounded font-bold cursor-pointer ${
                  filterModule === 'all' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterModule('lead')}
                className={`px-2 py-1 rounded font-bold cursor-pointer ${
                  filterModule === 'lead' ? 'bg-blue-600 text-white' : 'text-blue-700 hover:bg-blue-100'
                }`}
              >
                Leads
              </button>
              <button
                onClick={() => setFilterModule('hr')}
                className={`px-2 py-1 rounded font-bold cursor-pointer ${
                  filterModule === 'hr' ? 'bg-emerald-700 text-white' : 'text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                HR
              </button>
              <button
                onClick={() => setFilterModule('document')}
                className={`px-2 py-1 rounded font-bold cursor-pointer ${
                  filterModule === 'document' ? 'bg-amber-600 text-white' : 'text-amber-800 hover:bg-amber-100'
                }`}
              >
                Docs
              </button>
            </div>

            <button
              onClick={handleMarkAllRead}
              className="flex items-center space-x-1 text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
            {filteredAlerts.length > 0 ? (
              filteredAlerts.map((alert) => {
                const isRead = readAlertIds.has(alert.id);
                const isCritical = alert.urgency === 'critical';
                const isHigh = alert.urgency === 'high';

                return (
                  <div
                    key={alert.id}
                    className={`p-3.5 rounded-xl border text-xs transition-all relative ${
                      isRead
                        ? 'bg-slate-50/60 border-slate-200 opacity-60'
                        : isCritical
                        ? 'bg-red-50/70 border-red-200 text-red-950'
                        : isHigh
                        ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                        : 'bg-white border-slate-200 text-slate-900 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase ${
                            isCritical
                              ? 'bg-red-600 text-white'
                              : isHigh
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-200 text-slate-800'
                          }`}
                        >
                          {alert.module}
                        </span>
                        <span className="font-bold">{alert.title}</span>
                      </div>
                      {!isRead && (
                        <span className="w-2 h-2 rounded-full bg-red-600 shrink-0 mt-1" />
                      )}
                    </div>

                    <p className="text-[11px] text-slate-600 mt-1">{alert.description}</p>

                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setReadAlertIds((prev) => new Set(prev).add(alert.id));
                          onAlertClick(alert);
                          onClose();
                        }}
                        className="text-[11px] font-bold text-[#0B5D2A] hover:text-[#168A45] flex items-center space-x-1 cursor-pointer"
                      >
                        <span>{alert.actionLabel || 'Action Now'}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>

                      <button
                        onClick={() =>
                          setReadAlertIds((prev) => {
                            const n = new Set(prev);
                            if (n.has(alert.id)) n.delete(alert.id);
                            else n.add(alert.id);
                            return n;
                          })
                        }
                        className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
                      >
                        {isRead ? 'Mark unread' : 'Dismiss'}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                No active notifications for the selected category.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
