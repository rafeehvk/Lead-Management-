import React from 'react';
import { ChevronDown } from 'lucide-react';
import { LeadStatus } from '../types';

interface StatusDropdownProps {
  status: LeadStatus;
  onChange?: (newStatus: LeadStatus) => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export const ALL_LEAD_STATUSES: LeadStatus[] = [
  'New',
  'Contacted',
  'Follow-up',
  'Qualified',
  'Demo Scheduled',
  'Demo Completed',
  'Send Proposal',
  'Proposal Sent',
  'Negotiation',
  'Won',
  'Lost',
  'On Hold',
];

export const getStatusColorStyles = (status: LeadStatus): { badgeStyles: string; dotColor: string } => {
  switch (status) {
    case 'New':
      return {
        badgeStyles: 'bg-[#EAF7EF] text-[#0B5D2A] border-[#D9E5DD] hover:border-[#168A45]',
        dotColor: 'bg-[#168A45]',
      };
    case 'Contacted':
      return {
        badgeStyles: 'bg-emerald-50 text-[#0B5D2A] border-emerald-200 hover:border-emerald-400',
        dotColor: 'bg-[#168A45]',
      };
    case 'Follow-up':
      return {
        badgeStyles: 'bg-amber-50 text-amber-800 border-amber-200 hover:border-amber-400',
        dotColor: 'bg-amber-500',
      };
    case 'Qualified':
      return {
        badgeStyles: 'bg-[#EAF7EF] text-[#0B5D2A] border-[#D9E5DD] hover:border-[#168A45]',
        dotColor: 'bg-[#168A45]',
      };
    case 'Demo Scheduled':
      return {
        badgeStyles: 'bg-teal-50 text-teal-800 border-teal-200 hover:border-teal-400',
        dotColor: 'bg-teal-500',
      };
    case 'Demo Completed':
      return {
        badgeStyles: 'bg-[#EAF7EF] text-[#0B5D2A] border-emerald-300 hover:border-[#0B5D2A]',
        dotColor: 'bg-[#0B5D2A]',
      };
    case 'Send Proposal':
      return {
        badgeStyles: 'bg-[#168A45] text-white border-transparent hover:bg-[#0B5D2A]',
        dotColor: 'bg-white',
      };
    case 'Proposal Sent':
      return {
        badgeStyles: 'bg-[#EAF7EF] text-[#0B5D2A] border-[#168A45] hover:border-[#0B5D2A]',
        dotColor: 'bg-[#168A45]',
      };
    case 'Negotiation':
      return {
        badgeStyles: 'bg-amber-50 text-amber-900 border-amber-300 hover:border-amber-500',
        dotColor: 'bg-amber-600',
      };
    case 'Won':
      return {
        badgeStyles: 'bg-[#0B5D2A] text-white border-transparent hover:bg-emerald-900',
        dotColor: 'bg-white',
      };
    case 'Lost':
      return {
        badgeStyles: 'bg-rose-50 text-rose-700 border-rose-200 hover:border-rose-400',
        dotColor: 'bg-rose-500',
      };
    case 'On Hold':
      return {
        badgeStyles: 'bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300',
        dotColor: 'bg-slate-400',
      };
    default:
      return {
        badgeStyles: 'bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300',
        dotColor: 'bg-slate-400',
      };
  }
};

export const StatusDropdown: React.FC<StatusDropdownProps> = ({
  status,
  onChange,
  disabled = false,
  className = '',
  size = 'sm',
}) => {
  const { badgeStyles, dotColor } = getStatusColorStyles(status);

  if (disabled || !onChange) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap ${badgeStyles} ${className}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        <span>{status}</span>
      </span>
    );
  }

  const isSmall = size === 'sm';

  return (
    <div
      className={`relative inline-flex items-center group ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Visual colored status dot */}
      <span
        className={`w-1.5 h-1.5 rounded-full ${dotColor} absolute left-2.5 pointer-events-none z-10`}
      />

      {/* Interactive Select Dropdown styled like a pill */}
      <select
        value={status}
        onChange={(e) => {
          e.stopPropagation();
          onChange(e.target.value as LeadStatus);
        }}
        className={`appearance-none cursor-pointer border rounded-full font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#168A45]/40 active:scale-98 shadow-2xs pr-6 ${
          isSmall ? 'text-xs pl-5.5 py-1' : 'text-sm pl-6 py-1.5'
        } ${badgeStyles}`}
        title="Click to change lead pipeline status"
      >
        {ALL_LEAD_STATUSES.map((st) => (
          <option key={st} value={st} className="text-slate-800 bg-white font-medium py-1">
            {st}
          </option>
        ))}
      </select>

      {/* Downward Chevron Indicator */}
      <ChevronDown
        className={`w-3 h-3 text-current opacity-70 absolute right-2 pointer-events-none transition-transform duration-150 group-hover:translate-y-0.5`}
      />
    </div>
  );
};
