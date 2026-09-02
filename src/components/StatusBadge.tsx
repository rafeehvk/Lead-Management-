import React from 'react';
import { LeadStatus } from '../types';

interface StatusBadgeProps {
  status: LeadStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  let badgeStyles = 'bg-slate-100 text-slate-600 border-slate-200';
  let dotColor = 'bg-slate-400';

  switch (status) {
    case 'New':
      badgeStyles = 'bg-[#EAF7EF] text-[#0B5D2A] border-[#D9E5DD] font-semibold';
      dotColor = 'bg-[#168A45]';
      break;
    case 'Contacted':
      badgeStyles = 'bg-emerald-50 text-[#0B5D2A] border-emerald-200 font-medium';
      dotColor = 'bg-[#168A45]';
      break;
    case 'Follow-up':
      badgeStyles = 'bg-amber-50 text-amber-800 border-amber-200 font-medium';
      dotColor = 'bg-amber-500';
      break;
    case 'Qualified':
      badgeStyles = 'bg-[#EAF7EF] text-[#0B5D2A] border-[#D9E5DD] font-semibold';
      dotColor = 'bg-[#168A45]';
      break;
    case 'Demo Scheduled':
      badgeStyles = 'bg-teal-50 text-teal-800 border-teal-200 font-medium';
      dotColor = 'bg-teal-500';
      break;
    case 'Demo Completed':
      badgeStyles = 'bg-[#EAF7EF] text-[#0B5D2A] border-emerald-300 font-semibold';
      dotColor = 'bg-[#0B5D2A]';
      break;
    case 'Send Proposal':
      badgeStyles = 'bg-[#168A45] text-white border-transparent font-bold shadow-2xs';
      dotColor = 'bg-white';
      break;
    case 'Proposal Sent':
      badgeStyles = 'bg-[#EAF7EF] text-[#0B5D2A] border-[#168A45] font-semibold';
      dotColor = 'bg-[#168A45]';
      break;
    case 'Negotiation':
      badgeStyles = 'bg-amber-50 text-amber-900 border-amber-300 font-medium';
      dotColor = 'bg-amber-600';
      break;
    case 'Won':
      badgeStyles = 'bg-[#0B5D2A] text-white border-transparent font-bold shadow-xs';
      dotColor = 'bg-white';
      break;
    case 'Lost':
      badgeStyles = 'bg-rose-50 text-rose-700 border-rose-200 font-medium';
      dotColor = 'bg-rose-500';
      break;
    case 'On Hold':
      badgeStyles = 'bg-slate-100 text-slate-600 border-slate-200 font-medium';
      dotColor = 'bg-slate-400';
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border whitespace-nowrap ${badgeStyles} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
      {status}
    </span>
  );
};
