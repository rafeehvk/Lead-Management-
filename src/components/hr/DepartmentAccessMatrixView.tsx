import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  Eye,
  Plus,
  Edit2,
  Trash2,
  Search,
  Check,
  X,
  RotateCcw,
  Building2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  Layers,
  LayoutDashboard,
  Sliders,
  Lock,
  Unlock,
  RefreshCw,
  SlidersHorizontal,
  TableProperties,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { DepartmentMaster } from '../../types/hr';
import { hrStorage } from '../../services/hrStorageService';
import {
  SIDE_MENU_DEFINITIONS,
  SIDE_MENU_CATEGORIES,
  MenuItemDefinition,
} from '../../utils/menuPermissions';

interface DepartmentAccessMatrixViewProps {
  onNavigateToStaff?: () => void;
}

// Preset definitions for 1-click department permission templates
const DEPARTMENT_PRESETS: Array<{
  id: string;
  name: string;
  description: string;
  menuIds: string[];
}> = [
  {
    id: 'super-admin',
    name: 'All Access (Super Admin)',
    description: 'Grant unrestricted access to all ERP modules and settings',
    menuIds: SIDE_MENU_DEFINITIONS.map((m) => m.id),
  },
  {
    id: 'academic',
    name: 'Academic Preset',
    description: 'Academic governance, faculty directory, attendance & student records',
    menuIds: [
      'dashboard',
      'hr-staff',
      'hr-attendance',
      'hr-kpi',
      'doc-dashboard',
      'doc-registry',
      'meet',
    ],
  },
  {
    id: 'admin',
    name: 'Administration Preset',
    description: 'General campus administration, staff management, documents and operations',
    menuIds: [
      'dashboard',
      'operations-dashboard',
      'hr-dashboard',
      'hr-staff',
      'hr-attendance',
      'hr-payroll',
      'hr-kpi',
      'doc-dashboard',
      'doc-registry',
      'doc-calendar',
      'doc-reminders',
      'asset-overview',
      'asset-register',
      'party-directory',
      'company',
    ],
  },
  {
    id: 'finance',
    name: 'Finance & Accounts Preset',
    description: 'General ledger, cash/bank, student fee collections, payroll and billing',
    menuIds: [
      'dashboard',
      'finance-dashboard',
      'finance-planner',
      'finance-gl',
      'finance-cash-bank',
      'finance-loans',
      'finance-payments',
      'finance-receipts',
      'hr-payroll',
      'sales-dashboard',
      'sales-invoice',
      'sales-receipts',
      'sales-reports',
      'sales-ar',
      'purchase-dashboard',
      'purchase-invoice',
      'purchase-payments',
      'purchase-reports',
      'party-directory',
      'party-ledger',
    ],
  },
  {
    id: 'hr',
    name: 'Human Resources Preset',
    description: 'Talent recruitment, employee master, attendance, payroll & reviews',
    menuIds: [
      'dashboard',
      'hr-dashboard',
      'hr-recruitment-positions',
      'hr-recruitment-applicants',
      'hr-recruitment-interviews',
      'hr-recruitment-offers',
      'hr-recruitment-appointments',
      'hr-staff',
      'hr-attendance',
      'hr-payroll',
      'hr-kpi',
      'hr-settings',
      'doc-dashboard',
      'doc-registry',
    ],
  },
  {
    id: 'sales',
    name: 'Sales & Marketing Preset',
    description: 'Lead generation pipeline, client proposals, sales orders and invoices',
    menuIds: [
      'dashboard',
      'lead-overview',
      'leads',
      'followups',
      'proposals',
      'meet',
      'gmail',
      'reports',
      'sales-dashboard',
      'sales-workflow',
      'sales-quotation',
      'sales-order',
      'sales-invoice',
      'sales-return-request',
      'sales-return',
      'sales-ar',
      'sales-receipts',
      'sales-reports',
      'party-directory',
      'party-ledger',
    ],
  },
  {
    id: 'operations',
    name: 'Campus Operations & Procurement',
    description: 'Warehouse inventory valuation, stock movements, vendor POs and material receiving',
    menuIds: [
      'dashboard',
      'operations-dashboard',
      'inventory-dashboard',
      'inventory-items',
      'inventory-valuation',
      'inventory-movements',
      'item-master',
      'purchase-dashboard',
      'purchase-workflow',
      'purchase-request',
      'purchase-quotation',
      'purchase-order',
      'goods-receipt',
      'purchase-invoice',
      'purchase-return',
      'party-directory',
    ],
  },
  {
    id: 'it',
    name: 'IT & Facilities Asset Preset',
    description: 'Fixed asset registers, hardware tracking, system integrations and settings',
    menuIds: [
      'dashboard',
      'asset-overview',
      'asset-register',
      'asset-requests',
      'asset-movements',
      'asset-maintenance',
      'asset-reports',
      'pricing',
      'company',
      'proposal',
      'users',
      'import',
      'integrations',
      'themes',
      'doc-dashboard',
      'doc-registry',
    ],
  },
];

