import React, { useState, useMemo, useEffect } from 'react';
import {
  Building2,
  MapPin,
  Users,
  UserCheck,
  Package,
  ArrowRightLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Plus,
  RefreshCw,
  Phone,
  ShieldCheck,
  Briefcase,
  ChevronRight,
  Wrench,
  Layers,
  Filter,
  SlidersHorizontal,
} from 'lucide-react';
import { hrStorage } from '../../services/hrStorageService';
import { assetStorage } from '../../services/assetStorageService';
import { BranchMaster, Staff } from '../../types/hr';
import { Asset, AssetMovement, AssetRequest } from '../../types/asset';
import { BranchMasterTable } from './BranchMasterTable';

interface BranchDashboardViewProps {
  onNavigateTab?: (tab: string) => void;
}

export const BranchDashboardView: React.FC<BranchDashboardViewProps> = ({ onNavigateTab }) => {
  const [branches, setBranches] = useState<BranchMaster[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [movements, setMovements] = useState<AssetMovement[]>([]);
  const [assetRequests, setAssetRequests] = useState<AssetRequest[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Inactive'>('ALL');
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  const loadData = () => {
    setBranches(hrStorage.getBranchesMaster());
    setStaffList(hrStorage.getStaff());
    setAssets(assetStorage.getAllAssets());
    setMovements(assetStorage.getAllMovements());
    setAssetRequests(assetStorage.getAllRequests());
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helper to match a branch against text fields (branchLocation, location, department, etc.)
  const matchesBranch = (branch: BranchMaster, text?: string): boolean => {
    if (!text) return false;
    const normalizedText = text.toLowerCase().trim();
    const bName = branch.name.toLowerCase().trim();
    const bCode = branch.code.toLowerCase().trim();
    const bCity = (branch.city || '').toLowerCase().trim();

    if (normalizedText === bName || normalizedText === bCode) return true;
    if (normalizedText.includes(bName) || bName.includes(normalizedText)) return true;
    // Also check primary keyword (e.g. "Kochi", "Calicut", "Trivandrum", "Hostel")
    const firstWord = bName.split(' ')[0];
    if (firstWord && firstWord.length >= 4 && normalizedText.includes(firstWord)) return true;
    if (bCity && bCity.length >= 4 && normalizedText.includes(bCity)) return true;
    return false;
  };

  const branchSummaries = useMemo(() => {
    return branches.map((branch) => {
      // Staff linked to this branch
      const branchStaff = staffList.filter(
        (s) =>
          matchesBranch(branch, s.branchLocation) ||
          matchesBranch(branch, s.systemAccess?.branchAccess)
      );
      const activeStaff = branchStaff.filter((s) => s.status === 'Active');
      const onLeaveOrProbation = branchStaff.filter((s) => s.status !== 'Active');

      // Unique departments represented in this branch
      const departments = Array.from(
        new Set(branchStaff.map((s) => s.department).filter(Boolean))
      );

      // Staff login accounts enabled in this branch
      const systemEnabledCount = branchStaff.filter(
        (s) => s.systemAccess?.loginEnabled && s.systemAccess?.accountStatus !== 'Suspended'
      ).length;

      // Assets located at or assigned to staff of this branch
      const branchStaffIds = new Set(branchStaff.map((s) => s.staffId));
      const branchStaffNames = new Set(branchStaff.map((s) => s.fullName.toLowerCase()));

      const branchAssets = assets.filter(
        (a) =>
          matchesBranch(branch, a.location) ||
          (a.assignedTo && branchStaffIds.has(a.assignedTo)) ||
          (a.assignedTo && branchStaffNames.has(a.assignedTo.toLowerCase()))
      );

      const totalAssetValue = branchAssets.reduce((sum, a) => sum + (Number(a.value) || 0), 0);
      const assetsUnderMaintenance = branchAssets.filter(
        (a) => a.status === 'Under Maintenance'
      ).length;

      // Asset movements involving this branch (from/to location or asset belonging to branch)
      const branchAssetIds = new Set(branchAssets.map((a) => a.id));
      const branchMovements = movements.filter(
        (m) =>
          branchAssetIds.has(m.assetId) ||
          matchesBranch(branch, m.fromLocation) ||
          matchesBranch(branch, m.toLocation)
      );

      // Pending Asset Movements (movements awaiting approval/completion OR pending asset requests/transfers for this branch)
      const pendingMovementsList = branchMovements.filter(
        (m) => m.approvalStatus === 'Pending' || m.type === 'Maintenance'
      );

      const pendingBranchRequests = assetRequests.filter(
        (r) =>
          r.status === 'Pending' &&
          (branchStaffIds.has(r.staffId) ||
            branchStaffNames.has(r.staffName.toLowerCase()) ||
            matchesBranch(branch, r.department))
      );

      const totalPendingMovementsCount =
        pendingMovementsList.length + pendingBranchRequests.length;

      return {
        branch,
        totalStaffCount: branchStaff.length,
        activeStaffCount: activeStaff.length,
        inactiveStaffCount: onLeaveOrProbation.length,
        systemEnabledCount,
        departments,
        branchStaff,
        branchAssets,
        totalAssetValue,
        assetsUnderMaintenance,
        branchMovements,
        pendingMovementsList,
        pendingBranchRequests,
        totalPendingMovementsCount,
      };
    });
  }, [branches, staffList, assets, movements, assetRequests]);

  const filteredSummaries = useMemo(() => {
    return branchSummaries.filter((item) => {
      if (selectedBranchId !== 'ALL' && item.branch.id !== selectedBranchId) return false;
      if (statusFilter !== 'ALL' && item.branch.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.branch.name.toLowerCase().includes(q);
        const matchCode = item.branch.code.toLowerCase().includes(q);
        const matchCity = (item.branch.city || '').toLowerCase().includes(q);
        const matchHead = (item.branch.headName || '').toLowerCase().includes(q);
        return matchName || matchCode || matchCity || matchHead;
      }
      return true;
    });
  }, [branchSummaries, selectedBranchId, statusFilter, searchQuery]);

  // Overall Institution KPI Totals
  const kpiTotals = useMemo(() => {
    const activeBranches = branches.filter((b) => b.status === 'Active').length;
    const totalActiveStaff = branchSummaries.reduce((acc, s) => acc + s.activeStaffCount, 0);
    const totalPendingMovements = branchSummaries.reduce(
      (acc, s) => acc + s.totalPendingMovementsCount,
      0
    );
    const totalTrackedAssets = branchSummaries.reduce((acc, s) => acc + s.branchAssets.length, 0);
    const totalAssetVal = branchSummaries.reduce((acc, s) => acc + s.totalAssetValue, 0);

    return {
      totalBranches: branches.length,
      activeBranches,
      totalActiveStaff,
      totalPendingMovements,
      totalTrackedAssets,
      totalAssetVal,
    };
  }, [branches, branchSummaries]);

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Branch & Location Operations Dashboard
                </h1>
                <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                  HR Branch Master Live
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Real-time summary of key metrics, active staff headcount, allocated assets, and pending asset movements across all institutional branches.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={loadData}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Metrics</span>
            </button>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('hr_staff_directory')}
                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Staff Directory</span>
              </button>
            )}
            <button
              onClick={() => setIsManageModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Manage Branch Master</span>
            </button>
          </div>
        </div>

        {/* Global KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-100">
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Branches (Master)
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {kpiTotals.totalBranches}
              </div>
              <span className="text-[11px] font-semibold text-emerald-600">
                {kpiTotals.activeBranches} Active Campuses
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                Active Staff Count
              </span>
              <div className="text-2xl font-black text-emerald-950 mt-1">
                {kpiTotals.totalActiveStaff}
              </div>
              <span className="text-[11px] font-semibold text-emerald-700">
                Across {kpiTotals.activeBranches} active locations
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/70 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                Pending Asset Movements
              </span>
              <div className="text-2xl font-black text-amber-950 mt-1">
                {kpiTotals.totalPendingMovements}
              </div>
              <span className="text-[11px] font-semibold text-amber-700">
                Transfers, requests & maintenance
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                Branch Assets & Value
              </span>
              <div className="text-2xl font-black text-blue-950 mt-1">
                {kpiTotals.totalTrackedAssets}{' '}
                <span className="text-xs font-bold text-blue-700">
                  (₹{(kpiTotals.totalAssetVal / 1000).toFixed(1)}k)
                </span>
              </div>
              <span className="text-[11px] font-semibold text-blue-700">
                Assigned to branches & staff
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Branch Selector Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedBranchId('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedBranchId === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Branches ({branches.length})
          </button>
          {branches.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedBranchId(b.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                selectedBranchId === b.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span className="font-mono text-[10px] opacity-80">[{b.code}]</span>
              <span>{b.name}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search branch, code, city..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'Active' | 'Inactive')}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Branch Cards Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredSummaries.map((summary) => {
          const {
            branch,
            totalStaffCount,
            activeStaffCount,
            inactiveStaffCount,
            systemEnabledCount,
            departments,
            branchStaff,
            branchAssets,
            totalAssetValue,
            assetsUnderMaintenance,
            branchMovements,
            pendingMovementsList,
            pendingBranchRequests,
            totalPendingMovementsCount,
          } = summary;

          return (
            <div
              key={branch.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col justify-between hover:border-indigo-200 transition-all"
            >
              {/* Card Header */}
              <div>
                <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-indigo-50/30 flex items-start justify-between gap-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex flex-col items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4" />
                      <span className="text-[9px] font-mono font-black mt-0.5">{branch.code}</span>
                    </div>
                    <div>
                      <div className="flex items-center flex-wrap gap-2">
                        <h3 className="text-base font-black text-slate-900">{branch.name}</h3>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            branch.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {branch.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>{branch.city || 'Main Campus'}</span>
                        {branch.address && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-xs">{branch.address}</span>
                          </>
                        )}
                      </p>
                      {(branch.headName || branch.contactPhone) && (
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-600">
                          {branch.headName && (
                            <span className="font-semibold text-slate-700">
                              Head: {branch.headName}
                            </span>
                          )}
                          {branch.contactPhone && (
                            <span className="flex items-center gap-1 text-slate-500">
                              <Phone className="w-3 h-3" />
                              {branch.contactPhone}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Pending Badge */}
                  <div className="shrink-0 text-right">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${
                        totalPendingMovementsCount > 0
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {totalPendingMovementsCount > 0 ? (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>{totalPendingMovementsCount} Pending Movement(s)</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>All Movements Clear</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Key Metrics Grid inside Branch Card */}
                <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-slate-100">
                  <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                    <div className="flex items-center justify-between text-emerald-700">
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        Active Staff
                      </span>
                      <UserCheck className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-xl font-black text-emerald-950 mt-1">
                      {activeStaffCount}
                    </div>
                    <div className="text-[10px] text-emerald-700 mt-0.5">
                      Total Assigned: {totalStaffCount}{' '}
                      {inactiveStaffCount > 0 ? `(${inactiveStaffCount} leave)` : ''}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                    <div className="flex items-center justify-between text-amber-800">
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        Pending Moves
                      </span>
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-xl font-black text-amber-950 mt-1">
                      {totalPendingMovementsCount}
                    </div>
                    <div className="text-[10px] text-amber-700 mt-0.5">
                      {pendingMovementsList.length} transfer • {pendingBranchRequests.length} req
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                    <div className="flex items-center justify-between text-blue-700">
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        Branch Assets
                      </span>
                      <Package className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-xl font-black text-blue-950 mt-1">
                      {branchAssets.length}
                    </div>
                    <div className="text-[10px] text-blue-700 mt-0.5">
                      ₹{totalAssetValue.toLocaleString()} ({assetsUnderMaintenance} maint.)
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100">
                    <div className="flex items-center justify-between text-indigo-700">
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        Portal Access
                      </span>
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-xl font-black text-indigo-950 mt-1">
                      {systemEnabledCount}
                    </div>
                    <div className="text-[10px] text-indigo-700 mt-0.5">
                      {departments.length} Dept(s) Active
                    </div>
                  </div>
                </div>

                {/* Two-Column Detail Breakdown: Active Staff & Pending Asset Movements */}
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Active Staff Roster in Branch */}
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5">
                    <div className="flex items-center justify-between mb-2.5">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Assigned Staff ({branchStaff.length})</span>
                      </h4>
                      {departments.length > 0 && (
                        <span className="text-[10px] font-semibold text-slate-500">
                          {departments.slice(0, 2).join(', ')}
                          {departments.length > 2 ? ` +${departments.length - 2}` : ''}
                        </span>
                      )}
                    </div>

                    {branchStaff.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        No staff members currently linked to {branch.name}.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                        {branchStaff.map((st) => (
                          <div
                            key={st.id}
                            className="bg-white p-2.5 rounded-lg border border-slate-200/70 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 truncate">
                                {st.fullName}
                              </div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                                <span className="font-mono text-indigo-600 font-semibold">
                                  {st.staffId}
                                </span>
                                <span>•</span>
                                <span className="truncate">{st.designation || st.department}</span>
                              </div>
                            </div>
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-full shrink-0 ${
                                st.status === 'Active'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {st.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right: Pending Asset Movements & Recent Transfers */}
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5">
                    <div className="flex items-center justify-between mb-2.5">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600" />
                        <span>Pending Asset Movements ({totalPendingMovementsCount})</span>
                      </h4>
                      <span className="text-[10px] font-semibold text-slate-500">
                        {branchMovements.length} total logs
                      </span>
                    </div>

                    {totalPendingMovementsCount === 0 && branchMovements.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        No pending asset movements or requests for this branch.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                        {/* Pending Movements */}
                        {pendingMovementsList.map((mov) => (
                          <div
                            key={mov.id}
                            className="bg-amber-50/70 p-2.5 rounded-lg border border-amber-200/80 flex items-start justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 truncate">
                                {mov.assetName}
                              </div>
                              <div className="text-[10px] text-slate-600 mt-0.5">
                                {mov.fromLocation || 'Store'} → {mov.toLocation || branch.name}
                              </div>
                              <div className="text-[10px] text-amber-700 font-medium mt-0.5">
                                {mov.type} • {mov.date}
                              </div>
                            </div>
                            <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-amber-100 text-amber-800 rounded-md shrink-0">
                              {mov.approvalStatus || 'Pending'}
                            </span>
                          </div>
                        ))}

                        {/* Pending Asset Requests */}
                        {pendingBranchRequests.map((req) => (
                          <div
                            key={req.id}
                            className="bg-amber-50/70 p-2.5 rounded-lg border border-amber-200/80 flex items-start justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 truncate">
                                {req.assetCategory} ({req.requestType})
                              </div>
                              <div className="text-[10px] text-slate-600 mt-0.5">
                                Requested by: {req.staffName}
                              </div>
                              <div className="text-[10px] text-amber-700 font-medium mt-0.5">
                                Urgency: {req.urgency} • {req.requestDate}
                              </div>
                            </div>
                            <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-amber-100 text-amber-800 rounded-md shrink-0">
                              Pending Req
                            </span>
                          </div>
                        ))}

                        {/* Also show recent approved movements if no pending ones or below pending */}
                        {branchMovements
                          .filter(
                            (m) => m.approvalStatus !== 'Pending' && m.type !== 'Maintenance'
                          )
                          .slice(0, 3)
                          .map((mov) => (
                            <div
                              key={mov.id}
                              className="bg-white p-2.5 rounded-lg border border-slate-200/70 flex items-start justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-slate-800 truncate">
                                  {mov.assetName}
                                </div>
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  {mov.fromLocation || 'Source'} → {mov.toLocation || branch.name}
                                </div>
                              </div>
                              <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-50 text-emerald-700 rounded-md shrink-0">
                                {mov.type}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="text-slate-500 font-medium">
                  Branch Code: <span className="font-mono font-bold text-slate-800">{branch.code}</span>
                </div>
                <div className="flex items-center gap-3">
                  {onNavigateTab && (
                    <button
                      onClick={() => onNavigateTab('hr_staff_access')}
                      className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Staff Access</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Consolidated Branch Comparison Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900">
              Branch Master Summary Matrix
            </h3>
            <p className="text-xs text-slate-500">
              Consolidated comparison of active staff count, portal accounts, assets, and pending movements per branch
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Branch Code & Name</th>
                <th className="py-3 px-4">City / Campus Head</th>
                <th className="py-3 px-4 text-center">Active Staff</th>
                <th className="py-3 px-4 text-center">System Logins</th>
                <th className="py-3 px-4 text-center">Tracked Assets</th>
                <th className="py-3 px-4 text-center">Pending Asset Movements</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredSummaries.map((row) => (
                <tr key={row.branch.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-2.5">
                      <span className="px-2 py-0.5 font-mono text-[10px] font-bold bg-indigo-50 text-indigo-700 rounded border border-indigo-200">
                        {row.branch.code}
                      </span>
                      <span className="font-bold text-slate-900">{row.branch.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    <div className="font-semibold text-slate-800">{row.branch.city || '—'}</div>
                    <div className="text-[10px] text-slate-400">
                      {row.branch.headName || 'No Head Assigned'}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {row.activeStaffCount}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1">
                      / {row.totalStaffCount}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-indigo-700">
                    {row.systemEnabledCount}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="font-bold text-slate-800">{row.branchAssets.length}</span>
                    <span className="block text-[10px] text-slate-400">
                      ₹{row.totalAssetValue.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {row.totalPendingMovementsCount > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <Clock className="w-3 h-3" />
                        {row.totalPendingMovementsCount} Pending
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                        0 Pending
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        row.branch.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {row.branch.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manage Branch Master Modal */}
      {isManageModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Building2 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold">Manage HR Branch / Location Master</h3>
              </div>
              <button
                onClick={() => {
                  setIsManageModalOpen(false);
                  loadData();
                }}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <BranchMasterTable onBranchChange={() => loadData()} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
