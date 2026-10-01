import React, { useState } from 'react';
import {
  X,
  Search,
  Check,
  Shield,
  Save,
  RotateCcw,
  CheckCheck,
  AlertCircle,
  Eye,
  PlusSquare,
  Edit3,
  Trash2,
  Sparkles,
  LayoutDashboard,
  Users,
  Building2,
  TrendingUp,
  Truck,
  Boxes,
  Landmark,
  ShieldCheck,
  Laptop,
  Sliders,
  SlidersHorizontal,
} from 'lucide-react';
import { User, UserRole } from '../types';
import {
  SIDE_MENU_DEFINITIONS,
  SIDE_MENU_CATEGORIES,
  UserSideMenuPermission,
  getUserMenuPermissions,
  saveUserMenuPermissions,
  getDefaultMenuPermissionsForRole,
} from '../utils/menuPermissions';

interface UserMenuPermissionsModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (userId: string) => void;
}

export const UserMenuPermissionsModal: React.FC<UserMenuPermissionsModalProps> = ({
  user,
  isOpen,
  onClose,
  onSaved,
}) => {
  if (!isOpen) return null;

  // Local state for permissions
  const [permissions, setPermissions] = useState<Record<string, UserSideMenuPermission>>(() =>
    getUserMenuPermissions(user)
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Toggle single permission flag
  const handleToggle = (menuId: string, field: keyof UserSideMenuPermission) => {
    setPermissions((prev) => {
      const current = prev[menuId] || { viewOnly: false, entry: false, edit: false, delete: false };
      const updated = { ...current, [field]: !current[field] };

      // Logic: If user enables Entry, Edit, or Delete, View Only should automatically be true
      if ((field === 'entry' || field === 'edit' || field === 'delete') && updated[field]) {
        updated.viewOnly = true;
      }
      // If user turns off viewOnly, turn off entry, edit, delete as well
      if (field === 'viewOnly' && !updated.viewOnly) {
        updated.entry = false;
        updated.edit = false;
        updated.delete = false;
      }

      return {
        ...prev,
        [menuId]: updated,
      };
    });
    setSavedSuccess(false);
  };

  // Row-level actions
  const handleSetRowFull = (menuId: string) => {
    setPermissions((prev) => ({
      ...prev,
      [menuId]: { viewOnly: true, entry: true, edit: true, delete: true },
    }));
    setSavedSuccess(false);
  };

  const handleSetRowViewOnly = (menuId: string) => {
    setPermissions((prev) => ({
      ...prev,
      [menuId]: { viewOnly: true, entry: false, edit: false, delete: false },
    }));
    setSavedSuccess(false);
  };

  const handleSetRowNone = (menuId: string) => {
    setPermissions((prev) => ({
      ...prev,
      [menuId]: { viewOnly: false, entry: false, edit: false, delete: false },
    }));
    setSavedSuccess(false);
  };

  // Category-level actions
  const handleSetCategoryPermissions = (category: string, mode: 'full' | 'viewOnly' | 'none') => {
    setPermissions((prev) => {
      const next = { ...prev };
      SIDE_MENU_DEFINITIONS.filter((m) => m.category === category).forEach((m) => {
        if (mode === 'full') {
          next[m.id] = { viewOnly: true, entry: true, edit: true, delete: true };
        } else if (mode === 'viewOnly') {
          next[m.id] = { viewOnly: true, entry: false, edit: false, delete: false };
        } else {
          next[m.id] = { viewOnly: false, entry: false, edit: false, delete: false };
        }
      });
      return next;
    });
    setSavedSuccess(false);
  };

  // Global Bulk actions
  const handleSetAllFull = () => {
    const next: Record<string, UserSideMenuPermission> = {};
    SIDE_MENU_DEFINITIONS.forEach((m) => {
      next[m.id] = { viewOnly: true, entry: true, edit: true, delete: true };
    });
    setPermissions(next);
    setSavedSuccess(false);
  };

  const handleSetAllViewOnly = () => {
    const next: Record<string, UserSideMenuPermission> = {};
    SIDE_MENU_DEFINITIONS.forEach((m) => {
      next[m.id] = { viewOnly: true, entry: false, edit: false, delete: false };
    });
    setPermissions(next);
    setSavedSuccess(false);
  };

  const handleApplyRoleDefaults = (roleToApply: UserRole = user.role) => {
    const defaults = getDefaultMenuPermissionsForRole(roleToApply);
    setPermissions(defaults);
    setSavedSuccess(false);
  };

  const handleRevokeAll = () => {
    const next: Record<string, UserSideMenuPermission> = {};
    SIDE_MENU_DEFINITIONS.forEach((m) => {
      next[m.id] = { viewOnly: false, entry: false, edit: false, delete: false };
    });
    setPermissions(next);
    setSavedSuccess(false);
  };

  // Save handler
  const handleSave = () => {
    saveUserMenuPermissions(user.id, permissions);
    setSavedSuccess(true);
    if (onSaved) onSaved(user.id);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  // Filtered menu items
  const filteredItems = SIDE_MENU_DEFINITIONS.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesQuery =
      searchQuery.trim() === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  // Unique categories in filtered result
  const activeCategories = Array.from(new Set(filteredItems.map((i) => i.category)));

  // Calculate statistics
  const totalMenus = SIDE_MENU_DEFINITIONS.length;
  const permissionList = Object.values(permissions) as UserSideMenuPermission[];
  const viewCount = permissionList.filter((p) => p?.viewOnly).length;
  const entryCount = permissionList.filter((p) => p?.entry).length;
  const editCount = permissionList.filter((p) => p?.edit).length;
  const deleteCount = permissionList.filter((p) => p?.delete).length;

  const displayUserId = user.userId || (user.email ? user.email.split('@')[0] : user.id.toLowerCase());

  // Category Icon helper
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Dashboard & Overview':
        return <LayoutDashboard className="w-4 h-4 text-[#168A45]" />;
      case 'Lead Management (CRM)':
        return <Users className="w-4 h-4 text-emerald-600" />;
      case 'HR & Institution Management':
        return <Building2 className="w-4 h-4 text-teal-600" />;
      case 'Sales Management':
        return <TrendingUp className="w-4 h-4 text-emerald-700" />;
      case 'Purchase Management':
        return <Truck className="w-4 h-4 text-amber-600" />;
      case 'Inventory Management':
        return <Boxes className="w-4 h-4 text-indigo-600" />;
      case 'Party Management':
        return <Building2 className="w-4 h-4 text-slate-600" />;
      case 'Finance & Accounts':
        return <Landmark className="w-4 h-4 text-emerald-800" />;
      case 'Document Expiry & Compliance':
        return <ShieldCheck className="w-4 h-4 text-purple-600" />;
      case 'Asset Management':
        return <Laptop className="w-4 h-4 text-blue-600" />;
      case 'Settings & Administration':
        return <Sliders className="w-4 h-4 text-slate-700" />;
      default:
        return <Shield className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* MODAL HEADER */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between border-b border-slate-700 shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white font-extrabold text-base overflow-hidden shrink-0 shadow-xs">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span>{user.name.charAt(0)}</span>
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5">
                  <span>{user.name}</span>
                  <span className="text-slate-400 text-xs font-mono font-medium">(@{displayUserId})</span>
                </h2>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                    user.role === 'Admin'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                      : user.role === 'Manager'
                      ? 'bg-teal-500/20 text-teal-300 border-teal-400/30'
                      : 'bg-blue-500/20 text-blue-300 border-blue-400/30'
                  }`}
                >
                  {user.role}
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-md font-mono">
                  ID: {user.id}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-2">
                <span>Side Menu Access Control Matrix: <strong>View Only</strong>, <strong>Entry</strong>, <strong>Edit</strong>, <strong>Delete</strong></span>
                {user.email && <span className="text-slate-400 hidden sm:inline">• {user.email}</span>}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SUMMARY STATS & BULK CONTROLS BAR */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 shrink-0 flex flex-wrap items-center justify-between gap-3">
          {/* Permission Stats Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-slate-600">Active Permissions:</span>
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold border border-blue-200">
              <Eye className="w-3.5 h-3.5" />
              <span>View: <strong>{viewCount}</strong> / {totalMenus}</span>
            </span>
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              <PlusSquare className="w-3.5 h-3.5" />
              <span>Entry: <strong>{entryCount}</strong> / {totalMenus}</span>
            </span>
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 font-semibold border border-teal-200">
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit: <strong>{editCount}</strong> / {totalMenus}</span>
            </span>
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-semibold border border-rose-200">
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete: <strong>{deleteCount}</strong> / {totalMenus}</span>
            </span>
          </div>

          {/* Quick Preset Actions */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={handleSetAllFull}
              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg border border-emerald-200 transition-colors cursor-pointer flex items-center space-x-1"
              title="Grant all 4 access levels across all side menus"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Grant Full All</span>
            </button>
            <button
              onClick={handleSetAllViewOnly}
              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold rounded-lg border border-blue-200 transition-colors cursor-pointer flex items-center space-x-1"
              title="Set View Only for all menus"
            >
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              <span>View Only All</span>
            </button>
            <button
              onClick={() => handleApplyRoleDefaults(user.role)}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg border border-slate-300 transition-colors cursor-pointer flex items-center space-x-1"
              title={`Reset to default template for ${user.role}`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Apply {user.role} Defaults</span>
            </button>
            <button
              onClick={handleRevokeAll}
              className="px-2 py-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors cursor-pointer text-xs"
              title="Revoke all menu access"
            >
              <span>Revoke All</span>
            </button>
          </div>
        </div>

        {/* SEARCH & CATEGORY FILTER TABS */}
        <div className="px-6 py-2.5 bg-white border-b border-slate-200 shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search side menu by name, keyword, or module..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F7FAF8] border border-slate-200 rounded-xl pl-8.5 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0 text-xs text-slate-600">
            <span className="text-[11px] font-bold text-slate-400 mr-1 shrink-0">Module:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[#F7FAF8] border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#168A45]"
            >
              <option value="All">All Modules ({SIDE_MENU_DEFINITIONS.length})</option>
              {SIDE_MENU_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat} ({SIDE_MENU_DEFINITIONS.filter((m) => m.category === cat).length})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* MENU PERMISSIONS TABLE */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeCategories.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              No side menu items matching &quot;{searchQuery}&quot;
            </div>
          ) : (
            activeCategories.map((category) => {
              const categoryItems = filteredItems.filter((i) => i.category === category);

              return (
                <div key={category} className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  {/* Category Header */}
                  <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(category)}
                      <span className="font-extrabold text-slate-800 text-xs tracking-tight">
                        {category}
                      </span>
                      <span className="text-[10px] font-bold bg-white text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                        {categoryItems.length} Menus
                      </span>
                    </div>

                    {/* Category-level quick toggles */}
                    <div className="flex items-center space-x-1.5 text-[11px]">
                      <span className="text-slate-400 text-[10px] mr-1 hidden sm:inline">Module action:</span>
                      <button
                        onClick={() => handleSetCategoryPermissions(category, 'full')}
                        className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded font-bold border border-emerald-200 transition-colors cursor-pointer text-[10px]"
                      >
                        All 4 Access
                      </button>
                      <button
                        onClick={() => handleSetCategoryPermissions(category, 'viewOnly')}
                        className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded font-bold border border-blue-200 transition-colors cursor-pointer text-[10px]"
                      >
                        View Only
                      </button>
                      <button
                        onClick={() => handleSetCategoryPermissions(category, 'none')}
                        className="px-2 py-0.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer text-[10px]"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Items List Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50/60 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                          <th className="py-2.5 px-4">Side Menu Item</th>
                          <th className="py-2.5 px-3 text-center w-28 text-blue-800 bg-blue-50/30">
                            <div className="flex items-center justify-center space-x-1">
                              <Eye className="w-3 h-3 text-blue-600" />
                              <span>View Only</span>
                            </div>
                          </th>
                          <th className="py-2.5 px-3 text-center w-28 text-emerald-800 bg-emerald-50/30">
                            <div className="flex items-center justify-center space-x-1">
                              <PlusSquare className="w-3 h-3 text-emerald-600" />
                              <span>Entry (New)</span>
                            </div>
                          </th>
                          <th className="py-2.5 px-3 text-center w-28 text-teal-800 bg-teal-50/30">
                            <div className="flex items-center justify-center space-x-1">
                              <Edit3 className="w-3 h-3 text-teal-600" />
                              <span>Edit</span>
                            </div>
                          </th>
                          <th className="py-2.5 px-3 text-center w-28 text-rose-800 bg-rose-50/30">
                            <div className="flex items-center justify-center space-x-1">
                              <Trash2 className="w-3 h-3 text-rose-600" />
                              <span>Delete</span>
                            </div>
                          </th>
                          <th className="py-2.5 px-3 text-right w-24">Quick</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {categoryItems.map((item) => {
                          const p = permissions[item.id] || {
                            viewOnly: false,
                            entry: false,
                            edit: false,
                            delete: false,
                          };

                          const isFullyAllowed = p.viewOnly && p.entry && p.edit && p.delete;
                          const isNone = !p.viewOnly && !p.entry && !p.edit && !p.delete;

                          return (
                            <tr
                              key={item.id}
                              className={`hover:bg-[#F7FAF8] transition-colors ${
                                isNone ? 'opacity-70 bg-slate-50/30' : ''
                              }`}
                            >
                              {/* Menu Name & Description */}
                              <td className="py-3 px-4">
                                <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                                  <span>{item.name}</span>
                                  {isFullyAllowed && (
                                    <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-extrabold border border-emerald-200">
                                      Full
                                    </span>
                                  )}
                                  {p.viewOnly && !p.entry && !p.edit && !p.delete && (
                                    <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-extrabold border border-blue-200">
                                      Read Only
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                                  {item.description}
                                </p>
                              </td>

                              {/* View Only Checkbox */}
                              <td className="py-3 px-3 text-center bg-blue-50/10">
                                <label className="inline-flex items-center justify-center cursor-pointer p-1">
                                  <input
                                    type="checkbox"
                                    checked={p.viewOnly}
                                    onChange={() => handleToggle(item.id, 'viewOnly')}
                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                  />
                                </label>
                              </td>

                              {/* Entry Checkbox */}
                              <td className="py-3 px-3 text-center bg-emerald-50/10">
                                <label className="inline-flex items-center justify-center cursor-pointer p-1">
                                  <input
                                    type="checkbox"
                                    checked={p.entry}
                                    onChange={() => handleToggle(item.id, 'entry')}
                                    className="w-4 h-4 rounded text-[#168A45] focus:ring-[#168A45] cursor-pointer"
                                  />
                                </label>
                              </td>

                              {/* Edit Checkbox */}
                              <td className="py-3 px-3 text-center bg-teal-50/10">
                                <label className="inline-flex items-center justify-center cursor-pointer p-1">
                                  <input
                                    type="checkbox"
                                    checked={p.edit}
                                    onChange={() => handleToggle(item.id, 'edit')}
                                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                                  />
                                </label>
                              </td>

                              {/* Delete Checkbox */}
                              <td className="py-3 px-3 text-center bg-rose-50/10">
                                <label className="inline-flex items-center justify-center cursor-pointer p-1">
                                  <input
                                    type="checkbox"
                                    checked={p.delete}
                                    onChange={() => handleToggle(item.id, 'delete')}
                                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                                  />
                                </label>
                              </td>

                              {/* Row Quick Buttons */}
                              <td className="py-3 px-3 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end space-x-1">
                                  <button
                                    onClick={() => handleSetRowFull(item.id)}
                                    title="Grant Full 4 Access"
                                    className="px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 hover:bg-emerald-50 rounded cursor-pointer border border-emerald-200"
                                  >
                                    All
                                  </button>
                                  <button
                                    onClick={() => handleSetRowViewOnly(item.id)}
                                    title="Set View Only"
                                    className="px-1.5 py-0.5 text-[10px] font-bold text-blue-700 hover:bg-blue-50 rounded cursor-pointer border border-blue-200"
                                  >
                                    View
                                  </button>
                                  <button
                                    onClick={() => handleSetRowNone(item.id)}
                                    title="Clear access"
                                    className="px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer border border-slate-200"
                                  >
                                    0
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 shrink-0 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {savedSuccess ? (
              <span className="inline-flex items-center space-x-1.5 text-xs font-extrabold text-[#0B5D2A] bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-xl animate-bounce">
                <Check className="w-4 h-4" />
                <span>Menu access permissions saved successfully!</span>
              </span>
            ) : (
              <span className="text-xs text-slate-500">
                Grant or restrict each side menu for <strong>{user.name}</strong>.
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white font-extrabold rounded-xl text-xs transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer active:scale-98"
            >
              <Save className="w-4 h-4" />
              <span>Save Menu Permissions</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