export const DepartmentAccessMatrixView: React.FC<DepartmentAccessMatrixViewProps> = () => {
  const [departments, setDepartments] = useState<DepartmentMaster[]>(() =>
    hrStorage.getDepartmentsMaster()
  );
  const [viewMode, setViewMode] = useState<'matrix' | 'department-detail' | 'preview' | 'create'>('matrix');
  const [selectedDeptId, setSelectedDeptId] = useState<string>(() => {
    const list = hrStorage.getDepartmentsMaster();
    return list[0]?.id || 'DEPT-101';
  });

  // Search & Filters for Matrix
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Add / Edit Department Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentMaster | null>(null);
  const [formDeptCode, setFormDeptCode] = useState('');
  const [formDeptName, setFormDeptName] = useState('');
  const [formReporting, setFormReporting] = useState('');
  const [formHod, setFormHod] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formAllowedMenus, setFormAllowedMenus] = useState<string[]>([]);
  const [formError, setFormError] = useState('');
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Live Simulated Department in App
  const [simulatedDept, setSimulatedDept] = useState<string>(() => {
    return localStorage.getItem('mysar_simulated_department') || 'All';
  });

  const notifyChanges = (msg: string) => {
    setFeedbackNotice(msg);
    window.dispatchEvent(new CustomEvent('mysar_department_permissions_changed'));
    setTimeout(() => setFeedbackNotice(null), 3000);
  };

  const refreshDepartments = () => {
    const fresh = hrStorage.getDepartmentsMaster();
    setDepartments(fresh);
  };

  // Group menus by category
  const menusByCategory = useMemo(() => {
    const map: Record<string, MenuItemDefinition[]> = {};
    SIDE_MENU_CATEGORIES.forEach((cat) => {
      map[cat] = [];
    });
    SIDE_MENU_DEFINITIONS.forEach((item) => {
      if (!map[item.category]) {
        map[item.category] = [];
      }
      map[item.category].push(item);
    });
    return map;
  }, []);

  // Filtered categories and items
  const filteredCategoryGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const result: Array<{ category: string; items: MenuItemDefinition[] }> = [];

    SIDE_MENU_CATEGORIES.forEach((cat) => {
      if (selectedCategory !== 'All' && selectedCategory !== cat) {
        return;
      }
      let items = menusByCategory[cat] || [];
      if (q) {
        items = items.filter(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            m.description.toLowerCase().includes(q) ||
            m.id.toLowerCase().includes(q) ||
            m.category.toLowerCase().includes(q)
        );
      }
      if (items.length > 0) {
        result.push({ category: cat, items });
      }
    });

    return result;
  }, [menusByCategory, searchQuery, selectedCategory]);

  const activeDepartment = useMemo(() => {
    return departments.find((d) => d.id === selectedDeptId) || departments[0];
  }, [departments, selectedDeptId]);

  // Toggle single menu for department in Matrix
  const handleToggleMenuForDept = (deptId: string, menuId: string) => {
    const dept = departments.find((d) => d.id === deptId);
    if (!dept) return;

    const currentAllowed = dept.allowedMenuIds || [];
    const isAllowed = currentAllowed.includes(menuId);
    const nextAllowed = isAllowed
      ? currentAllowed.filter((id) => id !== menuId)
      : [...currentAllowed, menuId];

    hrStorage.saveDepartment({
      ...dept,
      allowedMenuIds: nextAllowed,
    });

    refreshDepartments();
    notifyChanges(
      `Updated access for ${dept.departmentName}: ${menuId} is now ${isAllowed ? 'Disabled' : 'Enabled'}.`
    );
  };

  // Bulk category toggle for a department
  const handleToggleCategoryForDept = (deptId: string, category: string, enableAll: boolean) => {
    const dept = departments.find((d) => d.id === deptId);
    if (!dept) return;

    const catItems = menusByCategory[category] || [];
    const catItemIds = catItems.map((m) => m.id);
    const currentAllowed = dept.allowedMenuIds || [];

    let nextAllowed: string[];
    if (enableAll) {
      nextAllowed = Array.from(new Set([...currentAllowed, ...catItemIds]));
    } else {
      nextAllowed = currentAllowed.filter((id) => !catItemIds.includes(id));
    }

    hrStorage.saveDepartment({
      ...dept,
      allowedMenuIds: nextAllowed,
    });

    refreshDepartments();
    notifyChanges(
      `${enableAll ? 'Granted' : 'Revoked'} all ${category} menus for ${dept.departmentName}.`
    );
  };

  // Bulk department toggle (all on / all off)
  const handleToggleAllForDept = (deptId: string, enableAll: boolean) => {
    const dept = departments.find((d) => d.id === deptId);
    if (!dept) return;

    const nextAllowed = enableAll ? SIDE_MENU_DEFINITIONS.map((m) => m.id) : [];

    hrStorage.saveDepartment({
      ...dept,
      allowedMenuIds: nextAllowed,
    });

    refreshDepartments();
    notifyChanges(
      `${enableAll ? 'Granted full access' : 'Revoked all access'} for ${dept.departmentName}.`
    );
  };

  // Apply preset to a department
  const handleApplyPresetToDept = (deptId: string, presetMenuIds: string[], presetName: string) => {
    const dept = departments.find((d) => d.id === deptId);
    if (!dept) return;

    hrStorage.saveDepartment({
      ...dept,
      allowedMenuIds: presetMenuIds,
    });

    refreshDepartments();
    notifyChanges(`Applied "${presetName}" (${presetMenuIds.length} tabs) to ${dept.departmentName}.`);
  };

  // Handle department simulation in App
  const handleSetSimulatedDept = (deptCode: string) => {
    setSimulatedDept(deptCode);
    if (deptCode === 'All') {
      localStorage.removeItem('mysar_simulated_department');
    } else {
      localStorage.setItem('mysar_simulated_department', deptCode);
    }
    window.dispatchEvent(new CustomEvent('mysar_department_permissions_changed'));
    notifyChanges(
      deptCode === 'All'
        ? 'Preview mode cleared: Application now displaying all authorized modules.'
        : `Application navigation filtered to [${deptCode}] department visible modules.`
    );
  };

  // Open Create Section & Modal
  const handleOpenCreateSection = () => {
    setEditingDept(null);
    setFormDeptCode(`10${departments.length + 1}`);
    setFormDeptName('');
    setFormReporting('Muhammed Rafeeh (Managing Director)');
    setFormHod('');
    setFormDescription('');
    setFormAllowedMenus(['dashboard', 'hr-staff', 'hr-attendance']);
    setFormError('');
    setViewMode('create');
  };

  const handleOpenCreateModal = () => {
    handleOpenCreateSection();
  };

  // Open Edit Modal
  const handleOpenEditModal = (dept: DepartmentMaster) => {
    setEditingDept(dept);
    setFormDeptCode(dept.departmentCode);
    setFormDeptName(dept.departmentName);
    setFormReporting(dept.reporting);
    setFormHod(dept.headOfDepartment || '');
    setFormDescription(dept.description || '');
    setFormAllowedMenus(dept.allowedMenuIds || []);
    setFormError('');
    setViewMode('create');
  };

  // Save Department Form Modal / Section
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDeptCode.trim() || !formDeptName.trim() || !formReporting.trim()) {
      setFormError('Please fill all required fields: Code, Department Name, and Reporting Manager.');
      return;
    }

    const cleanCode = formDeptCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleanCode.length < 2) {
      setFormError('Department Code must be at least 2 characters (e.g. 101, 102, 108).');
      return;
    }

    if (!editingDept && departments.some((d) => d.departmentCode.toUpperCase() === cleanCode)) {
      setFormError(`Department Code "${cleanCode}" already exists.`);
      return;
    }

    const saved = hrStorage.saveDepartment({
      id: editingDept?.id,
      departmentCode: cleanCode,
      departmentName: formDeptName.trim(),
      reporting: formReporting.trim(),
      headOfDepartment: formHod.trim() || undefined,
      description: formDescription.trim() || undefined,
      allowedMenuIds: formAllowedMenus,
      status: 'Active',
    });

    refreshDepartments();
    setSelectedDeptId(saved.id);
    setIsModalOpen(false);
    setViewMode('matrix');
    notifyChanges(
      `Department "${saved.departmentName}" (${saved.departmentCode}) saved with ${saved.allowedMenuIds?.length || 0} authorized menu tabs.`
    );
  };

  const toggleCategoryCollapse = (cat: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-[#0B5D2A] to-[#168A45] p-5 rounded-2xl text-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="p-2.5 bg-white/10 backdrop-blur-xs rounded-xl shrink-0 mt-0.5">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg md:text-xl font-black tracking-tight text-white">
                Department Access Control Matrix
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white uppercase tracking-wider">
                HR Configuration
              </span>
            </div>
            <p className="text-emerald-100 text-xs mt-1 leading-relaxed max-w-3xl">
              Define institutional departments and link them to specific application menu tabs.
              Ensures that staff members only see authorized modules in the ERP sidebar based on their department.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            type="button"
            onClick={handleOpenCreateSection}
            className="px-3.5 py-2 bg-white hover:bg-emerald-50 text-[#0B5D2A] font-extrabold rounded-xl text-xs flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Department</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK TOAST NOTICE */}
      {feedbackNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#168A45] shrink-0" />
          <span>{feedbackNotice}</span>
        </div>
      )}

      {/* TOP CONTROLS & SUB-TABS */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* View Mode Switcher */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl w-fit text-xs font-bold">
          <button
            type="button"
            onClick={() => setViewMode('matrix')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
              viewMode === 'matrix'
                ? 'bg-white text-[#0B5D2A] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TableProperties className="w-3.5 h-3.5 text-[#168A45]" />
            <span>Full Matrix Grid</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('department-detail')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
              viewMode === 'department-detail'
                ? 'bg-white text-[#0B5D2A] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#168A45]" />
            <span>Department Detailed Config</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
              viewMode === 'preview'
                ? 'bg-white text-[#0B5D2A] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-[#168A45]" />
            <span>User Visibility Simulator</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateSection}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
              viewMode === 'create'
                ? 'bg-white text-[#0B5D2A] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-[#168A45]" />
            <span>+ Add New Department</span>
          </button>
        </div>

        {/* Live Simulator Department Dropdown */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-500 font-semibold flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5 text-[#168A45]" />
            <span>Simulate User Department:</span>
          </span>
          <select
            value={simulatedDept}
            onChange={(e) => handleSetSimulatedDept(e.target.value)}
            className="px-2.5 py-1.5 bg-[#F7FAF8] border border-emerald-300 text-emerald-900 font-bold rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          >
            <option value="All">All Modules Visible (Admin / Unrestricted)</option>
            {departments.map((d) => (
              <option key={d.id} value={d.departmentCode}>
                [{d.departmentCode}] {d.departmentName} ({d.allowedMenuIds?.length || 0} tabs)
              </option>
            ))}
          </select>
          {simulatedDept !== 'All' && (
            <button
              type="button"
              onClick={() => handleSetSimulatedDept('All')}
              className="text-[11px] text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: FULL ACCESS CONTROL MATRIX GRID */}
      {viewMode === 'matrix' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden space-y-4 p-4 sm:p-5">
          {/* Matrix Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search menu tabs by name, code, path..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#168A45]"
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

            <div className="flex items-center gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                <option value="All">All Categories ({SIDE_MENU_CATEGORIES.length})</option>
                {SIDE_MENU_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={refreshDepartments}
                className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                title="Reload departments"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Matrix Scrollable Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-3 font-extrabold text-slate-700 min-w-[260px] sticky left-0 bg-slate-50 z-10 shadow-r">
                    Application Menu Tab / Functional Area
                  </th>
                  {departments.map((dept) => {
                    const count = dept.allowedMenuIds?.length || 0;
                    const isAll = count >= SIDE_MENU_DEFINITIONS.length;

                    return (
                      <th
                        key={dept.id}
                        className="p-2.5 text-center min-w-[140px] border-l border-slate-200/80"
                      >
                        <div className="flex flex-col items-center space-y-1">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {dept.departmentCode}
                          </span>
                          <span className="font-bold text-slate-800 text-[11px] truncate max-w-[130px]" title={dept.departmentName}>
                            {dept.departmentName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {count} / {SIDE_MENU_DEFINITIONS.length} tabs
                          </span>

                          {/* Quick Bulk Actions for Column */}
                          <div className="flex items-center space-x-1 pt-1">
                            <button
                              type="button"
                              onClick={() => handleToggleAllForDept(dept.id, !isAll)}
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition-colors ${
                                isAll
                                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                              title={isAll ? 'Revoke all tabs' : 'Grant all tabs'}
                            >
                              {isAll ? 'None' : 'All'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(dept)}
                              className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded"
                              title="Edit department metadata"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredCategoryGroups.map(({ category, items }) => {
                  const isCollapsed = collapsedCategories[category];

                  return (
                    <React.Fragment key={category}>
                      {/* Category Header Row */}
                      <tr className="bg-slate-100/80 font-bold border-t border-b border-slate-200">
                        <td className="p-2.5 sticky left-0 bg-slate-100/95 z-10 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => toggleCategoryCollapse(category)}
                            className="flex items-center space-x-2 text-slate-800 text-xs hover:text-[#0B5D2A] cursor-pointer"
                          >
                            {isCollapsed ? (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                            ) : (
                              <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                            )}
                            <span className="uppercase text-[11px] tracking-wider">{category}</span>
                            <span className="text-[10px] text-slate-500 font-normal">
                              ({items.length} items)
                            </span>
                          </button>
                        </td>

                        {departments.map((dept) => {
                          const currentAllowed = dept.allowedMenuIds || [];
                          const inCategoryCount = items.filter((m) =>
                            currentAllowed.includes(m.id)
                          ).length;
                          const isCategoryFull =
                            items.length > 0 && inCategoryCount === items.length;

                          return (
                            <td
                              key={dept.id}
                              className="p-1.5 text-center border-l border-slate-200/80 text-[10px]"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleCategoryForDept(
                                    dept.id,
                                    category,
                                    !isCategoryFull
                                  )
                                }
                                className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                                  inCategoryCount > 0
                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                    : 'bg-slate-200/60 text-slate-600 hover:bg-slate-300'
                                }`}
                                title={`Toggle all ${category} for ${dept.departmentName}`}
                              >
                                {inCategoryCount} / {items.length}
                              </button>
                            </td>
                          );
                        })}
                      </tr>

                      {/* Items Rows */}
                      {!isCollapsed &&
                        items.map((menu) => (
                          <tr key={menu.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-2.5 sticky left-0 bg-white hover:bg-slate-50/80 z-10 border-r border-slate-100">
                              <div className="font-bold text-slate-800 text-xs">{menu.name}</div>
                              <div className="flex items-center space-x-1.5 mt-0.5">
                                <span className="font-mono text-[9px] text-slate-400 bg-slate-100 px-1 py-0.2 rounded">
                                  {menu.id}
                                </span>
                                <span className="text-[10px] text-slate-400 truncate max-w-xs">
                                  {menu.description}
                                </span>
                              </div>
                            </td>

                            {departments.map((dept) => {
                              const isChecked = (dept.allowedMenuIds || []).includes(menu.id);

                              return (
                                <td
                                  key={dept.id}
                                  className="p-2 text-center border-l border-slate-100 align-middle"
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleToggleMenuForDept(dept.id, menu.id)}
                                    className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer ${
                                      isChecked
                                        ? 'bg-[#168A45] hover:bg-[#0B5D2A] text-white shadow-2xs'
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600'
                                    }`}
                                    title={`${dept.departmentName}: ${menu.name} (${
                                      isChecked ? 'Allowed' : 'Revoked'
                                    })`}
                                  >
                                    {isChecked ? (
                                      <Check className="w-4 h-4 stroke-[2.5]" />
                                    ) : (
                                      <X className="w-3.5 h-3.5 opacity-40" />
                                    )}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: DEPARTMENT DETAILED CONFIG VIEW */}
      {viewMode === 'department-detail' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Department Selection Sidebar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                Institutional Departments ({departments.length})
              </h3>
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
              >
                + New
              </button>
            </div>

            <div className="space-y-2">
              {departments.map((dept) => {
                const count = dept.allowedMenuIds?.length || 0;
                const isSelected = dept.id === activeDepartment.id;

                return (
                  <div
                    key={dept.id}
                    onClick={() => setSelectedDeptId(dept.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#EAF7EF] border-[#168A45] shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono text-xs font-bold px-1.5 py-0.2 rounded bg-white text-emerald-800 border border-emerald-200">
                            {dept.departmentCode}
                          </span>
                          <span className="font-bold text-slate-900 text-xs">
                            {dept.departmentName}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                          Rep: {dept.reporting}
                        </p>
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#0B5D2A] border border-emerald-200 shrink-0">
                        {count} tabs
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-mono text-[10px]">
                        CB/{dept.departmentCode}/###
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditModal(dept);
                        }}
                        className="text-emerald-700 hover:underline font-bold flex items-center space-x-0.5"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Department Menu Configuration Panel */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
              {/* Department Header & Presets */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded border border-emerald-300">
                      {activeDepartment.departmentCode}
                    </span>
                    <h3 className="font-extrabold text-base text-slate-900">
                      {activeDepartment.departmentName}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Managing menu tabs visible to members of {activeDepartment.departmentName}.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleAllForDept(activeDepartment.id, true)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleAllForDept(activeDepartment.id, false)}
                    className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* 1-Click Presets */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Apply Fast Department Preset:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {DEPARTMENT_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() =>
                        handleApplyPresetToDept(activeDepartment.id, preset.menuIds, preset.name)
                      }
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 transition-colors cursor-pointer"
                      title={preset.description}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter menus for this department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#168A45]"
                />
              </div>

              {/* Categorized Menu Checklist */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {filteredCategoryGroups.map(({ category, items }) => {
                  const allowed = activeDepartment.allowedMenuIds || [];
                  const activeInCategory = items.filter((m) => allowed.includes(m.id)).length;
                  const isAll = items.length > 0 && activeInCategory === items.length;

                  return (
                    <div
                      key={category}
                      className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs"
                    >
                      <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-slate-800">{category}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              activeInCategory > 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {activeInCategory} / {items.length}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleToggleCategoryForDept(activeDepartment.id, category, !isAll)
                          }
                          className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                        >
                          {isAll ? 'Deselect Category' : 'Select All in Category'}
                        </button>
                      </div>

                      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {items.map((menu) => {
                          const isChecked = allowed.includes(menu.id);

                          return (
                            <label
                              key={menu.id}
                              className={`flex items-start space-x-2.5 p-2 rounded-xl border transition-all cursor-pointer ${
                                isChecked
                                  ? 'bg-[#EAF7EF]/60 border-[#168A45] shadow-2xs'
                                  : 'bg-white hover:bg-slate-50 border-slate-200'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleMenuForDept(activeDepartment.id, menu.id)}
                                className="mt-0.5 rounded text-[#168A45] focus:ring-[#168A45] w-4 h-4 cursor-pointer shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-slate-900 text-xs leading-tight">
                                  {menu.name}
                                </div>
                                <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                                  {menu.description}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: USER VISIBILITY SIMULATOR */}
      {viewMode === 'preview' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-5">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center space-x-2">
              <Eye className="w-4 h-4 text-[#168A45]" />
              <span>Department Visibility Simulator</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Select any department to preview the exact list of ERP navigation modules that will be visible to staff members assigned to that department.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {departments.map((dept) => (
              <button
                key={dept.id}
                type="button"
                onClick={() => setSelectedDeptId(dept.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  dept.id === activeDepartment.id
                    ? 'bg-[#168A45] text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{dept.departmentName}</span>
                <span className="text-[10px] opacity-75">
                  ({dept.allowedMenuIds?.length || 0})
                </span>
              </button>
            ))}
          </div>

          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                Authorized Modules for <strong>{activeDepartment.departmentName}</strong> ({activeDepartment.allowedMenuIds?.length || 0} active)
              </span>
              <button
                type="button"
                onClick={() => handleSetSimulatedDept(activeDepartment.departmentCode)}
                className="px-3 py-1 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Apply to Current App Session
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {SIDE_MENU_DEFINITIONS.filter((m) =>
                (activeDepartment.allowedMenuIds || []).includes(m.id)
              ).map((menu) => (
                <div
                  key={menu.id}
                  className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center space-x-2"
                >
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-slate-900 truncate">{menu.name}</div>
                    <div className="text-[10px] text-slate-400">{menu.category}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: DEDICATED ADD / EDIT DEPARTMENT FORM SECTION */}
      {viewMode === 'create' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden p-5 sm:p-6 space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-50 text-[#0B5D2A] rounded-xl border border-emerald-200">
                <Building2 className="w-5 h-5 text-[#168A45]" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  {editingDept ? `Edit Department: ${editingDept.departmentName}` : 'Add New Department & Define Menu Access'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Define departmental details, continuous sequence ID formatting, and select ERP modules accessible to department members.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setViewMode('matrix')}
                className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Back to Matrix
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveModal} className="space-y-4">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center space-x-2">
                <X className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1 text-xs">Department Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 101, 102, 108"
                  value={formDeptCode}
                  onChange={(e) => setFormDeptCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold uppercase focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-hidden"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Continuous ID Format: <b className="font-mono text-emerald-700">CB/{formDeptCode || '101'}/###</b>
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 text-xs">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Academic, Procurement, Quality"
                  value={formDeptName}
                  onChange={(e) => setFormDeptName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 text-xs">Reporting Manager *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Managing Director / Principal"
                  value={formReporting}
                  onChange={(e) => setFormReporting(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1 text-xs">Head of Department (HOD) <span className="text-slate-400 font-normal">(Optional)</span></label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Ramesh Nambiar"
                  value={formHod}
                  onChange={(e) => setFormHod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 text-xs">Department Scope & Remit <span className="text-slate-400 font-normal">(Optional)</span></label>
                <input
                  type="text"
                  placeholder="Operational responsibilities, duties..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Menu Selection Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="p-1.5 rounded-lg bg-[#0B5D2A] text-white">
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-900">
                      Select Menus Which Need to Access for this Department
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Choose application tabs visible to members of <b>{formDeptName || 'this department'}</b>.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-[#0B5D2A] border border-emerald-300">
                    {formAllowedMenus.length} of {SIDE_MENU_DEFINITIONS.length} Selected
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormAllowedMenus(SIDE_MENU_DEFINITIONS.map((m) => m.id))}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-bold rounded-lg border border-slate-300 cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormAllowedMenus([])}
                    className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 text-xs font-bold rounded-lg border border-slate-300 cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Presets */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Quick Department Templates:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {DEPARTMENT_PRESETS.map((p) => {
                    const isMatch = p.menuIds.length === formAllowedMenus.length && p.menuIds.every((id) => formAllowedMenus.includes(id));
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setFormAllowedMenus(p.menuIds)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          isMatch
                            ? 'bg-[#0B5D2A] text-white border-[#0B5D2A] shadow-xs'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                        title={p.description}
                      >
                        {p.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Categorized Checkbox List */}
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {SIDE_MENU_CATEGORIES.map((cat) => {
                  const items = menusByCategory[cat] || [];
                  const activeCount = items.filter((m) => formAllowedMenus.includes(m.id)).length;
                  const isAll = items.length > 0 && activeCount === items.length;

                  return (
                    <div key={cat} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                      <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-slate-800">{cat}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            activeCount > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {activeCount} / {items.length}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (isAll) {
                              const catIds = new Set(items.map((i) => i.id));
                              setFormAllowedMenus((prev) => prev.filter((id) => !catIds.has(id)));
                            } else {
                              const catIds = items.map((i) => i.id);
                              setFormAllowedMenus((prev) => Array.from(new Set([...prev, ...catIds])));
                            }
                          }}
                          className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                        >
                          {isAll ? 'Deselect Category' : 'Select Category'}
                        </button>
                      </div>

                      <div className="p-2.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {items.map((menu) => {
                          const isChecked = formAllowedMenus.includes(menu.id);
                          return (
                            <label
                              key={menu.id}
                              className={`flex items-start space-x-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                                isChecked
                                  ? 'bg-[#EAF7EF]/50 border-emerald-300 text-slate-900 shadow-2xs font-semibold'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  setFormAllowedMenus((prev) =>
                                    prev.includes(menu.id)
                                      ? prev.filter((id) => id !== menu.id)
                                      : [...prev, menu.id]
                                  );
                                }}
                                className="rounded text-[#168A45] focus:ring-[#168A45] w-4 h-4 mt-0.5 cursor-pointer shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="truncate font-bold text-xs">{menu.name}</div>
                                <div className="text-[10px] text-slate-400 line-clamp-1">{menu.description}</div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setViewMode('matrix')}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white font-extrabold rounded-xl text-xs shadow-xs cursor-pointer flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{editingDept ? 'Update Department & Permissions' : 'Save Department & Apply Permissions'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ADD / EDIT DEPARTMENT WITH MENU SELECTOR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-xs max-h-[92vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#0B5D2A] to-[#168A45] px-5 py-4 text-white flex items-center justify-between shrink-0 shadow-xs">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    {editingDept ? `Edit Department: ${editingDept.departmentName}` : 'Add New Department'}
                  </h3>
                  <p className="text-emerald-100 text-xs mt-0.5">
                    Define department code, reporting hierarchy, and select accessible ERP menus.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-white hover:bg-white/20 p-2 rounded-xl transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveModal} className="p-5 overflow-y-auto space-y-4">
              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Department Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 101, 102"
                    value={formDeptCode}
                    onChange={(e) => setFormDeptCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold uppercase focus:bg-white focus:border-emerald-600 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    ID Pattern: CB/{formDeptCode || '101'}/###
                  </span>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Department Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Academic, Administration"
                    value={formDeptName}
                    onChange={(e) => setFormDeptName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:bg-white focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Reporting Manager *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Managing Director / Principal"
                    value={formReporting}
                    onChange={(e) => setFormReporting(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:bg-white focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Head of Department (HOD)</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Ramesh Nambiar"
                    value={formHod}
                    onChange={(e) => setFormHod(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Department Scope</label>
                  <input
                    type="text"
                    placeholder="Operational remit and duties..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Accessible Menus Selector */}
              <div className="pt-2 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-xs text-slate-900">
                      Accessible Menu Tabs for Department:
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {formAllowedMenus.length} of {SIDE_MENU_DEFINITIONS.length} Selected
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFormAllowedMenus(SIDE_MENU_DEFINITIONS.map((m) => m.id))}
                      className="text-[10px] font-bold text-emerald-700 hover:underline"
                    >
                      Select All
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setFormAllowedMenus([])}
                      className="text-[10px] font-bold text-rose-600 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1">
                  {DEPARTMENT_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setFormAllowedMenus(p.menuIds)}
                      className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 rounded"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>

                {/* Scrollable Checkbox list */}
                <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-3">
                  {SIDE_MENU_CATEGORIES.map((cat) => {
                    const items = menusByCategory[cat] || [];
                    const activeCount = items.filter((m) => formAllowedMenus.includes(m.id)).length;

                    return (
                      <div key={cat} className="space-y-1.5">
                        <div className="flex items-center justify-between border-b border-slate-200/80 pb-1">
                          <span className="font-bold text-[11px] text-slate-800">{cat}</span>
                          <span className="text-[10px] text-slate-500">
                            {activeCount} / {items.length}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {items.map((menu) => {
                            const isChecked = formAllowedMenus.includes(menu.id);

                            return (
                              <label
                                key={menu.id}
                                className={`flex items-center space-x-2 p-1.5 rounded-lg border text-xs cursor-pointer ${
                                  isChecked
                                    ? 'bg-white border-[#168A45] text-slate-900 shadow-2xs font-semibold'
                                    : 'bg-white/60 border-slate-200 text-slate-600'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    setFormAllowedMenus((prev) =>
                                      prev.includes(menu.id)
                                        ? prev.filter((id) => id !== menu.id)
                                        : [...prev, menu.id]
                                    );
                                  }}
                                  className="rounded text-[#168A45] focus:ring-[#168A45] w-3.5 h-3.5 cursor-pointer"
                                />
                                <span className="truncate">{menu.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white font-extrabold rounded-xl text-xs shadow-xs cursor-pointer"
                >
                  {editingDept ? 'Update Department' : 'Save Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
