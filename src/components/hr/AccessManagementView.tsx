import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  Eye,
  PlusSquare,
  Edit3,
  Trash2,
  Search,
  Check,
  CheckCheck,
  X,
  RotateCcw,
  Save,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Layers,
  ArrowRight,
  Building2,
  ChevronRight,
  Copy,
  Users,
  Shield,
  Filter,
  RefreshCw,
  Award,
} from 'lucide-react';
import {
  SIDE_MENU_DEFINITIONS,
  SIDE_MENU_CATEGORIES,
  MenuItemDefinition,
} from '../../utils/menuPermissions';
import {
  HrSettingsConfig,
  RoleMenuPermission,
  DepartmentRole,
  DepartmentMaster,
} from '../../types/hr';
import { hrStorage } from '../../services/hrStorageService';

interface AccessManagementViewProps {
  settings: HrSettingsConfig;
  onSavePermissions?: (
    updatedPermissions: Record<string, RoleMenuPermission>,
    departmentRolePermissions?: Record<string, Record<string, Record<string, RoleMenuPermission>>>
  ) => void;
  onSaveDepartmentRolePermissions?: (
    departmentCode: string,
    roleId: string,
    permissions: Record<string, RoleMenuPermission>
  ) => void;
}

// Preset definitions for quick role population
interface PermissionPreset {
  id: string;
  name: string;
  description: string;
  badge: string;
  generator: (menu: MenuItemDefinition, deptCode: string) => RoleMenuPermission;
}

const PRESETS: PermissionPreset[] = [
  {
    id: 'super-admin',
    name: 'Super Admin (Full Control)',
    description: 'Unrestricted View, Entry, Edit, and Delete access across all institutional ERP modules.',
    badge: 'Full Access',
    generator: () => ({ view: true, entry: true, edit: true, delete: true }),
  },
  {
    id: 'dept-manager',
    name: 'Department Manager',
    description: 'Full View, Entry, and Edit permissions across operational modules; Delete restricted on sensitive data.',
    badge: 'Entry & Edit',
    generator: (item) => {
      const isSensitive =
        item.category === 'Settings & Administration' ||
        item.id === 'doc-renewals' ||
        item.id === 'finance-gl';
      return {
        view: true,
        entry: !isSensitive,
        edit: !isSensitive,
        delete: item.id.includes('leads') || item.id.includes('followups'),
      };
    },
  },
  {
    id: 'dept-context',
    name: 'Department Specific Core',
    description: 'Granular access tailored specifically to this department functions and responsibilities.',
    badge: 'Dept Aligned',
    generator: (item, deptCode) => {
      // 101 Academic
      if (deptCode === '101') {
        const isAcademic =
          item.category.includes('HR') ||
          item.category.includes('Lead') ||
          item.id === 'dashboard' ||
          item.id === 'staff-directory' ||
          item.id === 'hr-attendance' ||
          item.id === 'hr-leaves' ||
          item.id === 'hr-kpis';
        return {
          view: isAcademic,
          entry: isAcademic && !item.id.includes('payroll') && !item.id.includes('settings'),
          edit: isAcademic && !item.id.includes('payroll') && !item.id.includes('settings'),
          delete: false,
        };
      }
      // 103 Finance
      if (deptCode === '103') {
        const isFinance =
          item.category.includes('Finance') ||
          item.category.includes('Sales') ||
          item.category.includes('Purchase') ||
          item.id === 'hr-payroll' ||
          item.id === 'dashboard';
        return {
          view: isFinance,
          entry: isFinance,
          edit: isFinance,
          delete: item.id.includes('receipts') || item.id.includes('payments'),
        };
      }
      // 104 HR
      if (deptCode === '104') {
        const isHr = item.category.includes('HR') || item.id === 'dashboard' || item.id === 'doc-renewals';
        return {
          view: isHr,
          entry: isHr,
          edit: isHr,
          delete: item.id.includes('interviews') || item.id.includes('applicants'),
        };
      }
      // 105 IT
      if (deptCode === '105') {
        return {
          view: true,
          entry: true,
          edit: true,
          delete: item.id.includes('settings') || item.id.includes('logs'),
        };
      }
      // Default operational
      return {
        view: item.category.includes('HR') || item.id === 'dashboard',
        entry: false,
        edit: false,
        delete: false,
      };
    },
  },
  {
    id: 'operational-staff',
    name: 'Operational Staff (Entry & Edit)',
    description: 'Day-to-day operations: View, Entry, and Edit on daily activities; no delete or administrative settings.',
    badge: 'Operations',
    generator: (item) => {
      const isSettings = item.category === 'Settings & Administration';
      return {
        view: !isSettings,
        entry: !isSettings && !item.id.includes('payroll'),
        edit: !isSettings && !item.id.includes('payroll'),
        delete: false,
      };
    },
  },
  {
    id: 'view-only',
    name: 'View Only (Auditor / Inspector)',
    description: 'Read-only access across all institutional reports, registries, dashboards, and archives.',
    badge: 'Read-Only',
    generator: () => ({ view: true, entry: false, edit: false, delete: false }),
  },
];

