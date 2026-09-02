import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Code2,
  RefreshCw,
  Search,
  Bell,
  User as UserIcon,
  ChevronDown,
  ShieldCheck,
  Check,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { User, UserRole, Settings } from '../types';
import { ROLE_DEFINITIONS } from '../utils/rbac';

interface HeaderProps {
  onOpenNewLead: () => void;
  onOpenGasHub: () => void;
  onRefresh: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  currentUser: User;
  users: User[];
  onSwitchUser: (user: User) => void;
  notificationsCount: number;
  onOpenNotifications: () => void;
  settings?: Settings;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNewLead,
  onOpenGasHub,
  onRefresh,
  searchQuery,
  onSearchChange,
  currentUser,
  users,
  onSwitchUser,
  notificationsCount,
  onOpenNotifications,
  settings,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roleDef = ROLE_DEFINITIONS[currentUser.role] || ROLE_DEFINITIONS.Salesperson;

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-4 md:px-8 sticky top-0 z-30 flex items-center justify-between gap-3">
      {/* Brand & Subtext */}
      <div className="flex items-center space-x-3 shrink-0">
        {settings?.companyLogo ? (
          <div className="h-10 w-10 rounded-xl bg-white border border-gray-200 p-1 flex items-center justify-center overflow-hidden shadow-2xs">
            <img
              src={settings.companyLogo}
              alt={settings.brandName || 'Logo'}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        ) : (
          <div className="w-9 h-9 rounded-xl bg-[#168A45] flex items-center justify-center text-white font-extrabold text-lg shadow-sm border border-[#0B5D2A]/20">
            {settings?.brandName ? settings.brandName.charAt(0) : 'M'}
          </div>
        )}
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base md:text-lg font-bold text-slate-800 tracking-tight">
              {settings?.brandName || 'MYSAR'} Lead Management
            </h1>
            <span className="hidden lg:inline-flex bg-[#EAF7EF] text-[#0B5D2A] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#D9E5DD]">
              Sheets & GAS Sync
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            {settings?.companyName || 'Casbiro Solutions Private Limited'}
          </p>
        </div>
      </div>

      {/* Center Search & Actions */}
      <div className="flex items-center gap-2.5 flex-1 max-w-sm mx-1 md:mx-4">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search leads, institutes, contacts..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#F7FAF8] border border-gray-200 text-slate-800 text-xs md:text-sm rounded-lg pl-9 pr-8 py-2 focus:outline-none focus:bg-white focus:border-[#168A45] focus:ring-2 focus:ring-[#168A45]/15 transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2 justify-end shrink-0">
        {/* Refresh */}
        <button
          onClick={onRefresh}
          title="Refresh Data from Sheets"
          className="p-2 text-slate-500 hover:text-[#168A45] hover:bg-[#EAF7EF] rounded-lg border border-gray-200 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Notifications Bell with Badge */}
        <button
          onClick={onOpenNotifications}
          title="Automated Follow-up Notifications"
          className="relative p-2 text-slate-600 hover:text-[#168A45] hover:bg-[#EAF7EF] rounded-lg border border-gray-200 transition-colors"
        >
          <Bell className="w-4 h-4" />
          {notificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-extrabold w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
              {notificationsCount}
            </span>
          )}
        </button>

        {/* GAS Script Hub Button */}
        <button
          onClick={onOpenGasHub}
          className="hidden sm:flex bg-white hover:bg-[#EAF7EF] text-[#0B5D2A] border border-gray-200 px-2.5 py-2 rounded-lg text-xs font-semibold items-center space-x-1.5 transition-colors shadow-2xs"
        >
          <Code2 className="w-3.5 h-3.5 text-[#168A45]" />
          <span>GAS Hub</span>
        </button>

        {/* Add Lead Button */}
        <button
          onClick={onOpenNewLead}
          className="bg-[#168A45] hover:bg-[#0B5D2A] text-white px-3 md:px-3.5 py-2 rounded-lg text-xs md:text-sm font-bold flex items-center space-x-1 transition-all shadow-xs active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">+ Lead</span>
          <span className="sm:hidden">+</span>
        </button>

        {/* Active User Switcher / RBAC Role Badge */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center space-x-2 pl-2 pr-2.5 py-1.5 rounded-xl border border-gray-200 hover:border-[#168A45] bg-[#F7FAF8] hover:bg-white transition-all text-left group"
          >
            <div className="w-7 h-7 rounded-lg bg-[#168A45] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              {currentUser.name.charAt(0)}
            </div>
            <div className="hidden md:block">
              <div className="text-xs font-bold text-slate-800 leading-tight">
                {currentUser.name}
              </div>
              <div className="flex items-center space-x-1">
                <span className={`w-1.5 h-1.5 rounded-full ${roleDef.dotColor}`}></span>
                <span className="text-[10px] font-semibold text-slate-500">
                  {currentUser.role}
                </span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700" />
          </button>

          {/* User & Role Switcher Dropdown */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-3.5 bg-slate-50 border-b border-gray-100">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Active Session & Role
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">{currentUser.name}</div>
                    <div className="text-[11px] text-slate-500">{currentUser.email}</div>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border ${roleDef.badgeClass}`}
                  >
                    {currentUser.role}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed bg-white p-2 rounded-lg border border-gray-200">
                  {roleDef.description}
                </p>
              </div>

              <div className="p-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                  Switch Active Role / User
                </div>
                <div className="space-y-1">
                  {users.map((user) => {
                    const isSelected = user.id === currentUser.id;
                    const uRoleDef = ROLE_DEFINITIONS[user.role] || ROLE_DEFINITIONS.Salesperson;
                    return (
                      <button
                        key={user.id}
                        onClick={() => {
                          onSwitchUser(user);
                          setIsUserMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                          isSelected
                            ? 'bg-[#EAF7EF] text-[#0B5D2A] font-bold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${
                              isSelected
                                ? 'bg-[#168A45] text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold">{user.name}</div>
                            <div className="text-[10px] text-slate-400">{user.role}</div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#168A45]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-2 bg-slate-50 border-t border-gray-100 text-center">
                <div className="text-[10px] text-slate-500">
                  Permissions adjust dynamically based on selected role
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

