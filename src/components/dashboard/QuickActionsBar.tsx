import React from 'react';
import {
  UserPlus,
  UserCheck,
  CalendarCheck,
  FilePlus,
  RefreshCw,
  Clock,
  Printer,
  Sparkles,
  Zap,
} from 'lucide-react';

interface QuickActionsBarProps {
  onCreateLead: () => void;
  onAddEmployee: () => void;
  onMarkAttendance: () => void;
  onCreateLeaveRequest: () => void;
  onUploadDocument: () => void;
  onRenewDocument: () => void;
  onScheduleFollowUp: () => void;
  onGenerateReport: () => void;
}

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  onCreateLead,
  onAddEmployee,
  onMarkAttendance,
  onCreateLeaveRequest,
  onUploadDocument,
  onRenewDocument,
  onScheduleFollowUp,
  onGenerateReport,
}) => {
  const actions = [
    {
      id: 'create-lead',
      label: 'Create Lead',
      icon: UserPlus,
      color: 'bg-blue-600 text-white hover:bg-blue-700',
      onClick: onCreateLead,
    },
    {
      id: 'add-employee',
      label: 'Add Employee',
      icon: UserPlus,
      color: 'bg-emerald-700 text-white hover:bg-emerald-800',
      onClick: onAddEmployee,
    },
    {
      id: 'mark-attendance',
      label: 'Mark Attendance',
      icon: UserCheck,
      color: 'bg-indigo-600 text-white hover:bg-indigo-700',
      onClick: onMarkAttendance,
    },
    {
      id: 'create-leave',
      label: 'Apply Leave',
      icon: CalendarCheck,
      color: 'bg-purple-600 text-white hover:bg-purple-700',
      onClick: onCreateLeaveRequest,
    },
    {
      id: 'upload-doc',
      label: 'Upload Document',
      icon: FilePlus,
      color: 'bg-amber-600 text-white hover:bg-amber-700',
      onClick: onUploadDocument,
    },
    {
      id: 'renew-doc',
      label: 'Renew Document',
      icon: RefreshCw,
      color: 'bg-teal-600 text-white hover:bg-teal-700',
      onClick: onRenewDocument,
    },
    {
      id: 'schedule-followup',
      label: 'Schedule Follow-up',
      icon: Clock,
      color: 'bg-sky-600 text-white hover:bg-sky-700',
      onClick: onScheduleFollowUp,
    },
    {
      id: 'generate-report',
      label: 'Generate Report',
      icon: Printer,
      color: 'bg-slate-800 text-white hover:bg-slate-900',
      onClick: onGenerateReport,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 md:p-5 mb-8">
      <div className="flex items-center space-x-2 mb-3">
        <Zap className="w-4 h-4 text-amber-500" />
        <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
          Executive Quick Action Shortcuts
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              onClick={act.onClick}
              className={`p-2.5 rounded-xl text-xs font-bold flex flex-col items-center justify-center space-y-1.5 transition-all shadow-2xs hover:shadow-xs cursor-pointer ${act.color}`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[11px] text-center leading-tight whitespace-nowrap">{act.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
