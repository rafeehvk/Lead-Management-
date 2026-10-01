import React, { useState, useMemo } from 'react';
import {
  PieChart as PieChartIcon,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Plus,
  ArrowRight,
  ArrowLeftRight,
  History,
  ShieldAlert,
  Sliders,
  Bell,
  FileText,
  Download,
  Info,
  Layers,
  ChevronRight,
  DollarSign,
  Building,
  Briefcase,
  X,
  Play,
  RotateCcw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  BudgetMasterRecord,
  BudgetAllocationRecord,
  BudgetCommitmentRecord,
  BudgetTransferRecord,
  BudgetRevisionRecord,
  BudgetControlConfig,
  BudgetAlertThresholds,
  BudgetType,
  BudgetPeriod,
  BudgetStatus,
  BudgetControlRule,
} from '../../../types/finance';
import {
  budgetEngine,
  BudgetMetrics,
  DEFAULT_BUDGET_CONTROLS,
  DEFAULT_BUDGET_ALERTS,
} from '../../../services/finance/budgetEngine';
import { DepartmentBudgetControlPanel } from './DepartmentBudgetControlPanel';

export function BudgetManagementView() {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'masters' | 'commitments' | 'revisions-transfers' | 'validation-policies' | 'controls' | 'simulator' | 'reports'
  >('dashboard');

  const [reportSubTab, setReportSubTab] = useState<
    'summary' | 'vs-actual' | 'utilization' | 'variance' | 'commitments' | 'transfers' | 'revisions'
  >('summary');

  // Storage data
  const [budgets, setBudgets] = useState<BudgetMasterRecord[]>(() => budgetEngine.getBudgets());
  const [allocations, setAllocations] = useState<BudgetAllocationRecord[]>(() => budgetEngine.getAllocations());
  const [commitments, setCommitments] = useState<BudgetCommitmentRecord[]>(() => budgetEngine.getCommitments());
  const [revisions, setRevisions] = useState<BudgetRevisionRecord[]>(() => budgetEngine.getRevisions());
  const [transfers, setTransfers] = useState<BudgetTransferRecord[]>(() => budgetEngine.getTransfers());
  const [controls, setControls] = useState<BudgetControlConfig[]>(() => budgetEngine.getControls());
  const [alerts, setAlerts] = useState<BudgetAlertThresholds>(() => budgetEngine.getAlertSettings());

  // Modals
  const [isNewBudgetModalOpen, setIsNewBudgetModalOpen] = useState(false);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Forms
  const [newBudgetForm, setNewBudgetForm] = useState({
    budgetName: '',
    financialYear: '2026-2027',
    budgetPeriod: 'Annual' as BudgetPeriod,
    budgetType: 'Department' as BudgetType,
    branch: 'Kochi HQ',
    department: 'IT & Tech',
    project: 'Cloud Modernization',
    costCenter: 'CC-102 IT Infra',
    totalBudget: 1500000,
    description: '',
  });

  const [revisionForm, setRevisionForm] = useState({
    budgetId: budgets[0]?.id || '',
    newTotalAmount: 2000000,
    reason: '',
    requestedBy: 'Operations Manager',
    approvedBy: 'Finance Director',
  });

  const [transferForm, setTransferForm] = useState({
    sourceBudgetId: budgets[0]?.id || '',
    destinationBudgetId: budgets[1]?.id || '',
    amount: 100000,
    reason: '',
    requestedBy: 'Operations Officer',
    approvedBy: 'Finance Manager',
    overrideProtection: false,
  });

  // Simulator State
  const [simStep, setSimStep] = useState(0);

  const reloadData = () => {
    setBudgets([...budgetEngine.getBudgets()]);
    setAllocations([...budgetEngine.getAllocations()]);
    setCommitments([...budgetEngine.getCommitments()]);
    setRevisions([...budgetEngine.getRevisions()]);
    setTransfers([...budgetEngine.getTransfers()]);
    setControls([...budgetEngine.getControls()]);
    setAlerts({ ...budgetEngine.getAlertSettings() });
  };

  // Live Aggregate Metrics
  const aggregateMetrics: BudgetMetrics = useMemo(() => {
    return budgetEngine.computeBudgetMetrics();
  }, [budgets, commitments, revisions, transfers]);

  // Chart data for Department Allocations
  const departmentChartData = useMemo(() => {
    return budgets.map((b) => {
      const m = budgetEngine.computeBudgetMetrics(b.id);
      return {
        name: b.department,
        budget: b.revisedBudget || b.totalBudget,
        committed: m.totalCommitted,
        actual: m.totalActual,
        available: m.totalAvailable,
      };
    });
  }, [budgets, commitments]);

  // Chart data for Budget vs Committed vs Actual breakdown
  const budgetBreakdownData = useMemo(() => {
    return [
      { name: 'Committed (Open POs)', value: aggregateMetrics.totalCommitted, color: '#F59E0B' },
      { name: 'Actual (Billed/Paid)', value: aggregateMetrics.totalActual, color: '#10B981' },
      { name: 'Available (Remaining)', value: aggregateMetrics.totalAvailable, color: '#3B82F6' },
    ];
  }, [aggregateMetrics]);

  // Form Handlers
  const handleCreateBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBudgetForm.budgetName || !newBudgetForm.totalBudget) return;

    budgetEngine.saveBudget({
      budgetName: newBudgetForm.budgetName,
      financialYear: newBudgetForm.financialYear,
      budgetPeriod: newBudgetForm.budgetPeriod,
      budgetType: newBudgetForm.budgetType,
      branch: newBudgetForm.branch,
      department: newBudgetForm.department,
      project: newBudgetForm.project,
      costCenter: newBudgetForm.costCenter,
      totalBudget: Number(newBudgetForm.totalBudget),
      revisedBudget: Number(newBudgetForm.totalBudget),
      description: newBudgetForm.description,
      status: 'Active',
    });

    reloadData();
    setIsNewBudgetModalOpen(false);
  };

  const handleCreateRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionForm.budgetId || !revisionForm.newTotalAmount) return;

    const res = budgetEngine.createBudgetRevision({
      budgetId: revisionForm.budgetId,
      newTotalAmount: Number(revisionForm.newTotalAmount),
      reason: revisionForm.reason || 'Operational adjustment',
      requestedBy: revisionForm.requestedBy,
      approvedBy: revisionForm.approvedBy,
    });

    if (!res.success) {
      alert(res.error);
      return;
    }

    reloadData();
    setIsRevisionModalOpen(false);
  };

  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferForm.sourceBudgetId || !transferForm.destinationBudgetId || !transferForm.amount) return;

    const res = budgetEngine.createBudgetTransfer({
      sourceBudgetId: transferForm.sourceBudgetId,
      destinationBudgetId: transferForm.destinationBudgetId,
      amount: Number(transferForm.amount),
      reason: transferForm.reason || 'Department reallocation',
      requestedBy: transferForm.requestedBy,
      approvedBy: transferForm.approvedBy,
      overrideProtection: transferForm.overrideProtection,
    });

    if (!res.success) {
      alert(res.error);
      return;
    }

    reloadData();
    setIsTransferModalOpen(false);
  };

  // Worked Example Simulator Steps
  const SIMULATOR_STEPS = [
    {
      stepNumber: 1,
      title: 'Step 1: Budget Created',
      description: 'Initial budget approved for ₹10,00,000. No commitments or expenses exist yet.',
      budget: 1000000,
      committed: 0,
      actual: 0,
      available: 1000000,
      utilization: '0%',
      varianceNote: 'Variance meaningful only post-close.',
      explanation: 'Formula: Available = Budget − Committed − Actual = 10,00,000 − 0 − 0 = 10,00,000.',
    },
    {
      stepNumber: 2,
      title: 'Step 2: PO Approved (₹3,00,000)',
      description: 'Purchase Order #PO-2026-0048 approved with vendor for hardware procurement.',
      budget: 1000000,
      committed: 300000,
      actual: 0,
      available: 700000,
      utilization: '30%',
      varianceNote: 'Committed encumbers headroom immediately.',
      explanation: 'PO Approval moves ₹3,00,000 into Committed. Available drops to ₹7,00,000 (30% utilized).',
    },
    {
      stepNumber: 3,
      title: 'Step 3: Partial Invoice Received (₹1,00,000)',
      description: 'Vendor ships first milestone batch and submits invoice for ₹1,00,000 against the PO.',
      budget: 1000000,
      committed: 200000,
      actual: 100000,
      available: 700000,
      utilization: '30%',
      varianceNote: 'Release ties to specific invoiced line amount.',
      explanation: 'Committed decreases by ₹1,00,000 (now ₹2,00,000). Actual increases by ₹1,00,000. Available remains ₹7,00,000.',
    },
    {
      stepNumber: 4,
      title: 'Step 4: Final Invoice Received (₹2,20,000 with +₹20k Price Variance)',
      description: 'Final invoice received for ₹2,20,000 due to revised shipping tariff and customs duty.',
      budget: 1000000,
      committed: 0,
      actual: 320000,
      available: 680000,
      utilization: '32%',
      varianceNote: 'Price variance absorbed into Actual, reducing Available.',
      explanation: 'Remaining commitment (₹2,00,000) released to 0. Actual increases by ₹2,20,000 to ₹3,20,000. Available = 10,00,000 − 0 − 3,20,000 = 6,80,000.',
    },
    {
      stepNumber: 5,
      title: 'Step 5: Direct Expense Billed (₹50,000)',
      description: 'Direct electricity and urgent cabling repair submitted without prior PO encumbrance.',
      budget: 1000000,
      committed: 0,
      actual: 370000,
      available: 630000,
      utilization: '37%',
      varianceNote: 'Direct expenses bypass Committed stage completely.',
      explanation: 'Posts straight to Actual. Budget Control checks live Available (₹6,80,000 > ₹50,000) and approves. Available becomes ₹6,30,000.',
    },
    {
      stepNumber: 6,
      title: 'Step 6: Fiscal Period Close',
      description: 'Financial year ends. All commitments resolved. Post-close variance calculation locked.',
      budget: 1000000,
      committed: 0,
      actual: 370000,
      available: 630000,
      utilization: '37%',
      varianceNote: 'Post-close Variance = Budget − Actual = ₹6,30,000 favorable (under-spent).',
      explanation: 'Variance = 10,00,000 − 3,70,000 = ₹6,30,000. Final utilization rate was 37%.',
    },
  ];

  return (
    <div className="space-y-6" id="budget-management-view">
      {/* Executive Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-50 text-[#0B5D2A] rounded-lg">
                <BarChart3 className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Budgeting & Commitment Lifecycle
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-[#0B5D2A] rounded-full border border-emerald-200">
                FY 2026-27 Active
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Department, branch, project and cost-center budget allocations with PO encumbrance, revision history, non-destructive transfers, and live control enforcement.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="create-budget-master-btn"
              onClick={() => setIsNewBudgetModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-white bg-[#0B5D2A] hover:bg-[#094c22] rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              New Budget
            </button>
            <button
              id="create-revision-btn"
              onClick={() => setIsRevisionModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-xs"
            >
              <History className="w-4 h-4 text-blue-600" />
              Revise Budget
            </button>
            <button
              id="create-transfer-btn"
              onClick={() => setIsTransferModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-xs"
            >
              <ArrowLeftRight className="w-4 h-4 text-purple-600" />
              Transfer Funds
            </button>
            <button
              id="open-validation-policies-btn"
              onClick={() => setActiveTab('validation-policies')}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-xs"
            >
              <Sliders className="w-4 h-4 text-emerald-600" />
              Validation Policies
            </button>
          </div>
        </div>

        {/* 6 Core Budget Formula KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <p className="text-xs font-medium text-slate-500">Total Budget</p>
            <p className="text-lg font-extrabold text-slate-900 mt-1">
              ₹{aggregateMetrics.totalBudget.toLocaleString('en-IN')}
            </p>
            <span className="text-[11px] text-slate-500">Revised Approved Cap</span>
          </div>

          <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200/60">
            <p className="text-xs font-medium text-amber-800">Committed</p>
            <p className="text-lg font-extrabold text-amber-900 mt-1">
              ₹{aggregateMetrics.totalCommitted.toLocaleString('en-IN')}
            </p>
            <span className="text-[11px] text-amber-700 font-medium">Open POs un-invoiced</span>
          </div>

          <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200/60">
            <p className="text-xs font-medium text-[#0B5D2A]">Actual</p>
            <p className="text-lg font-extrabold text-[#0B5D2A] mt-1">
              ₹{aggregateMetrics.totalActual.toLocaleString('en-IN')}
            </p>
            <span className="text-[11px] text-emerald-700 font-medium">Invoiced & Direct Exp</span>
          </div>

          <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-200/60">
            <p className="text-xs font-medium text-blue-800">Available</p>
            <p className="text-lg font-extrabold text-blue-900 mt-1">
              ₹{aggregateMetrics.totalAvailable.toLocaleString('en-IN')}
            </p>
            <span className="text-[11px] text-blue-700 font-medium">Budget − Committed − Actual</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <p className="text-xs font-medium text-slate-500">Utilization</p>
            <p
              className={`text-lg font-extrabold mt-1 ${
                aggregateMetrics.utilizationRate > 90
                  ? 'text-rose-600'
                  : aggregateMetrics.utilizationRate >= 75
                  ? 'text-amber-600'
                  : 'text-emerald-700'
              }`}
            >
              {aggregateMetrics.utilizationRate}%
            </p>
            <span className="text-[11px] text-slate-500">(Committed+Actual)/Budget</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <p className="text-xs font-medium text-slate-500">Post-Close Variance</p>
            <p className="text-lg font-extrabold text-slate-900 mt-1">
              ₹{aggregateMetrics.variance.toLocaleString('en-IN')}
            </p>
            <span className="text-[11px] text-slate-500">Budget − Actual</span>
          </div>
        </div>
      </div>

      {/* Sub-Tabs Bar */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-3 gap-6 overflow-x-auto">
        <button
          id="tab-budget-dashboard"
          onClick={() => setActiveTab('dashboard')}
          className={`pb-3 text-sm font-semibold whitespace-nowrap transition-all relative ${
            activeTab === 'dashboard'
              ? 'text-[#0B5D2A] border-b-2 border-[#0B5D2A]'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span>Dashboard & Analytics</span>
          </div>
        </button>

        <button
          id="tab-budget-masters"
          onClick={() => setActiveTab('masters')}
          className={`pb-3 text-sm font-semibold whitespace-nowrap transition-all relative ${
            activeTab === 'masters'
              ? 'text-[#0B5D2A] border-b-2 border-[#0B5D2A]'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            <span>Budget Master & Allocations</span>
            <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-700 rounded-full font-bold">
              {budgets.length}
            </span>
          </div>
        </button>

        <button
          id="tab-budget-commitments"
          onClick={() => setActiveTab('commitments')}
          className={`pb-3 text-sm font-semibold whitespace-nowrap transition-all relative ${
            activeTab === 'commitments'
              ? 'text-[#0B5D2A] border-b-2 border-[#0B5D2A]'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            <span>Commitment Lifecycle</span>
            <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-900 rounded-full font-bold">
              PO Encumbrance
            </span>
          </div>
        </button>

        <button
          id="tab-budget-revisions"
          onClick={() => setActiveTab('revisions-transfers')}
          className={`pb-3 text-sm font-semibold whitespace-nowrap transition-all relative ${
            activeTab === 'revisions-transfers'
              ? 'text-[#0B5D2A] border-b-2 border-[#0B5D2A]'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <History className="w-4 h-4" />
            <span>Revisions & Transfers</span>
          </div>
        </button>

        <button
          id="tab-budget-validation-policies"
          onClick={() => setActiveTab('validation-policies')}
          className={`pb-3 text-sm font-semibold whitespace-nowrap transition-all relative ${
            activeTab === 'validation-policies'
              ? 'text-[#0B5D2A] border-b-2 border-[#0B5D2A]'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-600" />
            <span>Budget Validation &amp; Policies</span>
            <span className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-800 rounded-full font-bold">
              Live Check
            </span>
          </div>
        </button>

        <button
          id="tab-budget-controls"
          onClick={() => setActiveTab('controls')}
          className={`pb-3 text-sm font-semibold whitespace-nowrap transition-all relative ${
            activeTab === 'controls'
              ? 'text-[#0B5D2A] border-b-2 border-[#0B5D2A]'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            <span>Control Rules & Alerts</span>
          </div>
        </button>

        <button
          id="tab-budget-simulator"
          onClick={() => setActiveTab('simulator')}
          className={`pb-3 text-sm font-semibold whitespace-nowrap transition-all relative ${
            activeTab === 'simulator'
              ? 'text-[#0B5D2A] border-b-2 border-[#0B5D2A]'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-emerald-600" />
            <span>Worked Example Simulator</span>
          </div>
        </button>

        <button
          id="tab-budget-reports"
          onClick={() => setActiveTab('reports')}
          className={`pb-3 text-sm font-semibold whitespace-nowrap transition-all relative ${
            activeTab === 'reports'
              ? 'text-[#0B5D2A] border-b-2 border-[#0B5D2A]'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>7 Budget Reports</span>
          </div>
        </button>
      </div>

      {/* TAB 1: DASHBOARD & CHARTS */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bar Chart: Department Budget vs Actual vs Committed */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 mb-1">
                Departmental Budget vs Committed vs Actual
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Comparison of approved budgets against encumbered PO commitments and posted bills.
              </p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentChartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                    <YAxis
                      stroke="#64748B"
                      fontSize={11}
                      tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
                    />
                    <Tooltip
                      formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
                    />
                    <Legend />
                    <Bar dataKey="budget" name="Approved Budget" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="committed" name="Committed (PO)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="actual" name="Actual Spent" fill="#0B5D2A" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Breakdown Doughnut */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 mb-1">Fund Allocation Status</h2>
                <p className="text-xs text-slate-500 mb-2">
                  Total revised capacity: ₹{aggregateMetrics.totalBudget.toLocaleString('en-IN')}
                </p>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={budgetBreakdownData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {budgetBreakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => `₹${Number(value).toLocaleString('en-IN')}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
                {budgetBreakdownData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-600 font-medium">{item.name}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{item.value.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Department Budget Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {budgets.map((b) => {
              const m = budgetEngine.computeBudgetMetrics(b.id);
              return (
                <div
                  key={b.id}
                  className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-slate-500">{b.id}</span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        m.health === 'Critical' || m.health === 'OverBudget'
                          ? 'bg-rose-100 text-rose-800'
                          : m.health === 'Warning'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-[#0B5D2A]'
                      }`}
                    >
                      {m.utilizationRate}% Utilized
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 line-clamp-1">{b.budgetName}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{b.department} • {b.branch}</p>

                  <div className="mt-4 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Budget:</span>
                      <span className="font-mono font-semibold text-slate-900">
                        ₹{(b.revisedBudget || b.totalBudget).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Committed:</span>
                      <span className="font-mono font-semibold text-amber-700">
                        ₹{m.totalCommitted.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Actual:</span>
                      <span className="font-mono font-semibold text-emerald-700">
                        ₹{m.totalActual.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-100">
                      <span className="font-medium text-slate-700">Available:</span>
                      <span className="font-mono font-bold text-blue-700">
                        ₹{m.totalAvailable.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Utilization Progress Bar */}
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        m.utilizationRate > 90
                          ? 'bg-rose-500'
                          : m.utilizationRate >= 75
                          ? 'bg-amber-500'
                          : 'bg-[#0B5D2A]'
                      }`}
                      style={{ width: `${Math.min(100, m.utilizationRate)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: BUDGET MASTER & ALLOCATIONS */}
      {activeTab === 'masters' && (
        <div className="space-y-6">
          {/* Rollup Rule Callout */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-3">
            <Info className="w-5 h-5 text-[#0B5D2A] shrink-0 mt-0.5" />
            <div className="text-xs text-[#0B5D2A] space-y-1">
              <p className="font-bold">Rollup Matching Rule Enforcement:</p>
              <p>
                A transaction posts to the most specific matching budget (Department + Branch + Cost Center if it exists). Parent-level (Branch/Company) totals are aggregates of children, not independently tracked ceilings.
              </p>
            </div>
          </div>

          {/* Budget Master List */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Budget Masters Registry</h3>
                <p className="text-xs text-slate-500 mt-0.5">Primary approved allocation envelopes for the fiscal cycle.</p>
              </div>
              <button
                onClick={() => setIsNewBudgetModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0B5D2A] hover:bg-[#094c22] rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" /> Create Budget
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm" id="budget-masters-table">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 text-xs">
                  <tr>
                    <th className="px-4 py-3">Budget ID</th>
                    <th className="px-4 py-3">Budget Name</th>
                    <th className="px-4 py-3">Period / FY</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Branch / Department</th>
                    <th className="px-4 py-3">Cost Center</th>
                    <th className="px-4 py-3">Original Cap</th>
                    <th className="px-4 py-3">Revised Cap</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {budgets.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-mono font-bold text-xs text-slate-900">{b.id}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{b.budgetName}</div>
                        {b.description && <div className="text-xs text-slate-500 line-clamp-1">{b.description}</div>}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className="font-semibold">{b.financialYear}</span>
                        <div className="text-[11px] text-slate-500">{b.budgetPeriod}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">
                          {b.budgetType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="font-medium text-slate-900">{b.department}</div>
                        <div className="text-[11px] text-slate-500">{b.branch}</div>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-600">{b.costCenter}</td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold">
                        ₹{b.totalBudget.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-emerald-800">
                        ₹{(b.revisedBudget || b.totalBudget).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-[#0B5D2A]">
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Allocation Grid */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm">Category-Level Sub-Allocations</h3>
              <p className="text-xs text-slate-500 mt-0.5">Granular line-item budget envelopes per department.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm" id="budget-allocations-table">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 text-xs">
                  <tr>
                    <th className="px-4 py-3">Allocation ID</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Parent Budget</th>
                    <th className="px-4 py-3">Department / Branch</th>
                    <th className="px-4 py-3">Cost Center</th>
                    <th className="px-4 py-3">Budget Amount</th>
                    <th className="px-4 py-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {allocations.map((alc) => (
                    <tr key={alc.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{alc.id}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{alc.category}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{alc.budgetName}</td>
                      <td className="px-4 py-3 text-xs">
                        {alc.department} • {alc.branch}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{alc.costCenter}</td>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-slate-900">
                        ₹{alc.budgetAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{alc.remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COMMITMENT LIFECYCLE */}
      {activeTab === 'commitments' && (
        <div className="space-y-6">
          {/* Lifecycle Stages Flowchart */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-1">Commitment Lifecycle Architecture</h2>
            <p className="text-xs text-slate-500 mb-6">
              How Purchase Orders encumber budget, release upon invoice posting, and absorb final price variances.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <span className="font-mono text-xs font-bold text-amber-900 px-2 py-0.5 bg-amber-200/80 rounded-md">
                  Stage 1: PO Approved
                </span>
                <h4 className="font-bold text-sm text-slate-900 mt-2">Committed Encumbrance</h4>
                <p className="text-xs text-slate-600 mt-1">
                  <code>Committed += po.amount</code>
                </p>
                <p className="text-[11px] text-slate-500 mt-2">
                  Headroom reserved immediately. Available budget reduced before spending occurs.
                </p>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <span className="font-mono text-xs font-bold text-blue-900 px-2 py-0.5 bg-blue-200/80 rounded-md">
                  Stage 2: Partial Invoiced
                </span>
                <h4 className="font-bold text-sm text-slate-900 mt-2">Proportional Release</h4>
                <p className="text-xs text-slate-600 mt-1">
                  <code>Committed -= invoiced</code><br />
                  <code>Actual += invoiced</code>
                </p>
                <p className="text-[11px] text-slate-500 mt-2">
                  Available stays unchanged. Dollars transition cleanly from Committed to Actual.
                </p>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="font-mono text-xs font-bold text-[#0B5D2A] px-2 py-0.5 bg-emerald-200/80 rounded-md">
                  Stage 3: Fully Invoiced
                </span>
                <h4 className="font-bold text-sm text-slate-900 mt-2">Full Release & Variance</h4>
                <p className="text-xs text-slate-600 mt-1">
                  <code>Committed = 0</code><br />
                  <code>Actual += finalAmount</code>
                </p>
                <p className="text-[11px] text-slate-500 mt-2">
                  Any price variance (e.g. shipping, duty) flows straight into Actual, modifying Available.
                </p>
              </div>

              <div className="p-4 bg-slate-100 rounded-xl border border-slate-200">
                <span className="font-mono text-xs font-bold text-slate-800 px-2 py-0.5 bg-slate-200 rounded-md">
                  Stage 4: PO Cancelled
                </span>
                <h4 className="font-bold text-sm text-slate-900 mt-2">Commitment De-encumbered</h4>
                <p className="text-xs text-slate-600 mt-1">
                  <code>Committed -= unInvoiced</code>
                </p>
                <p className="text-[11px] text-slate-500 mt-2">
                  Only remaining un-invoiced commitment is released back to Available headroom.
                </p>
              </div>
            </div>
          </div>

          {/* Active Commitments Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm">Purchase Order Encumbrance Register</h3>
              <p className="text-xs text-slate-500 mt-0.5">Live tracking of PO commitments and their invoiced releases.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm" id="budget-commitments-table">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 text-xs">
                  <tr>
                    <th className="px-4 py-3">PO Number</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Vendor / Category</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Original PO Amount</th>
                    <th className="px-4 py-3">Released (Invoiced)</th>
                    <th className="px-4 py-3">Active Commitment</th>
                    <th className="px-4 py-3">Invoiced Actual</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {commitments.map((cmt) => (
                    <tr key={cmt.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-mono font-bold text-xs text-slate-900">
                        {cmt.poNumber}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 font-mono">{cmt.date}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{cmt.vendorName || 'Vendor'}</div>
                        <div className="text-xs text-slate-500">{cmt.categoryCode}</div>
                      </td>
                      <td className="px-4 py-3 text-xs">{cmt.department}</td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold">
                        ₹{cmt.originalAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-blue-700">
                        ₹{cmt.releasedAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-amber-700">
                        ₹{cmt.activeCommitment.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-emerald-700">
                        ₹{(cmt.invoicedActualAmount || cmt.releasedAmount).toLocaleString('en-IN')}
                        {cmt.varianceAmount && cmt.varianceAmount !== 0 ? (
                          <span className="text-[10px] text-amber-700 block">
                            (Var: +₹{cmt.varianceAmount.toLocaleString('en-IN')})
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                            cmt.status === 'Fully Released'
                              ? 'bg-emerald-100 text-[#0B5D2A]'
                              : cmt.status === 'Partially Released'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {cmt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: REVISIONS & TRANSFERS */}
      {activeTab === 'revisions-transfers' && (
        <div className="space-y-6">
          {/* Revisions Section */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Budget Revisions (Non-Destructive Audit Log)</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Revisions adjust the budget capacity without overwriting original amounts. Committed and Actual remain untouched.
                </p>
              </div>
              <button
                onClick={() => setIsRevisionModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" /> New Revision
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm" id="budget-revisions-table">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 text-xs">
                  <tr>
                    <th className="px-4 py-3">Revision ID</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Budget / Category</th>
                    <th className="px-4 py-3">Original Cap</th>
                    <th className="px-4 py-3">Revised Cap</th>
                    <th className="px-4 py-3">Delta Amount</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Approved By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {revisions.map((rev) => (
                    <tr key={rev.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-mono font-bold text-xs text-blue-900">{rev.id}</td>
                      <td className="px-4 py-3 text-xs text-slate-600 font-mono">{rev.date}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{rev.budgetName || rev.categoryName}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        ₹{rev.originalCap.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-slate-900">
                        ₹{rev.revisedCap.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-bold">
                        <span className={rev.revisionAmount >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                          {rev.revisionAmount >= 0 ? '+' : ''}₹{rev.revisionAmount.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{rev.reason}</td>
                      <td className="px-4 py-3 text-xs font-medium text-slate-900">{rev.approvedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Transfers Section */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Budget Inter-Department Transfers</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Transfers are protected: System blocks any transfer that drives the source budget's Available below zero.
                </p>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-lg"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" /> Transfer Funds
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm" id="budget-transfers-table">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 text-xs">
                  <tr>
                    <th className="px-4 py-3">Transfer #</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Source Budget</th>
                    <th className="px-4 py-3">Destination Budget</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Authorized By</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {transfers.map((trf) => (
                    <tr key={trf.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-mono font-bold text-xs text-purple-900">
                        {trf.transferNumber}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 font-mono">{trf.date}</td>
                      <td className="px-4 py-3 text-xs font-medium text-slate-900">
                        {trf.sourceCategoryName}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-emerald-900">
                        {trf.destinationCategoryName}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-purple-800">
                        ₹{trf.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{trf.reason}</td>
                      <td className="px-4 py-3 text-xs text-slate-800 font-medium">
                        {trf.approvedBy || trf.requestedBy}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-purple-100 text-purple-800">
                          {trf.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: BUDGET VALIDATION & ENFORCEMENT POLICIES */}
      {activeTab === 'validation-policies' && (
        <DepartmentBudgetControlPanel />
      )}

      {/* TAB 5: CONTROLS & ALERTS */}
      {activeTab === 'controls' && (
        <div className="space-y-6">
          {/* Controls Configuration */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#0B5D2A]" />
              Configurable Budget Control Policies
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Enforce transaction submission rules when requested amounts exceed remaining Available budget.
            </p>

            <div className="space-y-3">
              {controls.map((ctrl) => (
                <div
                  key={ctrl.id}
                  className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-500">{ctrl.id}</span>
                      <span className="text-xs font-bold text-slate-900 px-2 py-0.5 bg-slate-200 rounded">
                        {ctrl.module} Module
                      </span>
                      <span className="text-xs text-slate-700 font-medium">
                        Department: <strong>{ctrl.department}</strong>
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{ctrl.description}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-slate-600">Action:</span>
                    <select
                      value={ctrl.rule}
                      onChange={(e) => {
                        ctrl.rule = e.target.value as BudgetControlRule;
                        budgetEngine.updateControl(ctrl);
                        reloadData();
                      }}
                      className="text-xs font-bold rounded-lg border border-slate-300 px-3 py-1.5 bg-white"
                    >
                      <option value="Block">Block (Hard Stop)</option>
                      <option value="Warning">Warning (Prompt to Proceed)</option>
                      <option value="Approval">Approval (Escalate to CFO)</option>
                    </select>

                    <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ctrl.isActive}
                        onChange={(e) => {
                          ctrl.isActive = e.target.checked;
                          budgetEngine.updateControl(ctrl);
                          reloadData();
                        }}
                        className="rounded text-[#0B5D2A] focus:ring-[#0B5D2A]"
                      />
                      <span>Active</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alert Thresholds & Channels */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-600" />
              Budget Alert Thresholds & Delivery Channels
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Real-time notification dispatch when budget consumption approaches critical capacity.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-center">
                <span className="text-xs font-bold text-[#0B5D2A] block">Normal</span>
                <span className="text-lg font-mono font-extrabold text-[#0B5D2A]">
                  &lt; {alerts.normalBelow}%
                </span>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-center">
                <span className="text-xs font-bold text-amber-800 block">Warning</span>
                <span className="text-lg font-mono font-extrabold text-amber-800">
                  {alerts.warningAt}%
                </span>
              </div>
              <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-center">
                <span className="text-xs font-bold text-rose-800 block">Critical</span>
                <span className="text-lg font-mono font-extrabold text-rose-800">
                  {alerts.criticalAt}%
                </span>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-center">
                <span className="text-xs font-bold text-purple-800 block">Fully Utilized</span>
                <span className="text-lg font-mono font-extrabold text-purple-800">
                  {alerts.fullyUtilizedAt}%
                </span>
              </div>
              <div className="p-3 bg-red-100 rounded-lg border border-red-300 text-center">
                <span className="text-xs font-bold text-red-900 block">Over Budget</span>
                <span className="text-lg font-mono font-extrabold text-red-900">
                  &gt; {alerts.overBudgetAbove}%
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-800 block mb-3">Notification Channels:</span>
              <div className="flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alerts.channels.inApp}
                    onChange={(e) => {
                      const updated = { ...alerts, channels: { ...alerts.channels, inApp: e.target.checked } };
                      setAlerts(updated);
                      budgetEngine.persistAlerts(updated);
                    }}
                    className="rounded text-[#0B5D2A]"
                  />
                  <span>In-App Notification Bar</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alerts.channels.email}
                    onChange={(e) => {
                      const updated = { ...alerts, channels: { ...alerts.channels, email: e.target.checked } };
                      setAlerts(updated);
                      budgetEngine.persistAlerts(updated);
                    }}
                    className="rounded text-[#0B5D2A]"
                  />
                  <span>Email Alerts (Finance Head & Department Lead)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alerts.channels.sms}
                    onChange={(e) => {
                      const updated = { ...alerts, channels: { ...alerts.channels, sms: e.target.checked } };
                      setAlerts(updated);
                      budgetEngine.persistAlerts(updated);
                    }}
                    className="rounded text-[#0B5D2A]"
                  />
                  <span>SMS Critical Alerts</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alerts.channels.push}
                    onChange={(e) => {
                      const updated = { ...alerts, channels: { ...alerts.channels, push: e.target.checked } };
                      setAlerts(updated);
                      budgetEngine.persistAlerts(updated);
                    }}
                    className="rounded text-[#0B5D2A]"
                  />
                  <span>Mobile Push Alerts</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: WORKED EXAMPLE SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Play className="w-5 h-5 text-emerald-600" />
                  Interactive Worked Example Simulator
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Walk step-by-step through the exact financial lifecycle scenario to verify formula integrity.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSimStep(Math.max(0, simStep - 1))}
                  disabled={simStep === 0}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-40"
                >
                  Previous Step
                </button>
                <button
                  onClick={() => setSimStep(Math.min(SIMULATOR_STEPS.length - 1, simStep + 1))}
                  disabled={simStep === SIMULATOR_STEPS.length - 1}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-[#0B5D2A] text-white rounded-lg hover:bg-[#094c22] disabled:opacity-40 shadow-xs"
                >
                  Next Step
                </button>
                <button
                  onClick={() => setSimStep(0)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                  title="Reset Simulator"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Current Active Step Banner */}
            {(() => {
              const cur = SIMULATOR_STEPS[simStep];
              return (
                <div className="space-y-6">
                  <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0B5D2A] px-2.5 py-0.5 bg-emerald-100 rounded-md">
                        {cur.title}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        Step {cur.stepNumber} of {SIMULATOR_STEPS.length}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-slate-900 mt-2">{cur.description}</p>
                    <p className="text-xs text-slate-600 mt-1 font-mono bg-white p-2.5 rounded-lg border border-slate-200">
                      {cur.explanation}
                    </p>

                    {/* Step Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
                      <div className="p-3 bg-white rounded-lg border border-slate-200">
                        <span className="text-[11px] text-slate-500 block">Budget</span>
                        <span className="text-base font-mono font-bold text-slate-900">
                          ₹{cur.budget.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="p-3 bg-amber-50/70 rounded-lg border border-amber-200">
                        <span className="text-[11px] text-amber-800 block">Committed</span>
                        <span className="text-base font-mono font-bold text-amber-900">
                          ₹{cur.committed.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="p-3 bg-emerald-50/70 rounded-lg border border-emerald-200">
                        <span className="text-[11px] text-[#0B5D2A] block">Actual</span>
                        <span className="text-base font-mono font-bold text-[#0B5D2A]">
                          ₹{cur.actual.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-200">
                        <span className="text-[11px] text-blue-800 block">Available</span>
                        <span className="text-base font-mono font-bold text-blue-900">
                          ₹{cur.available.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="p-3 bg-white rounded-lg border border-slate-200">
                        <span className="text-[11px] text-slate-500 block">Utilization</span>
                        <span className="text-base font-mono font-bold text-slate-900">
                          {cur.utilization}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-slate-500 italic">
                      Note: {cur.varianceNote}
                    </div>
                  </div>

                  {/* Complete Historical Matrix */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono border border-slate-200 rounded-lg overflow-hidden">
                      <thead className="bg-slate-100 text-slate-700 font-sans font-bold">
                        <tr>
                          <th className="px-3 py-2.5">Event</th>
                          <th className="px-3 py-2.5">Budget</th>
                          <th className="px-3 py-2.5">Committed</th>
                          <th className="px-3 py-2.5">Actual</th>
                          <th className="px-3 py-2.5">Available</th>
                          <th className="px-3 py-2.5">Utilization %</th>
                          <th className="px-3 py-2.5">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {SIMULATOR_STEPS.map((s, idx) => (
                          <tr
                            key={s.stepNumber}
                            className={`${idx === simStep ? 'bg-emerald-50 font-bold' : 'hover:bg-slate-50'}`}
                          >
                            <td className="px-3 py-2.5 font-sans font-semibold text-slate-900">
                              {s.title}
                            </td>
                            <td className="px-3 py-2.5">₹{s.budget.toLocaleString('en-IN')}</td>
                            <td className="px-3 py-2.5 text-amber-700">₹{s.committed.toLocaleString('en-IN')}</td>
                            <td className="px-3 py-2.5 text-[#0B5D2A]">₹{s.actual.toLocaleString('en-IN')}</td>
                            <td className="px-3 py-2.5 text-blue-700">₹{s.available.toLocaleString('en-IN')}</td>
                            <td className="px-3 py-2.5">{s.utilization}</td>
                            <td className="px-3 py-2.5 font-sans text-slate-600 text-[11px]">{s.varianceNote}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* TAB 7: 7 BUDGET REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Reports Subnav */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
            {[
              { key: 'summary', label: '1. Budget Summary' },
              { key: 'vs-actual', label: '2. Budget vs Actual' },
              { key: 'utilization', label: '3. Budget Utilization' },
              { key: 'variance', label: '4. Budget Variance (Post-Close)' },
              { key: 'commitments', label: '5. Budget Commitment' },
              { key: 'transfers', label: '6. Budget Transfer' },
              { key: 'revisions', label: '7. Budget Revision' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setReportSubTab(tab.key as any)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  reportSubTab === tab.key
                    ? 'bg-[#0B5D2A] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Render Active Report */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            {reportSubTab === 'summary' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">1. Budget Summary Report</h3>
                    <p className="text-xs text-slate-500">Comprehensive overview across all active budget allocations.</p>
                  </div>
                  <span className="text-xs font-bold text-slate-600">
                    Total Cap: ₹{aggregateMetrics.totalBudget.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm" id="rep-budget-summary-table">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 text-xs">
                      <tr>
                        <th className="px-4 py-2.5">Budget ID</th>
                        <th className="px-4 py-2.5">Budget Name</th>
                        <th className="px-4 py-2.5">Department</th>
                        <th className="px-4 py-2.5">Branch</th>
                        <th className="px-4 py-2.5">Revised Budget</th>
                        <th className="px-4 py-2.5">Committed</th>
                        <th className="px-4 py-2.5">Actual</th>
                        <th className="px-4 py-2.5">Available</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs font-mono">
                      {budgets.map((b) => {
                        const m = budgetEngine.computeBudgetMetrics(b.id);
                        return (
                          <tr key={b.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-bold text-slate-900">{b.id}</td>
                            <td className="px-4 py-3 font-sans font-semibold text-slate-900">{b.budgetName}</td>
                            <td className="px-4 py-3 font-sans text-slate-700">{b.department}</td>
                            <td className="px-4 py-3 font-sans text-slate-600">{b.branch}</td>
                            <td className="px-4 py-3">₹{(b.revisedBudget || b.totalBudget).toLocaleString('en-IN')}</td>
                            <td className="px-4 py-3 text-amber-700">₹{m.totalCommitted.toLocaleString('en-IN')}</td>
                            <td className="px-4 py-3 text-emerald-700">₹{m.totalActual.toLocaleString('en-IN')}</td>
                            <td className="px-4 py-3 font-bold text-blue-700">₹{m.totalAvailable.toLocaleString('en-IN')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {reportSubTab === 'vs-actual' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">2. Budget vs Actual Report</h3>
                <p className="text-xs text-slate-500">Compares budgeted amounts with actual invoices and expenditures posted to the General Ledger.</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm" id="rep-vs-actual-table">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 text-xs">
                      <tr>
                        <th className="px-4 py-2.5">Department</th>
                        <th className="px-4 py-2.5">Budget Capacity</th>
                        <th className="px-4 py-2.5">Actual Invoiced & Spent</th>
                        <th className="px-4 py-2.5">Remaining Balance</th>
                        <th className="px-4 py-2.5">Spent %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs font-mono">
                      {budgets.map((b) => {
                        const m = budgetEngine.computeBudgetMetrics(b.id);
                        const spentPercent = Math.round((m.totalActual / (b.revisedBudget || b.totalBudget)) * 100);
                        return (
                          <tr key={b.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-sans font-bold text-slate-900">{b.department} ({b.branch})</td>
                            <td className="px-4 py-3">₹{(b.revisedBudget || b.totalBudget).toLocaleString('en-IN')}</td>
                            <td className="px-4 py-3 font-bold text-[#0B5D2A]">₹{m.totalActual.toLocaleString('en-IN')}</td>
                            <td className="px-4 py-3 text-slate-700">₹{((b.revisedBudget || b.totalBudget) - m.totalActual).toLocaleString('en-IN')}</td>
                            <td className="px-4 py-3 font-bold">{spentPercent}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {reportSubTab === 'utilization' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">3. Budget Utilization Report</h3>
                <p className="text-xs text-slate-500">Utilization Rate = (Committed + Actual) / Budget × 100. Monitors total encumbered headroom.</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm" id="rep-utilization-table">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 text-xs">
                      <tr>
                        <th className="px-4 py-2.5">Budget</th>
                        <th className="px-4 py-2.5">Budget Amount</th>
                        <th className="px-4 py-2.5">Committed + Actual</th>
                        <th className="px-4 py-2.5">Available Headroom</th>
                        <th className="px-4 py-2.5">Utilization Rate</th>
                        <th className="px-4 py-2.5">Health Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs font-mono">
                      {budgets.map((b) => {
                        const m = budgetEngine.computeBudgetMetrics(b.id);
                        return (
                          <tr key={b.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-sans font-semibold text-slate-900">{b.budgetName}</td>
                            <td className="px-4 py-3">₹{(b.revisedBudget || b.totalBudget).toLocaleString('en-IN')}</td>
                            <td className="px-4 py-3 font-bold text-amber-900">₹{(m.totalCommitted + m.totalActual).toLocaleString('en-IN')}</td>
                            <td className="px-4 py-3 text-blue-700">₹{m.totalAvailable.toLocaleString('en-IN')}</td>
                            <td className="px-4 py-3 font-bold">{m.utilizationRate}%</td>
                            <td className="px-4 py-3 font-sans">
                              <span
                                className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                                  m.health === 'Critical' || m.health === 'OverBudget'
                                    ? 'bg-rose-100 text-rose-800'
                                    : m.health === 'Warning'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-[#0B5D2A]'
                                }`}
                              >
                                {m.health}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {reportSubTab === 'variance' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">4. Budget Variance Report (Post-Close Metric)</h3>
                <p className="text-xs text-slate-500">
                  Variance = Budget − Actual. This is a post-close metric, calculated once open commitments have been resolved or released.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm" id="rep-variance-table">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 text-xs">
                      <tr>
                        <th className="px-4 py-2.5">Budget Name</th>
                        <th className="px-4 py-2.5">Budget Cap</th>
                        <th className="px-4 py-2.5">Actual Billed</th>
                        <th className="px-4 py-2.5">Variance Amount</th>
                        <th className="px-4 py-2.5">Nature</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs font-mono">
                      {budgets.map((b) => {
                        const m = budgetEngine.computeBudgetMetrics(b.id);
                        const isFavorable = m.variance >= 0;
                        return (
                          <tr key={b.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-sans font-bold text-slate-900">{b.budgetName}</td>
                            <td className="px-4 py-3">₹{(b.revisedBudget || b.totalBudget).toLocaleString('en-IN')}</td>
                            <td className="px-4 py-3 text-slate-800">₹{m.totalActual.toLocaleString('en-IN')}</td>
                            <td className={`px-4 py-3 font-bold ${isFavorable ? 'text-emerald-700' : 'text-rose-600'}`}>
                              ₹{m.variance.toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-3 font-sans">
                              <span
                                className={`px-2 py-0.5 text-xs font-bold rounded-md ${
                                  isFavorable ? 'bg-emerald-100 text-[#0B5D2A]' : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {isFavorable ? 'Favorable (Under Budget)' : 'Unfavorable (Overspent)'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {reportSubTab === 'commitments' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">5. Budget Commitment Report</h3>
                <p className="text-xs text-slate-500">Tracks all PO-linked encumbrances, releases, and remaining active commitments.</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm" id="rep-commitments-table">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 text-xs">
                      <tr>
                        <th className="px-4 py-2.5">PO #</th>
                        <th className="px-4 py-2.5">Vendor</th>
                        <th className="px-4 py-2.5">Department</th>
                        <th className="px-4 py-2.5">Original PO</th>
                        <th className="px-4 py-2.5">Released Amount</th>
                        <th className="px-4 py-2.5">Active Commitment</th>
                        <th className="px-4 py-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs font-mono">
                      {commitments.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-bold text-slate-900">{c.poNumber}</td>
                          <td className="px-4 py-3 font-sans font-medium text-slate-900">{c.vendorName || 'Vendor'}</td>
                          <td className="px-4 py-3 font-sans text-slate-700">{c.department}</td>
                          <td className="px-4 py-3">₹{c.originalAmount.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3 text-blue-700">₹{c.releasedAmount.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3 font-bold text-amber-700">₹{c.activeCommitment.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3 font-sans">
                            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700">
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {reportSubTab === 'transfers' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">6. Budget Transfer Report</h3>
                <p className="text-xs text-slate-500">History of inter-department and inter-category reallocations with source protection validation.</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm" id="rep-transfers-table">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 text-xs">
                      <tr>
                        <th className="px-4 py-2.5">Transfer #</th>
                        <th className="px-4 py-2.5">Date</th>
                        <th className="px-4 py-2.5">From</th>
                        <th className="px-4 py-2.5">To</th>
                        <th className="px-4 py-2.5">Amount</th>
                        <th className="px-4 py-2.5">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs font-mono">
                      {transfers.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-bold text-purple-900">{t.transferNumber}</td>
                          <td className="px-4 py-3 text-slate-600">{t.date}</td>
                          <td className="px-4 py-3 font-sans font-medium text-slate-900">{t.sourceCategoryName}</td>
                          <td className="px-4 py-3 font-sans font-medium text-emerald-900">{t.destinationCategoryName}</td>
                          <td className="px-4 py-3 font-bold text-purple-800">₹{t.amount.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3 font-sans text-slate-600">{t.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {reportSubTab === 'revisions' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">7. Budget Revision Report</h3>
                <p className="text-xs text-slate-500">Audit trail of authorized budget modifications without overwriting original baselines.</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm" id="rep-revisions-table">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 text-xs">
                      <tr>
                        <th className="px-4 py-2.5">Revision ID</th>
                        <th className="px-4 py-2.5">Date</th>
                        <th className="px-4 py-2.5">Budget</th>
                        <th className="px-4 py-2.5">Original Cap</th>
                        <th className="px-4 py-2.5">Revised Cap</th>
                        <th className="px-4 py-2.5">Delta</th>
                        <th className="px-4 py-2.5">Approved By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs font-mono">
                      {revisions.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-bold text-blue-900">{r.id}</td>
                          <td className="px-4 py-3 text-slate-600">{r.date}</td>
                          <td className="px-4 py-3 font-sans font-semibold text-slate-900">{r.budgetName}</td>
                          <td className="px-4 py-3">₹{r.originalCap.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3 font-bold text-slate-900">₹{r.revisedCap.toLocaleString('en-IN')}</td>
                          <td className={`px-4 py-3 font-bold ${r.revisionAmount >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {r.revisionAmount >= 0 ? '+' : ''}₹{r.revisionAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3 font-sans text-slate-800">{r.approvedBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: CREATE BUDGET MASTER */}
      {isNewBudgetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#0B5D2A]" />
                Create New Budget Master
              </h3>
              <button onClick={() => setIsNewBudgetModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBudget} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Budget Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FY 2026-27 Engineering & Labs"
                  value={newBudgetForm.budgetName}
                  onChange={(e) => setNewBudgetForm({ ...newBudgetForm, budgetName: e.target.value })}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={newBudgetForm.department}
                    onChange={(e) => setNewBudgetForm({ ...newBudgetForm, department: e.target.value })}
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Branch</label>
                  <select
                    value={newBudgetForm.branch}
                    onChange={(e) => setNewBudgetForm({ ...newBudgetForm, branch: e.target.value })}
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2"
                  >
                    <option value="Kochi HQ">Kochi HQ</option>
                    <option value="Calicut Branch">Calicut Branch</option>
                    <option value="Trivandrum Office">Trivandrum Office</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cost Center</label>
                  <input
                    type="text"
                    value={newBudgetForm.costCenter}
                    onChange={(e) => setNewBudgetForm({ ...newBudgetForm, costCenter: e.target.value })}
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Budget (₹)</label>
                  <input
                    type="number"
                    required
                    value={newBudgetForm.totalBudget}
                    onChange={(e) => setNewBudgetForm({ ...newBudgetForm, totalBudget: Number(e.target.value) })}
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newBudgetForm.description}
                  onChange={(e) => setNewBudgetForm({ ...newBudgetForm, description: e.target.value })}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewBudgetModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0B5D2A] hover:bg-[#094c22] rounded-lg shadow-xs"
                >
                  Save Budget Master
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE BUDGET REVISION */}
      {isRevisionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                Revise Budget (Non-Destructive)
              </h3>
              <button onClick={() => setIsRevisionModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRevision} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Budget</label>
                <select
                  value={revisionForm.budgetId}
                  onChange={(e) => setRevisionForm({ ...revisionForm, budgetId: e.target.value })}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2"
                >
                  {budgets.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.budgetName} (Current: ₹{(b.revisedBudget || b.totalBudget).toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Total Budget Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={revisionForm.newTotalAmount}
                  onChange={(e) => setRevisionForm({ ...revisionForm, newTotalAmount: Number(e.target.value) })}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Revision Reason</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Additional allocation for server cluster upgrade..."
                  value={revisionForm.reason}
                  onChange={(e) => setRevisionForm({ ...revisionForm, reason: e.target.value })}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Requested By</label>
                  <input
                    type="text"
                    value={revisionForm.requestedBy}
                    onChange={(e) => setRevisionForm({ ...revisionForm, requestedBy: e.target.value })}
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Approved By</label>
                  <input
                    type="text"
                    value={revisionForm.approvedBy}
                    onChange={(e) => setRevisionForm({ ...revisionForm, approvedBy: e.target.value })}
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRevisionModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  Apply Revision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE BUDGET TRANSFER */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-purple-700" />
                Inter-Budget Fund Transfer
              </h3>
              <button onClick={() => setIsTransferModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTransfer} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Source Budget</label>
                  <select
                    value={transferForm.sourceBudgetId}
                    onChange={(e) => setTransferForm({ ...transferForm, sourceBudgetId: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 px-2 py-2"
                  >
                    {budgets.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.department} (Avail: ₹{budgetEngine.computeBudgetMetrics(b.id).totalAvailable.toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Destination Budget</label>
                  <select
                    value={transferForm.destinationBudgetId}
                    onChange={(e) => setTransferForm({ ...transferForm, destinationBudgetId: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 px-2 py-2"
                  >
                    {budgets.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.department}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Transfer Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm({ ...transferForm, amount: Number(e.target.value) })}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Transfer Reason</label>
                <textarea
                  rows={2}
                  required
                  value={transferForm.reason}
                  onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div className="p-3 bg-purple-50 rounded-lg text-xs text-purple-900">
                <strong>Source Protection Policy:</strong> Transfer will be automatically blocked if source Available is less than requested amount.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-xs"
                >
                  Execute Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