// Helper to construct initial permissions for a specific role and department
const resolveRolePermissions = (
  settings: HrSettingsConfig,
  departmentCode: string,
  role: DepartmentRole
): Record<string, RoleMenuPermission> => {
  const result: Record<string, RoleMenuPermission> = {};

  // 1. Check settings.departmentRolePermissions[departmentCode][role.id]
  const fromSettings = settings.departmentRolePermissions?.[departmentCode]?.[role.id];
  // 2. Check role.menuPermissions
  const fromRole = role.menuPermissions;
  // 3. Fallback to settings.rolePermissions
  const fallback = settings.rolePermissions || {};

  const existing = fromSettings || fromRole || fallback;

  const isSuperAdmin = role.accessLevel.includes('Super Admin');
  const isManager = role.accessLevel.includes('Manager');
  const isViewOnly = role.accessLevel.includes('View Only');

  SIDE_MENU_DEFINITIONS.forEach((item) => {
    if (existing[item.id]) {
      result[item.id] = {
        view: !!existing[item.id].view,
        entry: !!existing[item.id].entry,
        edit: !!existing[item.id].edit,
        delete: !!existing[item.id].delete,
      };
    } else if (isSuperAdmin) {
      result[item.id] = { view: true, entry: true, edit: true, delete: true };
    } else if (isViewOnly) {
      result[item.id] = { view: true, entry: false, edit: false, delete: false };
    } else if (isManager) {
      const isSensitive = item.category === 'Settings & Administration';
      result[item.id] = {
        view: true,
        entry: !isSensitive,
        edit: !isSensitive,
        delete: item.id.includes('leads') || item.id.includes('followups'),
      };
    } else {
      // Standard operational
      const isAllowedDept =
        departmentCode === '101'
          ? item.category.includes('HR') || item.id === 'dashboard'
          : departmentCode === '103'
          ? item.category.includes('Finance') || item.category.includes('Sales') || item.id === 'dashboard'
          : departmentCode === '104'
          ? item.category.includes('HR') || item.id === 'dashboard'
          : true;

      result[item.id] = {
        view: isAllowedDept,
        entry: isAllowedDept && !item.category.includes('Settings'),
        edit: isAllowedDept && !item.category.includes('Settings'),
        delete: false,
      };
    }
  });

  return result;
};

