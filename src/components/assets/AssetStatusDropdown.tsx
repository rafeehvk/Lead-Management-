import React from 'react';
import { ChevronDown } from 'lucide-react';
import { AssetStatus } from '../../types/asset';

interface AssetStatusDropdownProps {
  status: AssetStatus;
  onChange?: (newStatus: AssetStatus) => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md';
  id?: string;
}

export const ASSET_STATUS_LIST: {
  value: AssetStatus;
  label: string;
}[] = [
  { value: 'Active', label: 'Active' },
  { value: 'Deployed', label: 'Deployed' },
  { value: 'In Maintenance', label: 'In Maintenance' },
  { value: 'Retired', label: 'Retired' },
  { value: 'Available', label: 'Available (Store)' },
  { value: 'Allocated', label: 'Allocated' },
  { value: 'Checked Out', label: 'Checked Out' },
  { value: 'Under Maintenance', label: 'Under Maintenance' },
  { value: 'Damaged', label: 'Damaged' },
  { value: 'Disposed', label: 'Disposed' },
];

export const getAssetStatusBadgeStyle = (
  status: AssetStatus
): { badgeStyles: string; dotColor: string } => {
  switch (status) {
    case 'Active':
    case 'Available':
      return {
        badgeStyles: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:border-emerald-400',
        dotColor: 'bg-emerald-500',
      };
    case 'Deployed':
    case 'Allocated':
      return {
        badgeStyles: 'bg-[#EAF7EF] text-[#0B5D2A] border-[#D9E5DD] hover:border-[#168A45]',
        dotColor: 'bg-[#168A45]',
      };
    case 'In Maintenance':
    case 'Under Maintenance':
      return {
        badgeStyles: 'bg-amber-50 text-amber-800 border-amber-300 hover:border-amber-400',
        dotColor: 'bg-amber-500',
      };
    case 'Retired':
      return {
        badgeStyles: 'bg-slate-100 text-slate-700 border-slate-300 hover:border-slate-400',
        dotColor: 'bg-slate-500',
      };
    case 'Checked Out':
      return {
        badgeStyles: 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:border-indigo-400',
        dotColor: 'bg-indigo-500',
      };
    case 'Damaged':
      return {
        badgeStyles: 'bg-rose-50 text-rose-800 border-rose-200 hover:border-rose-400',
        dotColor: 'bg-rose-500',
      };
    case 'Disposed':
      return {
        badgeStyles: 'bg-gray-100 text-gray-700 border-gray-300 hover:border-gray-400',
        dotColor: 'bg-gray-400',
      };
    default:
      return {
        badgeStyles: 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300',
        dotColor: 'bg-slate-400',
      };
  }
};

export const AssetStatusDropdown: React.FC<AssetStatusDropdownProps> = ({
  status,
  onChange,
  disabled = false,
  className = '',
  size = 'sm',
  id,
}) => {
  const { badgeStyles, dotColor } = getAssetStatusBadgeStyle(status);

  if (disabled || !onChange) {
    return (
      <span
        id={id}
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
      id={id}
      className={`relative inline-flex items-center group ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Visual colored status dot */}
      <span
        className={`w-1.5 h-1.5 rounded-full ${dotColor} absolute left-2.5 pointer-events-none z-10 transition-colors`}
      />

      {/* Interactive Select Dropdown styled like a status pill */}
      <select
        value={status}
        onChange={(e) => {
          e.stopPropagation();
          onChange(e.target.value as AssetStatus);
        }}
        className={`appearance-none cursor-pointer border rounded-full font-bold transition-all focus:outline-none focus:ring-2 focus:ring-[#168A45]/30 active:scale-98 shadow-2xs pr-5.5 ${
          isSmall ? 'text-[11px] pl-5 py-0.5' : 'text-xs pl-5.5 py-1'
        } ${badgeStyles}`}
        title={`Current status: ${status}. Click to change asset status in registry`}
      >
        <optgroup label="Primary Statuses">
          <option value="Active" className="text-slate-800 bg-white font-medium py-1">
            Active
          </option>
          <option value="Deployed" className="text-slate-800 bg-white font-medium py-1">
            Deployed
          </option>
          <option value="In Maintenance" className="text-slate-800 bg-white font-medium py-1">
            In Maintenance
          </option>
          <option value="Retired" className="text-slate-800 bg-white font-medium py-1">
            Retired
          </option>
        </optgroup>
        <optgroup label="Operational Statuses">
          <option value="Available" className="text-slate-800 bg-white font-medium py-1">
            Available (Store)
          </option>
          <option value="Allocated" className="text-slate-800 bg-white font-medium py-1">
            Allocated
          </option>
          <option value="Checked Out" className="text-slate-800 bg-white font-medium py-1">
            Checked Out
          </option>
          <option value="Under Maintenance" className="text-slate-800 bg-white font-medium py-1">
            Under Maintenance
          </option>
          <option value="Damaged" className="text-slate-800 bg-white font-medium py-1">
            Damaged
          </option>
          <option value="Disposed" className="text-slate-800 bg-white font-medium py-1">
            Disposed
          </option>
        </optgroup>
      </select>

      {/* Downward Chevron Indicator */}
      <ChevronDown
        className="w-3 h-3 text-current opacity-60 absolute right-1.5 pointer-events-none transition-transform duration-150 group-hover:translate-y-0.5"
      />
    </div>
  );
};
