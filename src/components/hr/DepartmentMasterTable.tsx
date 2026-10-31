import React, { useState, useMemo } from 'react';
import {
  Building,
  Building2,
  Plus,
  Edit2,
  Trash2,
  ShieldCheck,
  Check,
  X,
  Search,
  CheckCircle2,
  Eye,
  Sliders,
  Layers,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  Users,
  Briefcase,
  TrendingUp,
  ShoppingBag,
  Boxes,
  Landmark,
  FileText,
  Laptop,
  Settings,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { DepartmentMaster, StaffMember } from '../../types/hr';
import { hrStorage } from '../../services/hrStorageService';
import {
  SIDE_MENU_DEFINITIONS,
  SIDE_MENU_CATEGORIES,
  MenuItemDefinition,
} from '../../utils/menuPermissions';

interface DepartmentMasterTableProps {
  onClose?: () => void;
  isModal?: boolean;
  onNavigateToStaff?: () => void;
  onNavigateToConfiguration?: () => void;
}

// Preset definitions for fast 1-click selection
const MENU_PRESETS: Array<{
  id: string;
  name: string;
  description: string;
  menuIds: string[];
}> = [
  {
    id: 'all',
    name: 'All Access (Super Admin)',
    description: 'Grant unrestricted access to all 42 ERP modules and settings',
    menuIds: SIDE_MENU_DEFINITIONS.map((m) => m.id),
  },
  {
    id: 'operations_core',
    name: 'Operations Core Preset',
    description: 'Operations governance, staff directory, attendance & project records',
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
    description: 'General company administration, staff management, documents and operations',
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
    description: 'General ledger, cash/bank, client collections, payroll and vendor billing',
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
    description: 'Talent recruitment, employee master, biometric attendance, payroll & reviews',
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
    name: 'Supply Chain & Procurement',
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

export const DepartmentMasterTable: React.FC<DepartmentMasterTableProps> = ({
  onClose,
  isModal = false,
  onNavigateToStaff,
  onNavigateToConfiguration,
}) => {
  const [departmentsList, setDepartmentsList] = useState<DepartmentMaster[]>(() =>
    hrStorage.getDepartmentsMaster()
  );
  const [staffList, setStaffList] = useState<StaffMember[]>(() => hrStorage.getStaff());

  // Form State
  const [editingDept, setEditingDept] = useState<DepartmentMaster | null>(null);
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptReporting, setNewDeptReporting] = useState('');
  const [newDeptHod, setNewDeptHod] = useState('');
  const [newDeptDescription, setNewDeptDescription] = useState('');
  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>([]);
  const [deptFormError, setDeptFormError] = useState('');
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Search & Filters inside Menu Selector
  const [menuSearch, setMenuSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [isMenuSelectorExpanded, setIsMenuSelectorExpanded] = useState<boolean>(true);

  // Quick Inspection Modal State
  const [inspectingDept, setInspectingDept] = useState<DepartmentMaster | null>(null);

  // Delete Confirmation Modal State (Accidental Deletion Prevention)
  const [deptToDelete, setDeptToDelete] = useState<DepartmentMaster | null>(null);
  const [reassignDeptCode, setReassignDeptCode] = useState<string>('');
  const [cannotDeleteNotice, setCannotDeleteNotice] = useState<string | null>(null);

  const refreshList = () => {
    setDepartmentsList(hrStorage.getDepartmentsMaster());
    setStaffList(hrStorage.getStaff());
  };

  React.useEffect(() => {
    const handleUpdate = () => {
      refreshList();
    };
    window.addEventListener('mysar_departments_updated', handleUpdate);
    window.addEventListener('mysar_department_permissions_changed', handleUpdate);
    window.addEventListener('mysar_hr_data_updated', handleUpdate);
    window.addEventListener('mysar_staff_updated', handleUpdate);
    return () => {
      window.removeEventListener('mysar_departments_updated', handleUpdate);
      window.removeEventListener('mysar_department_permissions_changed', handleUpdate);
      window.removeEventListener('mysar_hr_data_updated', handleUpdate);
      window.removeEventListener('mysar_staff_updated', handleUpdate);
    };
  }, []);

  const triggerFeedback = (msg: string) => {
    setFeedbackNotice(msg);
    setTimeout(() => setFeedbackNotice(null), 3500);
  };

  // Group menu definitions by category
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

  // Filtered menu definitions based on search and category filter
  const filteredCategoryGroups = useMemo(() => {
    const q = menuSearch.trim().toLowerCase();
    const result: Array<{ category: string; items: MenuItemDefinition[] }> = [];

    SIDE_MENU_CATEGORIES.forEach((cat) => {
      if (selectedCategoryFilter !== 'All' && selectedCategoryFilter !== cat) {
        return;
      }
      let items = menusByCategory[cat] || [];
      if (q) {
        items = items.filter(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            m.description.toLowerCase().includes(q) ||
            m.category.toLowerCase().includes(q)
        );
      }
      if (items.length > 0) {
        result.push({ category: cat, items });
      }
    });

    return result;
  }, [menusByCategory, menuSearch, selectedCategoryFilter]);

  // Handle Menu Toggles
  const handleToggleMenu = (menuId: string) => {
    setSelectedMenuIds((prev) =>
      prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId]
    );
  };

  const handleSelectAllCategory = (cat: string) => {
    const categoryMenuIds = (menusByCategory[cat] || []).map((m) => m.id);
    setSelectedMenuIds((prev) => Array.from(new Set([...prev, ...categoryMenuIds])));
  };

  const handleDeselectAllCategory = (cat: string) => {
    const categoryMenuIds = new Set((menusByCategory[cat] || []).map((m) => m.id));
    setSelectedMenuIds((prev) => prev.filter((id) => !categoryMenuIds.has(id)));
  };

  const handleApplyPreset = (menuIds: string[]) => {
    setSelectedMenuIds(menuIds);
  };

  const handleClearAllMenus = () => {
    setSelectedMenuIds([]);
  };

  const handleSelectAllMenus = () => {
    setSelectedMenuIds(SIDE_MENU_DEFINITIONS.map((m) => m.id));
  };

  // Editing Initialization
  const handleEditDeptInit = (dept: DepartmentMaster) => {
    setEditingDept(dept);
    setNewDeptCode(dept.departmentCode);
    setNewDeptName(dept.departmentName);
    setNewDeptReporting(dept.reporting);
    setNewDeptHod(dept.headOfDepartment || '');
    setNewDeptDescription(dept.description || '');
    setSelectedMenuIds(dept.allowedMenuIds && dept.allowedMenuIds.length > 0 ? dept.allowedMenuIds : []);
    setDeptFormError('');
    setIsMenuSelectorExpanded(true);
    // Smooth scroll to top of form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelDeptEdit = () => {
    setEditingDept(null);
    setNewDeptCode('');
    setNewDeptName('');
    setNewDeptReporting('');
    setNewDeptHod('');
    setNewDeptDescription('');
    setSelectedMenuIds([]);
    setDeptFormError('');
  };

  // Save Department Handler
  const handleSaveDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptCode.trim() || !newDeptName.trim() || !newDeptReporting.trim()) {
      setDeptFormError('Please fill all required fields: Department Code, Department Name, and Reporting.');
      return;
    }
    const cleanCode = newDeptCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleanCode.length < 2) {
      setDeptFormError('Department Code must be at least 2 characters (e.g. 101, 102, 103).');
      return;
    }

    if (editingDept) {
      hrStorage.saveDepartment({
        id: editingDept.id,
        departmentCode: cleanCode,
        departmentName: newDeptName.trim(),
        reporting: newDeptReporting.trim(),
        headOfDepartment: newDeptHod.trim() || undefined,
        description: newDeptDescription.trim() || undefined,
        allowedMenuIds: selectedMenuIds,
        status: 'Active',
      });
      refreshList();
      triggerFeedback(`Department "${newDeptName.trim()}" (${cleanCode}) updated successfully with ${selectedMenuIds.length} accessible menus.`);
      handleCancelDeptEdit();
    } else {
      if (departmentsList.some((d) => d.departmentCode.toUpperCase() === cleanCode)) {
        setDeptFormError(`Department Code "${cleanCode}" already exists in Master Table.`);
        return;
      }
      hrStorage.saveDepartment({
        departmentCode: cleanCode,
        departmentName: newDeptName.trim(),
        reporting: newDeptReporting.trim(),
        headOfDepartment: newDeptHod.trim() || undefined,
        description: newDeptDescription.trim() || undefined,
        allowedMenuIds: selectedMenuIds,
        status: 'Active',
      });
      refreshList();
      triggerFeedback(`New Department "${newDeptName.trim()}" (${cleanCode}) created with ${selectedMenuIds.length} accessible menus.`);
      handleCancelDeptEdit();
    }
  };

  // Delete Department Handler - In-App Confirmation Modal to Prevent Accidental Deletions
  const handleRequestDelete = (dept: DepartmentMaster) => {
    if (departmentsList.length <= 1) {
      setCannotDeleteNotice(
        'At least one department must remain in the Department Master Table to ensure organization operations and staff continuity.'
      );
      return;
    }
    const otherDepts = departmentsList.filter((d) => d.id !== dept.id);
    setReassignDeptCode(otherDepts[0]?.departmentCode || '');
    setDeptToDelete(dept);
  };

  const handleConfirmDeleteDepartment = () => {
    if (!deptToDelete) return;
    const deleted = hrStorage.deleteDepartment(deptToDelete.id, 'HR Admin', {
      forceDelete: true,
      reassignToDeptCode: reassignDeptCode || undefined,
    });
    refreshList();
    if (deleted) {
      triggerFeedback(`Department "${deptToDelete.departmentName}" (${deptToDelete.departmentCode}) was successfully removed from the master table.`);
    } else {
      triggerFeedback(`Department "${deptToDelete.departmentName}" status was updated.`);
    }
    setDeptToDelete(null);
  };

  // Check if duplicate department codes or duplicate names exist in the master list
  const hasDuplicateCodes = useMemo(() => {
    const codes = departmentsList.map((d) => d.departmentCode.toUpperCase());
    return new Set(codes).size < codes.length;
  }, [departmentsList]);

  const handleDeduplicate = () => {
    const removed = hrStorage.deduplicateDepartments('HR Admin');
    refreshList();
    triggerFeedback(`Successfully cleaned ${removed} duplicate department records from Master Table.`);
  };

  return (
    <div className={`space-y-6 ${isModal ? '' : 'animate-in fade-in duration-200'}`}>
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-[#0B5D2A] to-[#168A45] p-5 rounded-2xl text-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="p-2.5 bg-white/10 backdrop-blur-xs rounded-xl shrink-0 mt-0.5">
            <Building className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg md:text-xl font-black tracking-tight text-white">
                Department Master Table
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white uppercase tracking-wider">
                HR Configuration
              </span>
            </div>
            <p className="text-emerald-100 text-xs mt-1 leading-relaxed max-w-3xl">
              Configure company departments, code prefixes, reporting managers, and{' '}
              <b className="text-white underline decoration-emerald-300">
                select accessible ERP navigation menus
              </b>
              . Controls automatic ID generation:{' '}
              <span className="font-mono font-bold text-white bg-black/20 px-1.5 py-0.5 rounded">
                CB/[DeptCode]/[Continuous#]
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          {onNavigateToConfiguration && (
            <button
              type="button"
              onClick={onNavigateToConfiguration}
              className="px-3 py-1.5 bg-white/20 hover:bg-white text-white hover:text-[#0B5D2A] text-xs font-bold rounded-xl transition-all flex items-center space-x-1 cursor-pointer"
            >
              <span>Open in HR Configuration</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* FEEDBACK NOTICE */}
      {feedbackNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#168A45] shrink-0" />
          <span>{feedbackNotice}</span>
        </div>
      )}

      {/* SECTION 1: ADD / EDIT DEPARTMENT FORM */}
      <form
        onSubmit={handleSaveDepartment}
        className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-[#0B5D2A]">
              {editingDept ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </span>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                {editingDept
                  ? `Edit Department: ${editingDept.departmentName} (${editingDept.departmentCode})`
                  : 'Add New Department'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Assign department code, reporting manager, and determine which ERP menus members can access.
              </p>
            </div>
          </div>

          {editingDept && (
            <button
              type="button"
              onClick={handleCancelDeptEdit}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Cancel Edit
            </button>
          )}
        </div>

        {deptFormError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
            <X className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{deptFormError}</span>
          </div>
        )}

        {/* Basic Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-slate-700 font-bold text-xs mb-1">
              Department Code *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 101, 102, 103"
              value={newDeptCode}
              onChange={(e) => setNewDeptCode(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold uppercase focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-hidden transition-all"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Auto ID Format: <b className="font-mono text-emerald-700">CB/{newDeptCode || '101'}/###</b>
            </span>
          </div>

          <div>
            <label className="block text-slate-700 font-bold text-xs mb-1">
              Department Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Operations, Administration"
              value={newDeptName}
              onChange={(e) => setNewDeptName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-hidden transition-all"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Official company department title
            </span>
          </div>

          <div>
            <label className="block text-slate-700 font-bold text-xs mb-1">
              Reporting *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Managing Director / Operations Head"
              value={newDeptReporting}
              onChange={(e) => setNewDeptReporting(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-hidden transition-all"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Direct reporting manager designation
            </span>
          </div>
        </div>

        {/* Secondary Fields (HOD & Description) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div>
            <label className="block text-slate-700 font-bold text-xs mb-1">
              Head of Department (HOD) <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Ramesh Nambiar"
              value={newDeptHod}
              onChange={(e) => setNewDeptHod(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-slate-700 font-bold text-xs mb-1">
              Department Scope & Duties <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Project delivery, client operations, service quality and SLA management..."
              value={newDeptDescription}
              onChange={(e) => setNewDeptDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* SECTION: SELECT ACCESSIBLE MENUS FOR THIS DEPARTMENT */}
        <div className="pt-3 border-t border-slate-200">
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-4">
            {/* Header with live count & toggle collapse */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center space-x-2.5">
                <span className="p-2 rounded-xl bg-[#0B5D2A] text-white shadow-2xs">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-extrabold text-sm text-slate-900">
                      Accessible Menus & ERP Modules for Department
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-[#0B5D2A] border border-emerald-300">
                      {selectedMenuIds.length} of {SIDE_MENU_DEFINITIONS.length} Selected
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Select which navigation menus and functional areas staff in{' '}
                    <b>{newDeptName || 'this department'}</b> are authorized to access.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllMenus}
                  className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 border border-slate-300 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleClearAllMenus}
                  className="px-2.5 py-1.5 bg-white hover:bg-rose-50 border border-slate-300 hover:border-rose-300 text-slate-700 hover:text-rose-700 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Clear All
                </button>
                <button
                  type="button"
                  onClick={() => setIsMenuSelectorExpanded(!isMenuSelectorExpanded)}
                  className="px-2.5 py-1.5 bg-slate-200/80 hover:bg-slate-300 text-slate-700 text-[11px] font-bold rounded-lg flex items-center space-x-1 transition-colors cursor-pointer"
                >
                  <span>{isMenuSelectorExpanded ? 'Collapse' : 'Expand'}</span>
                  {isMenuSelectorExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Quick Presets Bar */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Quick Department Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {MENU_PRESETS.map((preset) => {
                  const isCurrentMatch =
                    preset.menuIds.length === selectedMenuIds.length &&
                    preset.menuIds.every((id) => selectedMenuIds.includes(id));

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset.menuIds)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                        isCurrentMatch
                          ? 'bg-[#0B5D2A] text-white border-[#0B5D2A] shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                      title={preset.description}
                    >
                      {preset.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Expandable Menu Selection Area */}
            {isMenuSelectorExpanded && (
              <div className="space-y-3 pt-2 border-t border-slate-200/80">
                {/* Search & Category Filter Pills */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filter menus by name or description (e.g. attendance, invoice, lead)..."
                      value={menuSearch}
                      onChange={(e) => setMenuSearch(e.target.value)}
                      className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                    />
                    {menuSearch && (
                      <button
                        type="button"
                        onClick={() => setMenuSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="All">All Categories ({SIDE_MENU_CATEGORIES.length})</option>
                    {SIDE_MENU_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Categorized Menu Checklist Cards */}
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {filteredCategoryGroups.map(({ category, items }) => {
                    const selectedInCategory = items.filter((m) =>
                      selectedMenuIds.includes(m.id)
                    ).length;
                    const isAllSelected =
                      items.length > 0 && selectedInCategory === items.length;

                    return (
                      <div
                        key={category}
                        className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs"
                      >
                        {/* Category Sub-header */}
                        <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-xs text-slate-800">{category}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                selectedInCategory > 0
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {selectedInCategory} / {items.length}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() =>
                                isAllSelected
                                  ? handleDeselectAllCategory(category)
                                  : handleSelectAllCategory(category)
                              }
                              className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
                            >
                              {isAllSelected ? 'Deselect Category' : 'Select All in Category'}
                            </button>
                          </div>
                        </div>

                        {/* Menus in Category */}
                        <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                          {items.map((menu) => {
                            const isChecked = selectedMenuIds.includes(menu.id);

                            return (
                              <label
                                key={menu.id}
                                className={`flex items-start space-x-2.5 p-2 rounded-xl border transition-all cursor-pointer ${
                                  isChecked
                                    ? 'bg-[#EAF7EF]/60 border-[#168A45] shadow-2xs ring-1 ring-emerald-500/20'
                                    : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleMenu(menu.id)}
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
            )}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-[11px] text-slate-500">
            <span>
              Configuring for: <b>{newDeptName || 'New Department'}</b> •{' '}
              <b className="text-emerald-700">{selectedMenuIds.length} menus enabled</b>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {editingDept && (
              <button
                type="button"
                onClick={handleCancelDeptEdit}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl font-extrabold text-xs shadow-xs transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{editingDept ? 'Update Department & Menus' : 'Save Department'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* SECTION 2: CONFIGURED MASTER DEPARTMENTS TABLE */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
              Configured Master Departments ({departmentsList.length})
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Continuous sequence format: <b className="text-emerald-800">CB / [Dept Code] / [Seq]</b>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {hasDuplicateCodes && (
              <button
                type="button"
                onClick={handleDeduplicate}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                title="Automatically clean and remove duplicate department rows"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                <span>Clean Duplicates</span>
              </button>
            )}

            {onNavigateToStaff && (
              <button
                type="button"
                onClick={onNavigateToStaff}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center space-x-1 cursor-pointer"
              >
                <span>View Staff Directory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-3.5 py-3">Code</th>
                  <th className="px-3.5 py-3">Department Name</th>
                  <th className="px-3.5 py-3">Reporting Line</th>
                  <th className="px-3.5 py-3">Staff</th>
                  <th className="px-3.5 py-3">Accessible ERP Menus</th>
                  <th className="px-3.5 py-3">ID Generation</th>
                  <th className="px-3.5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departmentsList.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 px-4 text-slate-500">
                      <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-700">No departments configured</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Use the form above to create your organization's departments and configure accessible menus.
                      </p>
                    </td>
                  </tr>
                )}
                {departmentsList.map((dept) => {
                  const activeStaffForDept = staffList.filter((s) => {
                    const isActive = s.employmentStatus === 'Active' || !s.employmentStatus;
                    if (!isActive) return false;
                    const sCode = (s.departmentCode || '').toUpperCase().trim();
                    const sName = (s.department || '').toLowerCase().trim();
                    const dCode = (dept.departmentCode || '').toUpperCase().trim();
                    const dName = (dept.departmentName || '').toLowerCase().trim();

                    if (sCode && sName) {
                      return sCode === dCode && sName === dName;
                    }
                    if (sCode && !sName) {
                      return sCode === dCode;
                    }
                    if (sName) {
                      return sName === dName;
                    }
                    return false;
                  });

                  const staffCount = activeStaffForDept.length;
                  const allowedCount = dept.allowedMenuIds?.length ?? 0;

                  return (
                    <tr key={dept.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Code */}
                      <td className="px-3.5 py-3">
                        <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-xs">
                          {dept.departmentCode}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="px-3.5 py-3">
                        <div className="font-bold text-slate-900 text-xs">{dept.departmentName}</div>
                        {dept.headOfDepartment && (
                          <div className="text-[10px] text-slate-500">
                            HOD: {dept.headOfDepartment}
                          </div>
                        )}
                      </td>

                      {/* Reporting */}
                      <td className="px-3.5 py-3 text-slate-600 font-medium">
                        {dept.reporting}
                      </td>

                      {/* Staff Count */}
                      <td className="px-3.5 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          staffCount > 0 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {staffCount} {staffCount === 1 ? 'member' : 'members'}
                        </span>
                      </td>

                      {/* Accessible Menus */}
                      <td className="px-3.5 py-3">
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => setInspectingDept(dept)}
                            className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 text-[#0B5D2A] text-xs font-bold transition-colors cursor-pointer"
                            title="Inspect & configure accessible menus"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{allowedCount} Menus</span>
                            <Eye className="w-3 h-3 text-emerald-600" />
                          </button>
                        </div>
                      </td>

                      {/* Continuous ID Format */}
                      <td className="px-3.5 py-3">
                        <span className="font-mono text-xs text-emerald-950 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-medium">
                          CB/{dept.departmentCode}/001, 002...
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-3.5 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            type="button"
                            onClick={() => handleEditDeptInit(dept)}
                            title="Edit Department & Menu Access"
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRequestDelete(dept)}
                            title="Delete Department"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span>
            Changes persist automatically into <b>HR Local Storage</b> and apply across staff onboarding and security profiles.
          </span>
          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-lg font-bold text-xs cursor-pointer self-end"
            >
              Done
            </button>
          )}
        </div>
      </div>

      {/* MODAL: VIEW / EDIT MENUS FOR A SPECIFIC DEPARTMENT */}
      {inspectingDept && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 bg-gradient-to-r from-[#0B5D2A] to-[#168A45] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-200" />
                <div>
                  <h3 className="font-extrabold text-base">
                    Accessible Menus: {inspectingDept.departmentName}
                  </h3>
                  <p className="text-emerald-100 text-xs">
                    Code: <b className="font-mono text-white">{inspectingDept.departmentCode}</b> •{' '}
                    Reporting: {inspectingDept.reporting}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingDept(null)}
                className="text-white hover:bg-white/20 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-800">
                  Authorized Modules ({inspectingDept.allowedMenuIds?.length || 0} Menus)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    handleEditDeptInit(inspectingDept);
                    setInspectingDept(null);
                  }}
                  className="px-3 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit in Master Form</span>
                </button>
              </div>

              {/* Tag Grid */}
              <div className="space-y-3">
                {SIDE_MENU_CATEGORIES.map((cat) => {
                  const catItems = (menusByCategory[cat] || []).filter((m) =>
                    inspectingDept.allowedMenuIds?.includes(m.id)
                  );
                  if (catItems.length === 0) return null;

                  return (
                    <div key={cat} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="font-bold text-slate-800 mb-2 flex items-center justify-between text-xs">
                        <span>{cat}</span>
                        <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                          {catItems.length} menus
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {catItems.map((m) => (
                          <span
                            key={m.id}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 text-[11px] font-semibold"
                          >
                            <Check className="w-3 h-3 text-[#168A45]" />
                            <span>{m.name}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setInspectingDept(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: IN-APP CONFIRMATION DIALOG TO PREVENT ACCIDENTAL DEPARTMENT DELETION */}
      {deptToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-rose-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-white/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-extrabold text-base">Confirm Department Deletion</h3>
              </div>
              <button
                type="button"
                onClick={() => setDeptToDelete(null)}
                className="text-white hover:bg-white/20 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-700">
              <p className="text-sm">
                Are you sure you want to delete the department{' '}
                <strong className="text-slate-900 font-bold font-mono">
                  [{deptToDelete.departmentCode}] {deptToDelete.departmentName}
                </strong>
                ?
              </p>

              {(() => {
                const assigned = staffList.filter((s) => {
                  const isActive = s.employmentStatus === 'Active' || !s.employmentStatus;
                  if (!isActive) return false;
                  const sCode = (s.departmentCode || '').toUpperCase().trim();
                  const sName = (s.department || '').toLowerCase().trim();
                  const dCode = (deptToDelete.departmentCode || '').toUpperCase().trim();
                  const dName = (deptToDelete.departmentName || '').toLowerCase().trim();
                  return (sCode && sCode === dCode) || (sName && sName === dName);
                });

                const otherDepts = departmentsList.filter((d) => d.id !== deptToDelete.id);

                return assigned.length > 0 ? (
                  <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl space-y-2 text-amber-950">
                    <div className="flex items-center space-x-1.5 font-bold text-amber-900 text-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>{assigned.length} Active Staff Assigned to this Department</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Staff members currently assigned:{' '}
                      <b>{assigned.map((s) => s.fullName).join(', ')}</b>.
                    </p>
                    {otherDepts.length > 0 && (
                      <div className="pt-1 space-y-1">
                        <label className="text-[11px] font-bold text-slate-800 block">
                          Reassign assigned staff to:
                        </label>
                        <select
                          value={reassignDeptCode}
                          onChange={(e) => setReassignDeptCode(e.target.value)}
                          className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white font-medium text-slate-800"
                        >
                          {otherDepts.map((d) => (
                            <option key={d.id} value={d.departmentCode}>
                              [{d.departmentCode}] {d.departmentName}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-xs">
                    <span>No active staff are currently assigned to this department. It can be safely removed.</span>
                  </div>
                );
              })()}

              <p className="text-[11px] text-slate-500">
                This action will permanently remove the department entry from the Master Table and update cloud sync.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setDeptToDelete(null)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteDepartment}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs flex items-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirm & Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CANNOT DELETE LAST REMAINING DEPARTMENT */}
      {cannotDeleteNotice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col p-5 space-y-4">
            <div className="flex items-center space-x-2.5 text-amber-700">
              <div className="p-2 bg-amber-100 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-amber-700" />
              </div>
              <h4 className="font-extrabold text-sm text-slate-900">Cannot Delete Department</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{cannotDeleteNotice}</p>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setCannotDeleteNotice(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