export const AccessManagementView: React.FC<AccessManagementViewProps> = ({
  settings,
  onSavePermissions,
  onSaveDepartmentRolePermissions,
}) => {
  // Master lists
  const [departments, setDepartments] = useState<DepartmentMaster[]>(() =>
    hrStorage.getDepartmentsMaster()
  );
  const [allRoles, setAllRoles] = useState<DepartmentRole[]>(() =>
    hrStorage.getDepartmentRoles()
  );

  // Selected Department and Selected Role
  const [selectedDeptCode, setSelectedDeptCode] = useState<string>(() => {
    return departments[0]?.departmentCode || '101';
  });

  // Roles belonging strictly to the selected department
  const departmentRoles = useMemo(() => {
    return allRoles.filter(
      (r) => r.departmentCode.trim().toLowerCase() === selectedDeptCode.trim().toLowerCase()
    );
  }, [allRoles, selectedDeptCode]);

  // Selected Role inside the department
  const [selectedRoleId, setSelectedRoleId] = useState<string>(() => {
    return departmentRoles[0]?.id || 'ROLE-101-01';
  });

  // Keep selectedRoleId valid whenever selectedDeptCode changes
  useEffect(() => {
    if (departmentRoles.length > 0) {
      const exists = departmentRoles.some((r) => r.id === selectedRoleId);
      if (!exists) {
        setSelectedRoleId(departmentRoles[0].id);
      }
    }
  }, [departmentRoles, selectedRoleId]);

  const activeRole = useMemo(() => {
    return (
      departmentRoles.find((r) => r.id === selectedRoleId) ||
      allRoles.find((r) => r.id === selectedRoleId) ||
      departmentRoles[0] ||
      allRoles[0]
    );
  }, [departmentRoles, allRoles, selectedRoleId]);

  const activeDepartment = useMemo(() => {
    return (
      departments.find((d) => d.departmentCode === selectedDeptCode) ||
      departments[0] || {
        departmentCode: selectedDeptCode,
        departmentName: activeRole?.departmentName || 'General',
        reporting: 'Managing Director',
      }
    );
  }, [departments, selectedDeptCode, activeRole]);

  // Permissions state for the currently active Department + Role
  const [currentPermissions, setCurrentPermissions] = useState<Record<string, RoleMenuPermission>>({});

  // When active role or department changes, load its permissions
  useEffect(() => {
    if (activeRole) {
      const perms = resolveRolePermissions(settings, selectedDeptCode, activeRole);
      setCurrentPermissions(perms);
      setActivePreset('custom');
      setSavedSuccess(false);
    }
  }, [selectedDeptCode, activeRole, settings]);

  // View Mode: 'editor' | 'matrix'
  const [viewMode, setViewMode] = useState<'editor' | 'matrix'>('editor');

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [filterType, setFilterType] = useState<'all' | 'full' | 'viewOnly' | 'noAccess' | 'custom'>('all');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [activePreset, setActivePreset] = useState<string>('custom');

  // Copy Permissions Modal / Dropdown state
  const [copySourceRoleId, setCopySourceRoleId] = useState<string>('');

  // Toggle single permission flag with cascading logic
  const handleToggle = (menuId: string, field: keyof RoleMenuPermission) => {
    setCurrentPermissions((prev) => {
      const current = prev[menuId] || { view: false, entry: false, edit: false, delete: false };
      const updated = { ...current, [field]: !current[field] };

      // RBAC Cascading rule:
      // If user enables Entry, Edit, or Delete, View automatically becomes true
      if ((field === 'entry' || field === 'edit' || field === 'delete') && updated[field]) {
        updated.view = true;
      }
      // If user unchecks View, uncheck Entry, Edit, and Delete as well
      if (field === 'view' && !updated.view) {
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

  // Row-level quick setters
  const handleSetRowFull = (menuId: string) => {
    setCurrentPermissions((prev) => ({
      ...prev,
      [menuId]: { view: true, entry: true, edit: true, delete: true },
    }));
    setSavedSuccess(false);
  };

  const handleSetRowReadWrite = (menuId: string) => {
    setCurrentPermissions((prev) => ({
      ...prev,
      [menuId]: { view: true, entry: true, edit: true, delete: false },
    }));
    setSavedSuccess(false);
  };

  const handleSetRowViewOnly = (menuId: string) => {
    setCurrentPermissions((prev) => ({
      ...prev,
      [menuId]: { view: true, entry: false, edit: false, delete: false },
    }));
    setSavedSuccess(false);
  };

  const handleSetRowNone = (menuId: string) => {
    setCurrentPermissions((prev) => ({
      ...prev,
      [menuId]: { view: false, entry: false, edit: false, delete: false },
    }));
    setSavedSuccess(false);
  };

  // Bulk actions for current filtered category
  const handleCategoryFullAccess = (category: string) => {
    const targetItems =
      category === 'All'
        ? SIDE_MENU_DEFINITIONS
        : SIDE_MENU_DEFINITIONS.filter((item) => item.category === category);

    setCurrentPermissions((prev) => {
      const next = { ...prev };
      targetItems.forEach((item) => {
        next[item.id] = { view: true, entry: true, edit: true, delete: true };
      });
      return next;
    });
    setSavedSuccess(false);
  };

  const handleCategoryViewOnly = (category: string) => {
    const targetItems =
      category === 'All'
        ? SIDE_MENU_DEFINITIONS
        : SIDE_MENU_DEFINITIONS.filter((item) => item.category === category);

    setCurrentPermissions((prev) => {
      const next = { ...prev };
      targetItems.forEach((item) => {
        next[item.id] = { view: true, entry: false, edit: false, delete: false };
      });
      return next;
    });
    setSavedSuccess(false);
  };

  const handleCategoryRevokeAll = (category: string) => {
    const targetItems =
      category === 'All'
        ? SIDE_MENU_DEFINITIONS
        : SIDE_MENU_DEFINITIONS.filter((item) => item.category === category);

    setCurrentPermissions((prev) => {
      const next = { ...prev };
      targetItems.forEach((item) => {
        next[item.id] = { view: false, entry: false, edit: false, delete: false };
      });
      return next;
    });
    setSavedSuccess(false);
  };

  // Apply a template preset
  const handleApplyPreset = (preset: PermissionPreset) => {
    const updated: Record<string, RoleMenuPermission> = {};
    SIDE_MENU_DEFINITIONS.forEach((item) => {
      updated[item.id] = preset.generator(item, selectedDeptCode);
    });
    setCurrentPermissions(updated);
    setActivePreset(preset.id);
    setSavedSuccess(false);
  };

  // Copy permissions from another role
  const handleCopyFromRole = () => {
    if (!copySourceRoleId) return;
    const sourceRole = allRoles.find((r) => r.id === copySourceRoleId);
    if (!sourceRole) return;

    const sourcePerms = resolveRolePermissions(settings, sourceRole.departmentCode, sourceRole);
    setCurrentPermissions(sourcePerms);
    setSavedSuccess(false);
    setSavedMessage(`Permissions cloned from ${sourceRole.roleTitle} (${sourceRole.departmentName})`);
  };

  // Save handler for current department role
  const handleSave = () => {
    if (!activeRole) return;

    // 1. Persist directly to hrStorage service
    hrStorage.saveDepartmentRolePermissions(
      selectedDeptCode,
      activeRole.id,
      currentPermissions
    );

    // 2. Build updated departmentRolePermissions structure for settings
    const updatedDeptRolePerms: Record<string, Record<string, Record<string, RoleMenuPermission>>> = {
      ...(settings.departmentRolePermissions || {}),
    };
    if (!updatedDeptRolePerms[selectedDeptCode]) {
      updatedDeptRolePerms[selectedDeptCode] = {};
    }
    updatedDeptRolePerms[selectedDeptCode][activeRole.id] = currentPermissions;

    // Also update parent callback
    if (onSavePermissions) {
      onSavePermissions(currentPermissions, updatedDeptRolePerms);
    }
    if (onSaveDepartmentRolePermissions) {
      onSaveDepartmentRolePermissions(selectedDeptCode, activeRole.id, currentPermissions);
    }

    // Refresh role in local allRoles state
    setAllRoles((prev) =>
      prev.map((r) => (r.id === activeRole.id ? { ...r, menuPermissions: currentPermissions } : r))
    );

    setSavedMessage(`Permissions saved for ${activeRole.roleTitle} (${activeDepartment.departmentName})`);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  // Reset to default
  const handleResetToDefaults = () => {
    if (!activeRole) return;
    if (
      window.confirm(
        `Reset side menu permissions for "${activeRole.roleTitle}" to standard institutional defaults?`
      )
    ) {
      const reset = resolveRolePermissions({} as HrSettingsConfig, selectedDeptCode, activeRole);
      setCurrentPermissions(reset);
      setSavedSuccess(false);
    }
  };

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return SIDE_MENU_DEFINITIONS.filter((item) => {
      // Category filter
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesCategory = item.category.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesId = item.id.toLowerCase().includes(q);
        if (!matchesName && !matchesCategory && !matchesDesc && !matchesId) {
          return false;
        }
      }

      // Filter type
      const perm = currentPermissions[item.id] || { view: false, entry: false, edit: false, delete: false };
      const isFull = perm.view && perm.entry && perm.edit && perm.delete;
      const isViewOnly = perm.view && !perm.entry && !perm.edit && !perm.delete;
      const isNoAccess = !perm.view && !perm.entry && !perm.edit && !perm.delete;
      const isCustom = perm.view && !isFull && !isViewOnly;

      if (filterType === 'full') return isFull;
      if (filterType === 'viewOnly') return isViewOnly;
      if (filterType === 'noAccess') return isNoAccess;
      if (filterType === 'custom') return isCustom;

      return true;
    });
  }, [selectedCategory, searchQuery, filterType, currentPermissions]);

  // Metrics for active department role
  const metrics = useMemo(() => {
    let fullCount = 0;
    let viewOnlyCount = 0;
    let noAccessCount = 0;
    let editCount = 0;
    let deleteCount = 0;
    let viewCount = 0;

    SIDE_MENU_DEFINITIONS.forEach((item) => {
      const p = currentPermissions[item.id];
      if (!p || !p.view) {
        noAccessCount++;
      } else {
        viewCount++;
        if (p.view && p.entry && p.edit && p.delete) {
          fullCount++;
        } else if (p.view && !p.entry && !p.edit && !p.delete) {
          viewOnlyCount++;
        }
      }
      if (p?.edit) editCount++;
      if (p?.delete) deleteCount++;
    });

    return {
      total: SIDE_MENU_DEFINITIONS.length,
      viewCount,
      fullCount,
      viewOnlyCount,
      noAccessCount,
      editCount,
      deleteCount,
    };
  }, [currentPermissions]);

  return (
    <div className="space-y-6">
      {/* TOP HEADER & VIEW MODE TOGGLE */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#168A45]" />
            <span>Department-Associated Access Management & Side Menu Matrix</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure granular View, Entry, Edit, and Delete access levels for roles associated specifically with each department.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('editor')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'editor'
                  ? 'bg-white text-[#0B5D2A] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Role Permission Editor
            </button>
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'matrix'
                  ? 'bg-white text-[#0B5D2A] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Department Cross-Matrix
            </button>
          </div>

          {savedSuccess && (
            <span className="flex items-center space-x-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="truncate max-w-[200px]">{savedMessage || 'Saved'}</span>
            </span>
          )}

          {viewMode === 'editor' && (
            <>
              <button
                type="button"
                onClick={handleResetToDefaults}
                className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-200"
                title="Reset to defaults"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="flex items-center space-x-1.5 px-4 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-extrabold transition-all shadow-xs cursor-pointer active:scale-98"
              >
                <Save className="w-4 h-4" />
                <span>Save Permissions</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* STEP 1: SELECT DEPARTMENT */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-[#168A45]" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              1. Select Department:
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            {departments.length} departments registered in institutional master
          </span>
        </div>

        {/* Department Pills / Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {departments.map((dept) => {
            const isSelected = dept.departmentCode === selectedDeptCode;
            const rolesCount = allRoles.filter(
              (r) => r.departmentCode.toLowerCase() === dept.departmentCode.toLowerCase()
            ).length;

            return (
              <button
                key={dept.id || dept.departmentCode}
                type="button"
                onClick={() => {
                  setSelectedDeptCode(dept.departmentCode);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-[#EAF7EF] border-[#168A45] shadow-xs ring-2 ring-[#168A45]/30'
                    : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isSelected
                        ? 'bg-[#168A45] text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {dept.departmentCode}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500">
                    {rolesCount} {rolesCount === 1 ? 'Role' : 'Roles'}
                  </span>
                </div>
                <div
                  className={`text-xs font-extrabold mt-1.5 truncate ${
                    isSelected ? 'text-[#0B5D2A]' : 'text-slate-800'
                  }`}
                  title={dept.departmentName}
                >
                  {dept.departmentName}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 2: SELECT ROLE ASSOCIATED WITH THIS DEPARTMENT */}
      <div className="bg-[#FAFDFB] border border-emerald-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-[#168A45]" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              2. Roles in {activeDepartment.departmentName} ({selectedDeptCode}):
            </span>
            <span className="text-xs font-bold text-[#168A45] bg-emerald-100/80 px-2 py-0.5 rounded-full">
              {departmentRoles.length} Associated Roles
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            Click any role to inspect or fine-tune its side menu permissions
          </span>
        </div>

        {departmentRoles.length === 0 ? (
          <div className="p-6 text-center bg-white rounded-xl border border-dashed border-slate-300 text-slate-500 text-xs">
            No specific roles defined under {activeDepartment.departmentName} yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {departmentRoles.map((role) => {
              const isSelected = role.id === selectedRoleId;
              const isSuper = role.accessLevel.includes('Super Admin');
              const isMgr = role.accessLevel.includes('Manager');
              const isView = role.accessLevel.includes('View Only');

              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-[#168A45] shadow-xs ring-2 ring-[#168A45]/30'
                      : 'bg-white/80 hover:bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-extrabold text-xs text-slate-900 leading-tight">
                        {role.roleTitle}
                      </div>
                      <div className="font-mono text-[9px] text-slate-400 mt-0.5">
                        {role.id}
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        isSuper
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : isMgr
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : isView
                          ? 'bg-slate-100 text-slate-700 border border-slate-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {role.accessLevel.split(' ')[0]}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                    <span className="truncate max-w-[180px]">
                      Reports to: {role.reportingTo}
                    </span>
                    <span className="font-bold text-slate-600 shrink-0">
                      {role.headcount || 1} Staff
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {viewMode === 'matrix' ? (
        /* DEPARTMENT CROSS-MATRIX OVERVIEW */
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#168A45]" />
                <span>Department Roles & Permissions Cross-Matrix</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Overview of all departmental roles and their configured system accessibility.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setViewMode('editor')}
              className="px-3 py-1.5 bg-[#168A45] text-white rounded-xl text-xs font-bold hover:bg-[#0B5D2A] transition-colors cursor-pointer"
            >
              Switch to Granular Editor
            </button>
          </div>

          <div className="space-y-4">
            {departments.map((dept) => {
              const deptRoles = allRoles.filter(
                (r) => r.departmentCode.toLowerCase() === dept.departmentCode.toLowerCase()
              );

              return (
                <div
                  key={dept.departmentCode}
                  className="border border-slate-200 rounded-xl overflow-hidden"
                >
                  <div className="bg-slate-50 px-4 py-2.5 flex items-center justify-between border-b border-slate-200">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold bg-white text-[#0B5D2A] px-2 py-0.5 rounded border border-slate-200">
                        {dept.departmentCode}
                      </span>
                      <span className="font-extrabold text-xs text-slate-900">
                        {dept.departmentName}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        • HOD: {dept.headOfDepartment || 'Unassigned'}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-600">
                      {deptRoles.length} Roles
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {deptRoles.map((r) => {
                      const perms = resolveRolePermissions(settings, dept.departmentCode, r);
                      let vCount = 0;
                      let eCount = 0;
                      let edCount = 0;
                      let dCount = 0;
                      Object.values(perms).forEach((p) => {
                        if (p.view) vCount++;
                        if (p.entry) eCount++;
                        if (p.edit) edCount++;
                        if (p.delete) dCount++;
                      });

                      return (
                        <div
                          key={r.id}
                          className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-2">
                              <span className="font-extrabold text-xs text-slate-900">
                                {r.roleTitle}
                              </span>
                              <span className="font-mono text-[9px] bg-slate-100 text-slate-500 px-1 rounded">
                                {r.id}
                              </span>
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                {r.accessLevel}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Reports to: {r.reportingTo} • Headcount: {r.headcount || 1}
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 shrink-0">
                            {/* Permission counters */}
                            <div className="flex items-center space-x-1.5 text-[11px]">
                              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                                {vCount} View
                              </span>
                              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-bold border border-blue-200">
                                {eCount} Entry
                              </span>
                              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200">
                                {edCount} Edit
                              </span>
                              <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 font-bold border border-rose-200">
                                {dCount} Del
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDeptCode(dept.departmentCode);
                                setSelectedRoleId(r.id);
                                setViewMode('editor');
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-[#168A45] border border-[#168A45] rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            >
                              Configure
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* GRANULAR SIDE MENU PERMISSIONS EDITOR */
        <div className="space-y-6">
          {/* ACTIVE ROLE SUMMARY BANNER */}
          {activeRole && (
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white border border-emerald-200/90 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#168A45] text-white">
                    {activeDepartment.departmentName} ({selectedDeptCode})
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-sm font-black text-slate-900">
                    {activeRole.roleTitle}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    {activeRole.id}
                  </span>
                </div>
                <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                  {activeRole.description}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500">
                  <span>Reporting: <strong>{activeRole.reportingTo}</strong></span>
                  <span>•</span>
                  <span>Access Level: <strong>{activeRole.accessLevel}</strong></span>
                </div>
              </div>

              {/* CLONE / COPY FROM ANOTHER ROLE TOOL */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-1.5 shrink-0 sm:w-72">
                <div className="flex items-center space-x-1.5 text-slate-700 text-xs font-bold">
                  <Copy className="w-3.5 h-3.5 text-[#168A45]" />
                  <span>Clone Permissions From:</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <select
                    value={copySourceRoleId}
                    onChange={(e) => setCopySourceRoleId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-[#168A45]"
                  >
                    <option value="">Select source role...</option>
                    {allRoles
                      .filter((r) => r.id !== activeRole.id)
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.roleTitle} ({r.departmentName})
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleCopyFromRole}
                    disabled={!copySourceRoleId}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STATS OVERVIEW CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 shadow-2xs">
              <div className="text-[10px] font-bold uppercase text-slate-400">Total ERP Menus</div>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5">{metrics.total}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Full ERP side navigation</div>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3 shadow-2xs">
              <div className="text-[10px] font-bold uppercase text-[#0B5D2A]">View Allowed</div>
              <div className="text-xl font-extrabold text-[#0B5D2A] mt-0.5">{metrics.viewCount}</div>
              <div className="text-[10px] text-emerald-700 mt-0.5">Visible in side menu</div>
            </div>

            <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-3 shadow-2xs">
              <div className="text-[10px] font-bold uppercase text-blue-800">Full (All 4)</div>
              <div className="text-xl font-extrabold text-blue-900 mt-0.5">{metrics.fullCount}</div>
              <div className="text-[10px] text-blue-700 mt-0.5">View + Entry + Edit + Del</div>
            </div>

            <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3 shadow-2xs">
              <div className="text-[10px] font-bold uppercase text-amber-800">Edit Enabled</div>
              <div className="text-xl font-extrabold text-amber-900 mt-0.5">{metrics.editCount}</div>
              <div className="text-[10px] text-amber-700 mt-0.5">Records updateable</div>
            </div>

            <div className="bg-rose-50/60 border border-rose-200/80 rounded-xl p-3 shadow-2xs">
              <div className="text-[10px] font-bold uppercase text-rose-800">Hidden / Revoked</div>
              <div className="text-xl font-extrabold text-rose-900 mt-0.5">{metrics.noAccessCount}</div>
              <div className="text-[10px] text-rose-700 mt-0.5">No access granted</div>
            </div>
          </div>

          {/* PRESETS QUICK-BAR */}
          <div className="bg-[#F7FAF8] border border-emerald-200/70 rounded-xl p-3.5 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-[#168A45]" />
                <span className="text-xs font-bold text-slate-800">
                  Apply Quick Permission Preset to {activeRole?.roleTitle}:
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                Instantly populate access flags aligned with institutional standards
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                    activePreset === preset.id
                      ? 'bg-white border-[#168A45] shadow-xs ring-1 ring-[#168A45]'
                      : 'bg-white/80 hover:bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[11px] text-slate-900 truncate">
                      {preset.name}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 shrink-0">
                      {preset.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 line-clamp-1 leading-snug">
                    {preset.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* FILTER & CATEGORY NAVIGATION BAR */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Category Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('All')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                    selectedCategory === 'All'
                      ? 'bg-[#168A45] text-white shadow-2xs font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Categories ({SIDE_MENU_DEFINITIONS.length})
                </button>
                {SIDE_MENU_CATEGORIES.map((cat) => {
                  const count = SIDE_MENU_DEFINITIONS.filter((item) => item.category === cat).length;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 flex items-center space-x-1.5 ${
                        selectedCategory === cat
                          ? 'bg-[#168A45] text-white shadow-2xs font-bold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span>{cat}</span>
                      <span
                        className={`text-[9px] px-1 rounded-full ${
                          selectedCategory === cat
                            ? 'bg-white/20 text-white font-bold'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search Box */}
              <div className="relative min-w-[240px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search side menus by name, path..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#F7FAF8] border border-slate-200 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Bulk Controls Bar */}
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center space-x-2 text-slate-600 text-[11px]">
                <span className="font-semibold text-slate-800">
                  {selectedCategory === 'All' ? 'All Modules' : selectedCategory}:
                </span>
                <span className="text-slate-400">({filteredItems.length} menus displayed)</span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">
                  Bulk Action for Category:
                </span>
                <button
                  type="button"
                  onClick={() => handleCategoryFullAccess(selectedCategory)}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-[11px] font-bold transition-colors cursor-pointer"
                >
                  Full Access
                </button>
                <button
                  type="button"
                  onClick={() => handleCategoryViewOnly(selectedCategory)}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-md text-[11px] font-bold transition-colors cursor-pointer"
                >
                  View Only
                </button>
                <button
                  type="button"
                  onClick={() => handleCategoryRevokeAll(selectedCategory)}
                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-md text-[11px] font-bold transition-colors cursor-pointer"
                >
                  Revoke Category
                </button>
              </div>
            </div>
          </div>

          {/* SIDE MENU PERMISSIONS TABLE */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-700 font-extrabold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4 w-[40%]">Side Menu Item & Route</th>
                    <th className="py-3 px-3 text-center w-[12%]">
                      <div className="inline-flex items-center justify-center space-x-1 text-slate-800">
                        <Eye className="w-3.5 h-3.5 text-[#168A45]" />
                        <span>View</span>
                      </div>
                    </th>
                    <th className="py-3 px-3 text-center w-[12%]">
                      <div className="inline-flex items-center justify-center space-x-1 text-slate-800">
                        <PlusSquare className="w-3.5 h-3.5 text-blue-600" />
                        <span>Entry</span>
                      </div>
                    </th>
                    <th className="py-3 px-3 text-center w-[12%]">
                      <div className="inline-flex items-center justify-center space-x-1 text-slate-800">
                        <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                        <span>Edit</span>
                      </div>
                    </th>
                    <th className="py-3 px-3 text-center w-[12%]">
                      <div className="inline-flex items-center justify-center space-x-1 text-slate-800">
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Delete</span>
                      </div>
                    </th>
                    <th className="py-3 px-3 text-right w-[12%] pr-4">Quick Sets</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <AlertCircle className="w-7 h-7 mx-auto text-slate-300 mb-2" />
                        <span>No side menu items found matching "{searchQuery}"</span>
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const perm = currentPermissions[item.id] || {
                        view: false,
                        entry: false,
                        edit: false,
                        delete: false,
                      };

                      const isFull = perm.view && perm.entry && perm.edit && perm.delete;
                      const isNone = !perm.view && !perm.entry && !perm.edit && !perm.delete;

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50/70 transition-colors ${
                            isNone ? 'opacity-60 bg-slate-50/30' : ''
                          }`}
                        >
                          {/* Side Menu Details */}
                          <td className="py-3 px-4">
                            <div className="space-y-0.5">
                              <div className="flex items-center space-x-2">
                                <span className="font-extrabold text-slate-900 text-xs">
                                  {item.name}
                                </span>
                                <span className="font-mono text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded border border-slate-200">
                                  {item.id}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center space-x-1.5">
                                <span className="text-[10px] font-bold text-[#168A45] bg-emerald-50 px-1.5 py-0.2 rounded">
                                  {item.category}
                                </span>
                                <span className="truncate max-w-[340px] text-slate-400">
                                  • {item.description}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 1. VIEW CHECKBOX */}
                          <td className="py-3 px-3 text-center">
                            <label className="inline-flex items-center justify-center cursor-pointer p-1 rounded hover:bg-slate-100 transition-colors">
                              <input
                                type="checkbox"
                                checked={perm.view}
                                onChange={() => handleToggle(item.id, 'view')}
                                className="w-4 h-4 rounded text-[#168A45] border-slate-300 focus:ring-[#168A45] accent-[#168A45] cursor-pointer"
                              />
                            </label>
                          </td>

                          {/* 2. ENTRY CHECKBOX */}
                          <td className="py-3 px-3 text-center">
                            <label className="inline-flex items-center justify-center cursor-pointer p-1 rounded hover:bg-slate-100 transition-colors">
                              <input
                                type="checkbox"
                                checked={perm.entry}
                                onChange={() => handleToggle(item.id, 'entry')}
                                className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                              />
                            </label>
                          </td>

                          {/* 3. EDIT CHECKBOX */}
                          <td className="py-3 px-3 text-center">
                            <label className="inline-flex items-center justify-center cursor-pointer p-1 rounded hover:bg-slate-100 transition-colors">
                              <input
                                type="checkbox"
                                checked={perm.edit}
                                onChange={() => handleToggle(item.id, 'edit')}
                                className="w-4 h-4 rounded text-amber-600 border-slate-300 focus:ring-amber-500 accent-amber-600 cursor-pointer"
                              />
                            </label>
                          </td>

                          {/* 4. DELETE CHECKBOX */}
                          <td className="py-3 px-3 text-center">
                            <label className="inline-flex items-center justify-center cursor-pointer p-1 rounded hover:bg-slate-100 transition-colors">
                              <input
                                type="checkbox"
                                checked={perm.delete}
                                onChange={() => handleToggle(item.id, 'delete')}
                                className="w-4 h-4 rounded text-rose-600 border-slate-300 focus:ring-rose-500 accent-rose-600 cursor-pointer"
                              />
                            </label>
                          </td>

                          {/* Quick Sets per Row */}
                          <td className="py-3 px-3 text-right pr-4">
                            <div className="inline-flex items-center space-x-1">
                              <button
                                type="button"
                                onClick={() => handleSetRowFull(item.id)}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer border ${
                                  isFull
                                    ? 'bg-[#168A45] text-white border-[#168A45]'
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                                title="Full View + Entry + Edit + Delete"
                              >
                                Full
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetRowReadWrite(item.id)}
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
                                title="View, Entry, and Edit (No Delete)"
                              >
                                RW
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetRowViewOnly(item.id)}
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
                                title="View Only"
                              >
                                View
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetRowNone(item.id)}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer border ${
                                  isNone
                                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-400 border-slate-200'
                                }`}
                                title="Revoke all access"
                              >
                                None
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* FOOTER BAR */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2 text-slate-600">
                <span className="font-bold text-slate-800">
                  Showing {filteredItems.length} of {SIDE_MENU_DEFINITIONS.length} menus.
                </span>
                <span className="text-[11px] text-slate-400">
                  Mapped to {activeDepartment.departmentName} &gt; {activeRole?.roleTitle} in hrStorage.
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-extrabold transition-all shadow-xs cursor-pointer active:scale-98"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Permissions for {activeRole?.roleTitle}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
