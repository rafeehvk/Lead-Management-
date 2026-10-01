import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sliders,
  Search,
  RefreshCw,
  Plus,
  PlayCircle,
  Clock,
  Building2,
  Sparkles,
  Info,
  Check,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import {
  budgetValidationService,
  DepartmentBudgetPolicy,
  DepartmentEnforcementLevel,
  BudgetValidationResult,
  BudgetValidationAuditRecord,
} from '../../../services/finance/budgetValidationService';
import { budgetEngine } from '../../../services/finance/budgetEngine';

const formatINR = (val: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);

export const DepartmentBudgetControlPanel: React.FC = () => {
  const [policies, setPolicies] = useState<DepartmentBudgetPolicy[]>(() =>
    budgetValidationService.getDepartmentPolicies()
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<'All' | DepartmentEnforcementLevel>('All');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // New Department Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptLevel, setNewDeptLevel] = useState<DepartmentEnforcementLevel>('Warning');
  const [newDeptApprover, setNewDeptApprover] = useState('Finance Controller');
  const [newDeptTolerance, setNewDeptTolerance] = useState(0);
  const [newDeptDesc, setNewDeptDesc] = useState('');

  // Interactive Live Simulator State
  const [simDept, setSimDept] = useState('Operations');
  const [simModule, setSimModule] = useState<'PurchaseOrder' | 'DirectExpense'>('PurchaseOrder');
  const [simAmount, setSimAmount] = useState<number>(250000);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<BudgetValidationAuditRecord[]>(() =>
    budgetValidationService.getValidationAuditLogs()
  );

  const refreshData = () => {
    setPolicies(budgetValidationService.getDepartmentPolicies());
    setAuditLogs(budgetValidationService.getValidationAuditLogs());
  };

  const showToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3000);
  };

  // KPIs
  const stats = useMemo(() => {
    const total = policies.length;
    const blockCount = policies.filter((p) => p.isActive && p.enforcementLevel === 'Block').length;
    const warnCount = policies.filter((p) => p.isActive && p.enforcementLevel === 'Warning').length;
    const approvalCount = policies.filter((p) => p.isActive && p.enforcementLevel === 'Approval').length;
    return { total, blockCount, warnCount, approvalCount };
  }, [policies]);

  // Filtered Policies
  const filteredPolicies = useMemo(() => {
    return policies.filter((p) => {
      const matchSearch =
        p.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.designatedApprover.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchLevel = levelFilter === 'All' || p.enforcementLevel === levelFilter;
      return matchSearch && matchLevel;
    });
  }, [policies, searchQuery, levelFilter]);

  // Live Simulator Evaluation Result
  const simResult: BudgetValidationResult = useMemo(() => {
    return budgetValidationService.validateTransaction({
      module: simModule,
      department: simDept,
      amount: simAmount,
      referenceNumber: 'SIM-TEST-001',
    });
  }, [simModule, simDept, simAmount, policies]);

  // Update policy handler
  const handleUpdateLevel = (dept: string, level: DepartmentEnforcementLevel) => {
    budgetValidationService.setDepartmentPolicy(dept, { enforcementLevel: level });
    refreshData();
    showToast(`Updated ${dept} enforcement level to ${level}`);
  };

  const handleToggleActive = (dept: string, isActive: boolean) => {
    budgetValidationService.setDepartmentPolicy(dept, { isActive });
    refreshData();
    showToast(`${dept} policy is now ${isActive ? 'Active' : 'Paused'}`);
  };

  const handleUpdateTolerance = (dept: string, tolerancePercent: number) => {
    budgetValidationService.setDepartmentPolicy(dept, { tolerancePercent });
    refreshData();
  };

  const handleUpdateApprover = (dept: string, designatedApprover: string) => {
    budgetValidationService.setDepartmentPolicy(dept, { designatedApprover });
    refreshData();
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all department budget policies to standard defaults?')) {
      budgetValidationService.resetToDefaults();
      refreshData();
      showToast('Policies reset to defaults.');
    }
  };

  const handleAddPolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;

    budgetValidationService.setDepartmentPolicy(newDeptName.trim(), {
      enforcementLevel: newDeptLevel,
      designatedApprover: newDeptApprover,
      tolerancePercent: Number(newDeptTolerance) || 0,
      description: newDeptDesc || `Budget enforcement policy for ${newDeptName.trim()}`,
      isActive: true,
    });

    setIsAddModalOpen(false);
    setNewDeptName('');
    setNewDeptDesc('');
    refreshData();
    showToast(`Added validation policy for ${newDeptName}`);
  };

  // Get department budget preview
  const getDeptMetrics = (deptName: string) => {
    const budgets = budgetEngine.getBudgets().filter(
      (b) =>
        b.status === 'Active' &&
        (b.department.toLowerCase() === deptName.toLowerCase() ||
          deptName.toLowerCase().includes(b.department.toLowerCase()))
    );

    let total = 0;
    let committed = 0;
    let actual = 0;

    budgets.forEach((b) => {
      const m = budgetEngine.computeBudgetMetrics(b.id);
      total += m.totalBudget;
      committed += m.totalCommitted;
      actual += m.totalActual;
    });

    if (total === 0) {
      total = 3000000;
      committed = 800000;
      actual = 1100000;
    }

    const available = Math.max(0, total - committed - actual);
    const pct = total > 0 ? Math.min(100, Math.round(((committed + actual) / total) * 100)) : 0;

    return { total, committed, actual, available, pct };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 border border-slate-700 animate-in slide-in-from-bottom-3">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0B5D2A] to-[#124222] rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-emerald-100 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              Budget Validation & Control Engine
            </div>
            <h1 className="text-2xl font-black tracking-tight">Department Budget Enforcement Policies</h1>
            <p className="text-emerald-100/80 text-xs mt-1 max-w-2xl leading-relaxed">
              Live checks run automatically against <strong>Available Budget</strong> (Total Allocated &minus; Open PO Commitments &minus; Actual Spend) during Purchase Order creation and direct Expense posting.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2 bg-white text-[#0B5D2A] hover:bg-emerald-50 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Department Policy
            </button>
            <button
              onClick={handleResetDefaults}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Reset to default pre-configured policies"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Defaults
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
            <span className="text-[11px] text-emerald-200 font-medium uppercase block">Configured Departments</span>
            <span className="text-xl font-extrabold mt-0.5 block">{stats.total} Depts</span>
            <span className="text-[10px] text-emerald-200/70">Monitored in real-time</span>
          </div>

          <div className="bg-rose-500/20 border border-rose-400/30 rounded-xl p-3 backdrop-blur-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-rose-200 font-bold uppercase">Block (Hard Stop)</span>
              <XCircle className="w-3.5 h-3.5 text-rose-300" />
            </div>
            <span className="text-xl font-extrabold text-white mt-0.5 block">{stats.blockCount} Depts</span>
            <span className="text-[10px] text-rose-200/80">Strict zero-overrun cap</span>
          </div>

          <div className="bg-amber-500/20 border border-amber-400/30 rounded-xl p-3 backdrop-blur-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-amber-200 font-bold uppercase">Warning (Soft Cap)</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
            </div>
            <span className="text-xl font-extrabold text-white mt-0.5 block">{stats.warnCount} Depts</span>
            <span className="text-[10px] text-amber-200/80">Visual prompt to proceed</span>
          </div>

          <div className="bg-blue-500/20 border border-blue-400/30 rounded-xl p-3 backdrop-blur-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-blue-200 font-bold uppercase">Approval (CFO Escalation)</span>
              <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
            </div>
            <span className="text-xl font-extrabold text-white mt-0.5 block">{stats.approvalCount} Depts</span>
            <span className="text-[10px] text-blue-200/80">Routes to signoff queue</span>
          </div>
        </div>
      </div>

      {/* Grid: Left: Department Enforcement Matrix | Right: Live Validation Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLS: Department Configuration Matrix */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            {/* Filter & Search Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search department, approver..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#0B5D2A]"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                {(['All', 'Block', 'Warning', 'Approval'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setLevelFilter(lvl)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      levelFilter === lvl
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Department List */}
            <div className="space-y-3">
              {filteredPolicies.map((pol) => {
                const metrics = getDeptMetrics(pol.department);
                return (
                  <div
                    key={pol.id}
                    className={`p-4 rounded-xl border transition-all ${
                      pol.isActive
                        ? pol.enforcementLevel === 'Block'
                          ? 'border-rose-200 bg-rose-50/30'
                          : pol.enforcementLevel === 'Approval'
                          ? 'border-blue-200 bg-blue-50/30'
                          : 'border-amber-200 bg-amber-50/30'
                        : 'border-slate-200 bg-slate-50/50 opacity-60'
                    }`}
                  >
                    {/* Top Row: Name + Badges + Toggle */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                            pol.enforcementLevel === 'Block'
                              ? 'bg-rose-100 text-rose-700'
                              : pol.enforcementLevel === 'Approval'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">{pol.department}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                              {pol.id}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{pol.description}</p>
                        </div>
                      </div>

                      {/* Active Switch */}
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer self-start sm:self-center">
                        <input
                          type="checkbox"
                          checked={pol.isActive}
                          onChange={(e) => handleToggleActive(pol.department, e.target.checked)}
                          className="rounded text-[#0B5D2A] focus:ring-[#0B5D2A]"
                        />
                        <span>{pol.isActive ? 'Active' : 'Disabled'}</span>
                      </label>
                    </div>

                    {/* Middle Row: Live Budget Bar */}
                    <div className="mt-3.5 pt-3 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-medium text-slate-500 uppercase block">Total Budget</span>
                        <span className="font-bold text-slate-900">{formatINR(metrics.total)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-medium text-slate-500 uppercase block">
                          Committed &amp; Spent
                        </span>
                        <span className="font-medium text-slate-700">
                          {formatINR(metrics.committed + metrics.actual)}{' '}
                          <span className="text-[10px] text-slate-400">({metrics.pct}%)</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-emerald-700 uppercase block">
                          Available Headroom
                        </span>
                        <span className="font-extrabold text-emerald-700">{formatINR(metrics.available)}</span>
                      </div>
                    </div>

                    {/* Bottom Row: Enforcement Selector & Settings */}
                    <div className="mt-3 pt-3 border-t border-slate-200/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      {/* Segmented Enforcement Buttons */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-700 mr-1">Enforcement:</span>
                        <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleUpdateLevel(pol.department, 'Block')}
                            className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                              pol.enforcementLevel === 'Block'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-rose-600'
                            }`}
                          >
                            <XCircle className="w-3 h-3" />
                            Block
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateLevel(pol.department, 'Warning')}
                            className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                              pol.enforcementLevel === 'Warning'
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'text-slate-600 hover:text-amber-600'
                            }`}
                          >
                            <AlertTriangle className="w-3 h-3" />
                            Warning
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateLevel(pol.department, 'Approval')}
                            className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                              pol.enforcementLevel === 'Approval'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-blue-600'
                            }`}
                          >
                            <ShieldCheck className="w-3 h-3" />
                            Approval
                          </button>
                        </div>
                      </div>

                      {/* Approver & Buffer Controls */}
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 font-medium">Approver:</span>
                          <input
                            type="text"
                            value={pol.designatedApprover}
                            onChange={(e) => handleUpdateApprover(pol.department, e.target.value)}
                            className="px-2 py-1 border border-slate-300 rounded text-xs w-36 font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-[#0B5D2A]"
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 font-medium">Buffer:</span>
                          <select
                            value={pol.tolerancePercent}
                            onChange={(e) => handleUpdateTolerance(pol.department, Number(e.target.value))}
                            className="px-2 py-1 border border-slate-300 rounded text-xs font-bold text-slate-800 bg-white"
                          >
                            <option value={0}>0% (Strict)</option>
                            <option value={5}>+5%</option>
                            <option value={10}>+10%</option>
                            <option value={15}>+15%</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredPolicies.length === 0 && (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <SlidersHorizontal className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">No matching department policies found</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Try adjusting search query or level filters.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COL: Interactive Live Validation Simulator */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs sticky top-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-[#0B5D2A] flex items-center justify-center font-bold text-xs">
                <PlayCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Live Validation Sandbox</h3>
                <p className="text-[11px] text-slate-500">Test live check output against any department</p>
              </div>
            </div>

            <div className="space-y-3.5 mt-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Target Department:</label>
                <select
                  value={simDept}
                  onChange={(e) => setSimDept(e.target.value)}
                  className="w-full text-xs font-semibold rounded-lg border border-slate-300 p-2 bg-white"
                >
                  {policies.map((p) => (
                    <option key={p.id} value={p.department}>
                      {p.department} ({p.enforcementLevel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Transaction Type:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSimModule('PurchaseOrder')}
                    className={`py-1.5 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer text-center ${
                      simModule === 'PurchaseOrder'
                        ? 'bg-[#0B5D2A] text-white border-[#0B5D2A]'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Purchase Order
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimModule('DirectExpense')}
                    className={`py-1.5 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer text-center ${
                      simModule === 'DirectExpense'
                        ? 'bg-[#0B5D2A] text-white border-[#0B5D2A]'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Direct Expense
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Requested Amount (₹):</label>
                  <span className="text-xs font-mono font-bold text-slate-900">{formatINR(simAmount)}</span>
                </div>
                <input
                  type="range"
                  min={10000}
                  max={3000000}
                  step={25000}
                  value={simAmount}
                  onChange={(e) => setSimAmount(Number(e.target.value))}
                  className="w-full accent-[#0B5D2A]"
                />
                <div className="flex items-center gap-1.5 mt-1.5">
                  <input
                    type="number"
                    value={simAmount}
                    onChange={(e) => setSimAmount(Math.max(0, Number(e.target.value)))}
                    className="w-full text-xs font-mono font-bold rounded-lg border border-slate-300 p-2 focus:ring-1 focus:ring-[#0B5D2A]"
                  />
                </div>
              </div>

              {/* Dynamic Validation Result Card */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  simResult.status === 'BLOCKED'
                    ? 'bg-rose-50 border-rose-300 text-rose-900'
                    : simResult.status === 'NEEDS_APPROVAL'
                    ? 'bg-blue-50 border-blue-300 text-blue-900'
                    : simResult.status === 'WARNING'
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    {simResult.status === 'BLOCKED' ? (
                      <XCircle className="w-4 h-4 text-rose-600" />
                    ) : simResult.status === 'NEEDS_APPROVAL' ? (
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                    ) : simResult.status === 'WARNING' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                    <span>{simResult.title}</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white/80 border">
                    {simResult.status}
                  </span>
                </div>

                <p className="text-xs leading-relaxed opacity-90 mb-3">{simResult.message}</p>

                <div className="space-y-1.5 text-[11px] pt-2.5 border-t border-black/10">
                  <div className="flex justify-between">
                    <span className="opacity-75">Available Budget:</span>
                    <span className="font-mono font-bold">{formatINR(simResult.availableBudget)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-75">Requested Transaction:</span>
                    <span className="font-mono font-bold">{formatINR(simResult.requestedAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="opacity-75">Headroom Remaining After:</span>
                    <span
                      className={`font-mono ${
                        simResult.headroomAfter < 0 ? 'text-rose-600 font-extrabold' : 'text-emerald-700'
                      }`}
                    >
                      {formatINR(simResult.headroomAfter)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-75">Department Enforcement:</span>
                    <span className="font-bold">{simResult.enforcementLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-75">Workflow Verdict:</span>
                    <span className="font-bold">
                      {simResult.status === 'BLOCKED'
                        ? '❌ Hard Stop (Creation Prevented)'
                        : simResult.status === 'NEEDS_APPROVAL'
                        ? '⚠️ Approval Flagged (Pending Review)'
                        : '✅ Permitted to Save'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Policy Explanation Note */}
              <div className="p-3 bg-slate-50 rounded-lg text-[11px] text-slate-600 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <span>
                  <strong>Block:</strong> Rejects transaction at creation time.<br />
                  <strong>Warning:</strong> Shows an overrun notification but permits saving.<br />
                  <strong>Approval:</strong> Automatically flags PO / expense for CFO signoff.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Validation Audit History */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900">Recent Live Validation Checks &amp; Audit Trail</h3>
            <span className="text-xs px-2 py-0.5 bg-slate-100 rounded-full font-mono text-slate-600">
              {auditLogs.length} events
            </span>
          </div>
          {auditLogs.length > 0 && (
            <button
              onClick={() => {
                budgetValidationService.clearValidationAuditLogs();
                setAuditLogs([]);
              }}
              className="text-xs text-slate-500 hover:text-rose-600 font-medium transition-colors cursor-pointer"
            >
              Clear Log History
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Module</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Requested</th>
                <th className="py-2.5 px-3">Available</th>
                <th className="py-2.5 px-3">Enforcement</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Validation Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.slice(0, 15).map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80">
                  <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                    {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'Just now'}
                  </td>
                  <td className="py-2 px-3 font-semibold text-slate-800">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      {log.module === 'PurchaseOrder' ? 'PO' : 'Expense'}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-medium text-slate-900">{log.department}</td>
                  <td className="py-2 px-3 font-mono font-bold text-slate-900">
                    {formatINR(log.requestedAmount)}
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-600">
                    {formatINR(log.availableBudget)}
                  </td>
                  <td className="py-2 px-3 font-semibold text-slate-700">{log.enforcementLevel}</td>
                  <td className="py-2 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        log.status === 'BLOCKED'
                          ? 'bg-rose-100 text-rose-800'
                          : log.status === 'NEEDS_APPROVAL'
                          ? 'bg-blue-100 text-blue-800'
                          : log.status === 'WARNING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-600 max-w-xs truncate" title={log.message}>
                    {log.message}
                  </td>
                </tr>
              ))}
              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No budget validation events recorded yet. Run a simulator check or create a Purchase Order to view live telemetry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Department Policy Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-1">Add Department Budget Policy</h3>
            <p className="text-xs text-slate-500 mb-4">
              Configure live validation behavior for a new or unmonitored department.
            </p>

            <form onSubmit={handleAddPolicy} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Quality Assurance, Legal & Compliance"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-[#0B5D2A]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Enforcement Level *</label>
                <select
                  value={newDeptLevel}
                  onChange={(e) => setNewDeptLevel(e.target.value as DepartmentEnforcementLevel)}
                  className="w-full text-xs font-bold rounded-lg border border-slate-300 p-2.5 bg-white"
                >
                  <option value="Block">Block (Hard Stop - Prohibit overruns)</option>
                  <option value="Warning">Warning (Soft Stop - Alert creator)</option>
                  <option value="Approval">Approval (Escalate to CFO signoff)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Designated Approver</label>
                  <input
                    type="text"
                    value={newDeptApprover}
                    onChange={(e) => setNewDeptApprover(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tolerance Buffer (%)</label>
                  <select
                    value={newDeptTolerance}
                    onChange={(e) => setNewDeptTolerance(Number(e.target.value))}
                    className="w-full text-xs font-bold rounded-lg border border-slate-300 p-2.5 bg-white"
                  >
                    <option value={0}>0% (Strict)</option>
                    <option value={5}>+5% Buffer</option>
                    <option value={10}>+10% Buffer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Policy Scope &amp; Notes</label>
                <textarea
                  rows={2}
                  placeholder="Describe when exceptions are permitted..."
                  value={newDeptDesc}
                  onChange={(e) => setNewDeptDesc(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0B5D2A] hover:bg-[#084820] text-white text-xs font-bold rounded-lg transition-all shadow-sm cursor-pointer"
                >
                  Save Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
