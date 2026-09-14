import React, { useState } from 'react';
import {
  Calendar,
  Filter,
  RotateCcw,
  Building2,
  Users,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import { User } from '../../types';
import { StaffMember } from '../../types/hr';
import { DashboardFilterState, DashboardRoleView, DashboardDateRange } from './dashboardTypes';

interface ExecutiveHeaderProps {
  currentUser: User;
  users: User[];
  staff: StaffMember[];
  filterState: DashboardFilterState;
  onFilterChange: (filters: Partial<DashboardFilterState>) => void;
  onResetFilters: () => void;
  activeRoleView: DashboardRoleView;
  onRoleViewChange: (role: DashboardRoleView) => void;
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
  onLogout?: () => void;
}

export const ExecutiveHeader: React.FC<ExecutiveHeaderProps> = ({
  currentUser: _currentUser,
  users,
  staff,
  filterState,
  onFilterChange,
  onResetFilters,
  activeRoleView: _activeRoleView,
  onRoleViewChange: _onRoleViewChange,
}) => {
  const [isFilterBarExpanded, setIsFilterBarExpanded] = useState(true);

  const branches = [
    'All Branches',
    'Kochi Campus',
    'Trivandrum Office',
    'Calicut Center',
    'Dubai Corporate',
  ];

  const departments = [
    'All Departments',
    'Academic',
    'Administration',
    'IT & Systems',
    'Human Resources',
    'Finance',
    'Sales & Marketing',
    'Operations',
  ];

  const hasActiveFilters =
    filterState.dateRange !== 'all' ||
    filterState.branch !== 'All Branches' ||
    filterState.department !== 'All Departments' ||
    filterState.employeeId !== 'all' ||
    filterState.leadOwner !== 'all' ||
    filterState.searchQuery.trim() !== '';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 md:p-6 mb-6">
      {/* Dynamic Filters Bar */}
      <div>
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2.5">
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Executive Filters
            </span>
            {hasActiveFilters && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Filters Active
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <button
                onClick={onResetFilters}
                className="flex items-center space-x-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
            <button
              onClick={() => setIsFilterBarExpanded(!isFilterBarExpanded)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              {isFilterBarExpanded ? 'Hide Controls' : 'Show Controls'}
            </button>
          </div>
        </div>

        {isFilterBarExpanded && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 animate-in fade-in duration-150">
            {/* 1. Date Range */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Date Range
              </label>
              <select
                value={filterState.dateRange}
                onChange={(e) =>
                  onFilterChange({ dateRange: e.target.value as DashboardDateRange })
                }
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-[#168A45]"
              >
                <option value="all">All Time History</option>
                <option value="today">Today Only</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="this_quarter">This Quarter</option>
                <option value="this_year">This Financial Year</option>
              </select>
            </div>

            {/* 2. Branch / Location */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Branch / Location
              </label>
              <select
                value={filterState.branch}
                onChange={(e) => onFilterChange({ branch: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-[#168A45]"
              >
                {branches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Department */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Department
              </label>
              <select
                value={filterState.department}
                onChange={(e) => onFilterChange({ department: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-[#168A45]"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Employee */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Staff / Employee
              </label>
              <select
                value={filterState.employeeId}
                onChange={(e) => onFilterChange({ employeeId: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-[#168A45]"
              >
                <option value="all">All Employees ({staff.length})</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.id})
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Lead Owner */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Lead Owner
              </label>
              <select
                value={filterState.leadOwner}
                onChange={(e) => onFilterChange({ leadOwner: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-[#168A45]"
              >
                <option value="all">All Lead Owners</option>
                {users.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
