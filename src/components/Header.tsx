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
  LogOut,
  Camera,
  X,
} from 'lucide-react';
import { User, UserRole, Settings } from '../types';
import { ROLE_DEFINITIONS } from '../utils/rbac';
import { ProfilePhotoUploader } from './ProfilePhotoUploader';

interface HeaderProps {
  onOpenNewLead: () => void;
  onOpenGasHub: () => void;
  onRefresh: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  currentUser: User;
  users: User[];
  onSwitchUser: (user: User) => void;
  onUpdateUser?: (user: User) => void;
  onLogout?: () => void;
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
  onUpdateUser,
  onLogout,
  notificationsCount,
  onOpenNotifications,
  settings,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
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
              {settings?.brandName ? (settings.brandName.includes('ERP') ? settings.brandName : `${settings.brandName} ERP`) : 'MYSAR ERP'}
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
            <div className="w-7 h-7 rounded-lg bg-[#168A45] text-white flex items-center justify-center font-bold text-xs shadow-2xs overflow-hidden shrink-0 border border-gray-200">
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                currentUser.name.charAt(0)
              )}
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
            <div className="absolute right-0 mt-2 w-76 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-3.5 bg-slate-50 border-b border-gray-100">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Active Session & Role
                </div>
                <div className="flex items-center space-x-3">
                  <div className="relative group/avatar shrink-0">
                    <div className="w-11 h-11 rounded-xl bg-[#168A45] text-white flex items-center justify-center font-bold text-sm overflow-hidden border border-gray-200 shadow-xs">
                      {currentUser.avatar ? (
                        <img
                          src={currentUser.avatar}
                          alt={currentUser.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        currentUser.name.charAt(0)
                      )}
                    </div>
                    {onUpdateUser && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setIsPhotoModalOpen(true);
                        }}
                        className="absolute inset-0 rounded-xl bg-black/40 text-white opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                        title="Change Profile Photo"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-800 truncate">{currentUser.name}</div>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${roleDef.badgeClass}`}
                      >
                        {currentUser.role}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{currentUser.email}</div>
                    {onUpdateUser && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setIsPhotoModalOpen(true);
                        }}
                        className="mt-1 text-[10px] text-[#168A45] hover:text-[#0B5D2A] font-semibold flex items-center space-x-1"
                      >
                        <Camera className="w-2.5 h-2.5" />
                        <span>Change Profile Photo</span>
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-2.5 leading-relaxed bg-white p-2 rounded-lg border border-gray-200">
                  {roleDef.description}
                </p>
              </div>

              <div className="p-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                  Switch Active Role / User
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {users.map((user) => {
                    const isSelected = user.id === currentUser.id;
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
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold overflow-hidden shrink-0 border ${
                              isSelected
                                ? 'bg-[#168A45] text-white border-[#168A45]'
                                : 'bg-slate-100 text-slate-600 border-gray-200'
                            }`}
                          >
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              user.name.charAt(0)
                            )}
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

              <div className="p-2 bg-slate-50 border-t border-gray-100 flex flex-col space-y-1.5">
                <div className="text-[10px] text-slate-500 text-center">
                  Permissions adjust dynamically based on selected role
                </div>
                {onLogout && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Profile Photo Update Modal */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in duration-150">
            <div className="bg-slate-50 border-b border-gray-200 px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Camera className="w-4 h-4 text-[#168A45]" />
                <h4 className="font-bold text-sm text-slate-800">
                  Update Profile Photo: <span className="text-[#0B5D2A]">{currentUser.name}</span>
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsPhotoModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <ProfilePhotoUploader
                currentAvatar={currentUser.avatar}
                userName={currentUser.name}
                onAvatarChange={(avatarUrl) => {
                  const updated: User = { ...currentUser, avatar: avatarUrl };
                  if (onUpdateUser) {
                    onUpdateUser(updated);
                  }
                }}
                onAvatarRemove={() => {
                  const updated: User = { ...currentUser, avatar: '' };
                  if (onUpdateUser) {
                    onUpdateUser(updated);
                  }
                }}
                label="Your Profile Photo"
                description="Upload an image, pick from corporate avatar presets, or provide a URL"
              />

              <div className="pt-3 border-t border-gray-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(false)}
                  className="px-4 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white font-bold rounded-lg text-xs shadow-xs"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

