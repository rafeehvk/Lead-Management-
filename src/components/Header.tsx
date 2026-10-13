import React, { useState, useRef, useEffect } from 'react';
import {
  Code2,
  RefreshCw,
  Search,
  Bell,
  User as UserIcon,
  ShieldCheck,
  LogOut,
  Camera,
  X,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  Mail,
  Phone,
  Building2,
  BadgeCheck,
  KeyRound,
  Briefcase,
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
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNewLead,
  onOpenGasHub,
  onRefresh,
  searchQuery,
  onSearchChange,
  currentUser,
  onUpdateUser,
  onLogout,
  notificationsCount,
  onOpenNotifications,
  settings,
  isFullScreen = false,
  onToggleFullScreen,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
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
  const displayRoleName = currentUser.role === 'Salesperson' ? 'Executive' : currentUser.role;
  const navLogo = settings?.navbarLogo || settings?.companyLogo;

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-3 md:px-5 sticky top-0 z-30 flex items-center justify-between gap-3">
      {/* Brand & Subtext */}
      <div className="flex items-center space-x-2.5 shrink-0">
        {onToggleFullScreen && (
          <button
            type="button"
            onClick={onToggleFullScreen}
            title={isFullScreen ? 'Show Navigation Sidebar' : 'Full Screen Subpage View (Hide Sidebar)'}
            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
              isFullScreen
                ? 'bg-[#EAF7EF] text-[#0B5D2A] border-[#168A45]/40 shadow-2xs'
                : 'bg-slate-50 text-slate-600 hover:text-[#168A45] hover:bg-[#EAF7EF] border-gray-200'
            }`}
          >
            {isFullScreen ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        )}
        {navLogo ? (
          <div className="h-10 w-10 rounded-xl bg-white border border-gray-200 p-1 flex items-center justify-center overflow-hidden shadow-2xs">
            <img
              src={navLogo}
              alt={settings?.brandName || 'Logo'}
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
              {settings?.brandName || 'MYSAr'}
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF7EF] text-[#168A45] border border-[#168A45]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#168A45] animate-pulse"></span>
              Live Production
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
            placeholder="Search leads, clients, contacts..."
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
        {/* Full Screen Toggle Button */}
        {onToggleFullScreen && (
          <button
            type="button"
            onClick={onToggleFullScreen}
            title={isFullScreen ? 'Exit Full Screen Mode' : 'Expand Subpage to Full Screen'}
            className={`px-2.5 py-2 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
              isFullScreen
                ? 'bg-[#168A45] text-white border-[#0B5D2A] shadow-2xs'
                : 'bg-white text-slate-600 hover:text-[#168A45] hover:bg-[#EAF7EF] border-gray-200'
            }`}
          >
            {isFullScreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Exit Full Screen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Full Screen</span>
              </>
            )}
          </button>
        )}

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
          title="All Notifications & Alerts"
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

        {/* User Profile Pill & View Profile Icon */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            title="View User Account Details"
            className="flex items-center space-x-2.5 pl-2 pr-3 py-1.5 rounded-xl border border-gray-200 hover:border-[#168A45] bg-[#F7FAF8] hover:bg-white transition-all text-left group cursor-pointer"
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
                  {displayRoleName}
                </span>
              </div>
            </div>
            <div className="w-6 h-6 rounded-lg bg-white border border-gray-200 group-hover:border-[#168A45]/40 group-hover:bg-[#EAF7EF] flex items-center justify-center text-slate-500 group-hover:text-[#168A45] transition-colors">
              <UserIcon className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* User Account Details Dropdown */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Top Profile Header */}
              <div className="p-4 bg-slate-50 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    User Account Details
                  </span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${roleDef.badgeClass}`}
                  >
                    {displayRoleName}
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="relative group/avatar shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-[#168A45] text-white flex items-center justify-center font-bold text-sm overflow-hidden border border-gray-200 shadow-xs">
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
                    <div className="text-sm font-bold text-slate-800 truncate">{currentUser.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">{currentUser.email}</div>
                    {onUpdateUser && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setIsPhotoModalOpen(true);
                        }}
                        className="mt-1 text-[10px] text-[#168A45] hover:text-[#0B5D2A] font-semibold flex items-center space-x-1 cursor-pointer"
                      >
                        <Camera className="w-2.5 h-2.5" />
                        <span>Change Profile Photo</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Account Details List */}
              <div className="p-3.5 space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-50 border border-gray-100">
                  <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                    User ID / Staff ID
                  </span>
                  <span className="font-bold text-slate-800">
                    {currentUser.staffId || currentUser.userId || currentUser.id}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-50 border border-gray-100">
                  <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    Designation / Role
                  </span>
                  <span className="font-bold text-slate-800">
                    {currentUser.userType || displayRoleName}
                  </span>
                </div>

                {currentUser.department && (
                  <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-50 border border-gray-100">
                    <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      Department
                    </span>
                    <span className="font-bold text-slate-800 truncate max-w-[150px]">
                      {currentUser.department}
                    </span>
                  </div>
                )}

                {currentUser.mobile && (
                  <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-50 border border-gray-100">
                    <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      Mobile
                    </span>
                    <span className="font-bold text-slate-800">{currentUser.mobile}</span>
                  </div>
                )}

                <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-50 border border-gray-100">
                  <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                    <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Account Status
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {currentUser.status || 'Active'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setIsProfileModalOpen(true);
                  }}
                  className="w-full mt-1 flex items-center justify-center space-x-1.5 py-2 px-3 text-xs font-bold text-[#0B5D2A] bg-[#EAF7EF] hover:bg-[#d6f0e0] rounded-lg transition-colors border border-[#168A45]/20 cursor-pointer"
                >
                  <UserIcon className="w-3.5 h-3.5 text-[#168A45]" />
                  <span>View Full Profile Details</span>
                </button>
              </div>

              {/* Footer Sign Out */}
              {onLogout && (
                <div className="p-2.5 bg-slate-50 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Full User Profile Details Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in duration-150">
            <div className="bg-slate-50 border-b border-gray-200 px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserIcon className="w-4 h-4 text-[#168A45]" />
                <h4 className="font-bold text-sm text-slate-800">User Account Profile</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Avatar & Basic Info */}
              <div className="flex items-center space-x-4 pb-4 border-b border-gray-100">
                <div className="relative group/avatar shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-[#168A45] text-white flex items-center justify-center font-bold text-xl overflow-hidden border border-gray-200 shadow-xs">
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
                        setIsProfileModalOpen(false);
                        setIsPhotoModalOpen(true);
                      }}
                      className="absolute inset-0 rounded-2xl bg-black/40 text-white opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                      title="Change Profile Photo"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 truncate">{currentUser.name}</h3>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${roleDef.badgeClass}`}
                    >
                      {displayRoleName}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{currentUser.email}</p>
                  {onUpdateUser && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileModalOpen(false);
                        setIsPhotoModalOpen(true);
                      }}
                      className="mt-1.5 text-[11px] text-[#168A45] hover:text-[#0B5D2A] font-semibold flex items-center space-x-1 cursor-pointer"
                    >
                      <Camera className="w-3 h-3" />
                      <span>Update Profile Photo</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Detailed Account Information */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-gray-100">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Login ID / Username</div>
                  <div className="font-bold text-slate-800 mt-1">
                    {currentUser.userId || currentUser.email}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-gray-100">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Staff / Employee ID</div>
                  <div className="font-bold text-slate-800 mt-1">
                    {currentUser.staffId || currentUser.id}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-gray-100">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Role / Access Tier</div>
                  <div className="font-bold text-slate-800 mt-1">
                    {currentUser.userType || displayRoleName}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-gray-100">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Account Status</div>
                  <div className="font-bold text-emerald-700 mt-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    {currentUser.status || 'Active'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-gray-100">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Email Address</div>
                  <div className="font-semibold text-slate-800 mt-1 truncate">{currentUser.email}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-gray-100">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Mobile Number</div>
                  <div className="font-semibold text-slate-800 mt-1">
                    {currentUser.mobile || 'Not Provided'}
                  </div>
                </div>
                {currentUser.department && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-gray-100 col-span-2">
                    <div className="text-[10px] font-bold uppercase text-slate-400">Department</div>
                    <div className="font-semibold text-slate-800 mt-1">
                      {currentUser.department} {currentUser.departmentCode ? `(${currentUser.departmentCode})` : ''}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                {onLogout ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileModalOpen(false);
                      onLogout();
                    }}
                    className="px-3.5 py-2 text-red-600 hover:bg-red-50 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                ) : (
                  <div />
                )}
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-5 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

