import React, { useState } from 'react';
import {
  Package,
  DollarSign,
  UserCheck,
  CheckCircle2,
  Wrench,
  AlertTriangle,
  Clock,
  ArrowRightLeft,
  RotateCcw,
  LogOut,
  LogIn,
  Plus,
  TrendingDown,
  ShieldCheck,
  Calendar,
  Layers,
  ChevronRight,
  Sparkles,
  Phone,
  FileCheck,
  Building,
} from 'lucide-react';
import { Asset, AssetMetrics, AssetMovement } from '../../types/asset';
import { assetStorage } from '../../services/assetStorageService';

interface AssetOverviewViewProps {
  onNavigateToTab: (tabId: string, filter?: any) => void;
  onOpenCreateAsset: () => void;
  onOpenAllocate: () => void;
  onOpenCheckOut: () => void;
  onOpenCheckIn: () => void;
  onOpenTransfer: () => void;
  onOpenReturn: () => void;
  onOpenMaintenance: () => void;
  onSelectAsset: (asset: Asset) => void;
}

export const AssetOverviewView: React.FC<AssetOverviewViewProps> = ({
  onNavigateToTab,
  onOpenCreateAsset,
  onOpenAllocate,
  onOpenCheckOut,
  onOpenCheckIn,
  onOpenTransfer,
  onOpenReturn,
  onOpenMaintenance,
  onSelectAsset,
}) => {
  const metrics = assetStorage.getMetrics();
  const assets = assetStorage.getAssets();
  const movements = assetStorage.getMovements().slice(0, 8);
  const categories = assetStorage.getCategories();
  const outsideAssets = assetStorage.getAssetsOutsideOffice();
  const overdueReturns = assetStorage.getOverdueReturns();
  const expiringWarranties = assetStorage.getExpiringWarranties(30);

  // Status Distribution Calculation
  const statusCounts = {
    Available: assets.filter((a) => a.status === 'Available').length,
    Allocated: assets.filter((a) => a.status === 'Allocated').length,
    'Checked Out': assets.filter((a) => a.status === 'Checked Out').length,
    'Under Maintenance': assets.filter((a) => a.status === 'Under Maintenance').length,
    Retired: assets.filter((a) => a.status === 'Retired' || a.status === 'Disposed').length,
  };

  const total = assets.length || 1;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* 1. Quick Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 rounded-xl bg-[#EAF7EF] text-[#0B5D2A] flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">Asset Management Overview</h1>
            <p className="text-xs text-slate-500">Enterprise hardware lifecycle & physical custody control</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenCreateAsset}
            className="px-3 py-1.5 text-xs font-bold text-white bg-[#168A45] hover:bg-[#0B5D2A] rounded-lg shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Asset</span>
          </button>
          <button
            onClick={onOpenAllocate}
            className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Allocate</span>
          </button>
          <button
            onClick={onOpenCheckOut}
            className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-800 hover:bg-indigo-900 rounded-lg shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Check-Out</span>
          </button>
          <button
            onClick={onOpenCheckIn}
            className="px-3 py-1.5 text-xs font-bold text-slate-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5 text-indigo-700" />
            <span>Check-In</span>
          </button>
          <button
            onClick={onOpenTransfer}
            className="px-3 py-1.5 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-lg shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Transfer</span>
          </button>
          <button
            onClick={onOpenReturn}
            className="px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-700" />
            <span>Return</span>
          </button>
          <button
            onClick={() => onNavigateToTab('receiving')}
            className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <FileCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Receive Goods</span>
          </button>
        </div>
      </div>

      {/* 2. Executive KPI Cards (Section 2 - Top KPI Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Assets */}
        <div
          onClick={() => onNavigateToTab('register')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-600 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total Inventory</span>
            <div className="w-7 h-7 rounded-lg bg-[#EAF7EF] text-[#0B5D2A] flex items-center justify-center">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 font-mono group-hover:text-emerald-800 transition-colors">
            {metrics.totalAssets}
          </div>
          <div className="mt-1 text-[10px] text-slate-400 font-medium">Click to open register →</div>
        </div>

        {/* Total CapEx Cost */}
        <div
          onClick={() => onNavigateToTab('reports')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-600 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Purchase Cost</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-slate-900 font-mono truncate">
            ₹{(metrics.totalPurchaseCost / 100000).toFixed(2)}L
          </div>
          <div className="mt-1 text-[10px] text-slate-400 font-medium">₹{metrics.totalPurchaseCost.toLocaleString()}</div>
        </div>

        {/* Current Book Value */}
        <div
          onClick={() => onNavigateToTab('reports')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-600 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Book Valuation</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-emerald-800 font-mono truncate">
            ₹{(metrics.totalBookValue / 100000).toFixed(2)}L
          </div>
          <div className="mt-1 text-[10px] text-emerald-700 font-semibold">After depreciation</div>
        </div>

        {/* Allocated Assets */}
        <div
          onClick={() => onNavigateToTab('register', { status: 'Allocated' })}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-600 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Allocated</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-800 font-mono">
            {metrics.allocatedAssets}
          </div>
          <div className="mt-1 text-[10px] text-emerald-700 font-bold">
            {Math.round((metrics.allocatedAssets / total) * 100)}% utilization
          </div>
        </div>

        {/* Available In Store */}
        <div
          onClick={() => onNavigateToTab('register', { status: 'Available' })}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-600 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Available In Store</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-800 font-mono">
            {metrics.availableAssets}
          </div>
          <div className="mt-1 text-[10px] text-slate-400 font-medium">Ready for issuance</div>
        </div>

        {/* Maintenance / Needs Attention */}
        <div
          onClick={() => onNavigateToTab('maintenance')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-amber-500 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Maintenance</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center">
              <Wrench className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-800 font-mono">
            {metrics.maintenanceAssets}
          </div>
          <div className="mt-1 text-[10px] text-amber-700 font-bold">Under active repair</div>
        </div>
      </div>

      {/* 3. Action Required Bar (Section 2 - Critical & Attention Alerts) */}
      {(overdueReturns.length > 0 || expiringWarranties.length > 0 || outsideAssets.length > 0) && (
        <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
              </span>
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-950">
                Action Required ({overdueReturns.length + expiringWarranties.length} items flagged)
              </h3>
            </div>
            <span className="text-[11px] font-medium text-amber-900">Immediate attention recommended</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Overdue Check-Out Returns */}
            <div
              onClick={() => onNavigateToTab('check-in-out')}
              className="bg-white p-3 rounded-xl border border-amber-200 hover:border-red-400 cursor-pointer shadow-2xs"
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-red-700 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Overdue Returns</span>
                </span>
                <span className="px-1.5 py-0.2 text-[10px] font-black rounded-full bg-red-100 text-red-800">
                  🔴 {overdueReturns.length} Overdue
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                {overdueReturns.length > 0
                  ? `${overdueReturns[0].name} outside location past return date`
                  : 'All temporary assets are safely within grace period'}
              </p>
            </div>

            {/* Expiring Warranties */}
            <div
              onClick={() => onNavigateToTab('warranty')}
              className="bg-white p-3 rounded-xl border border-amber-200 hover:border-amber-400 cursor-pointer shadow-2xs"
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-amber-800 flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Warranties Expiring (30 Days)</span>
                </span>
                <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-amber-100 text-amber-900">
                  {expiringWarranties.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                {expiringWarranties.length > 0
                  ? `${expiringWarranties.length} assets require AMC renewal or warranty extension`
                  : 'All OEM warranties healthy'}
              </p>
            </div>

            {/* Assets Outside Office */}
            <div
              onClick={() => onNavigateToTab('check-in-out')}
              className="bg-white p-3 rounded-xl border border-amber-200 hover:border-indigo-400 cursor-pointer shadow-2xs"
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-indigo-800 flex items-center space-x-1">
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Outside Office Tracking</span>
                </span>
                <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-800">
                  {outsideAssets.length} Active
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Temporary field deployments, student expos, or client presentations
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Two-Column Dashboard Grid: Status & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution Visual Bar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Asset Status Distribution</h3>
            <span className="text-xs text-slate-400 font-mono">{assets.length} Total</span>
          </div>

          {/* Segmented Progress Bar */}
          <div className="w-full h-3.5 rounded-full overflow-hidden flex bg-slate-100">
            <div
              style={{ width: `${(statusCounts.Allocated / total) * 100}%` }}
              className="bg-emerald-600 h-full"
              title={`Allocated: ${statusCounts.Allocated}`}
            />
            <div
              style={{ width: `${(statusCounts.Available / total) * 100}%` }}
              className="bg-emerald-300 h-full"
              title={`Available: ${statusCounts.Available}`}
            />
            <div
              style={{ width: `${(statusCounts['Checked Out'] / total) * 100}%` }}
              className="bg-indigo-500 h-full"
              title={`Checked Out: ${statusCounts['Checked Out']}`}
            />
            <div
              style={{ width: `${(statusCounts['Under Maintenance'] / total) * 100}%` }}
              className="bg-amber-500 h-full"
              title={`Under Maintenance: ${statusCounts['Under Maintenance']}`}
            />
            <div
              style={{ width: `${(statusCounts.Retired / total) * 100}%` }}
              className="bg-slate-400 h-full"
              title={`Retired: ${statusCounts.Retired}`}
            />
          </div>

          {/* Status Breakdown List */}
          <div className="space-y-2 pt-2 text-xs">
            <div
              onClick={() => onNavigateToTab('register', { status: 'Allocated' })}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span className="font-semibold text-slate-700">Allocated to Employees</span>
              </div>
              <span className="font-mono font-bold text-slate-900">
                {statusCounts.Allocated} ({Math.round((statusCounts.Allocated / total) * 100)}%)
              </span>
            </div>

            <div
              onClick={() => onNavigateToTab('register', { status: 'Available' })}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
                <span className="font-semibold text-slate-700">Available in Storage</span>
              </div>
              <span className="font-mono font-bold text-slate-900">
                {statusCounts.Available} ({Math.round((statusCounts.Available / total) * 100)}%)
              </span>
            </div>

            <div
              onClick={() => onNavigateToTab('check-in-out')}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="font-semibold text-slate-700">Temporary Check-Out</span>
              </div>
              <span className="font-mono font-bold text-slate-900">
                {statusCounts['Checked Out']} ({Math.round((statusCounts['Checked Out'] / total) * 100)}%)
              </span>
            </div>

            <div
              onClick={() => onNavigateToTab('maintenance')}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="font-semibold text-slate-700">Under Repair / Maintenance</span>
              </div>
              <span className="font-mono font-bold text-amber-800">
                {statusCounts['Under Maintenance']} ({Math.round((statusCounts['Under Maintenance'] / total) * 100)}%)
              </span>
            </div>

            <div
              onClick={() => onNavigateToTab('retirement')}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span className="font-semibold text-slate-700">Retired / Decommissioned</span>
              </div>
              <span className="font-mono font-bold text-slate-500">
                {statusCounts.Retired}
              </span>
            </div>
          </div>
        </div>

        {/* Category Breakdown Table (Section 2) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Asset Category Portfolio</h3>
              <p className="text-xs text-slate-500">Inventory allocation and capital expenditure by department category</p>
            </div>
            <button
              onClick={() => onNavigateToTab('categories')}
              className="text-xs font-bold text-emerald-800 hover:underline"
            >
              Manage Categories →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-2">Category</th>
                  <th className="pb-2 text-center">Items</th>
                  <th className="pb-2 text-right">Purchase Cost</th>
                  <th className="pb-2 text-right">Book Value</th>
                  <th className="pb-2 text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((cat) => {
                  const catAssets = assets.filter((a) => a.category === cat.name);
                  const catCost = catAssets.reduce((s, a) => s + (a.purchaseInfo?.purchaseCost || 0), 0);
                  const catBookVal = catAssets.reduce((s, a) => s + (a.purchaseInfo?.currentBookValue || 0), 0);
                  const sharePct = metrics.totalPurchaseCost > 0 ? Math.round((catCost / metrics.totalPurchaseCost) * 100) : 0;

                  return (
                    <tr
                      key={cat.id}
                      onClick={() => onNavigateToTab('register', { category: cat.name })}
                      className="hover:bg-[#F7FAF8] cursor-pointer group"
                    >
                      <td className="py-2.5 font-bold text-slate-800 group-hover:text-emerald-800">
                        {cat.name}
                        <span className="text-[10px] text-slate-400 font-mono block">{cat.code}</span>
                      </td>
                      <td className="py-2.5 text-center font-mono font-bold text-slate-700">
                        {catAssets.length}
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                        ₹{catCost.toLocaleString()}
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-emerald-800">
                        ₹{catBookVal.toLocaleString()}
                      </td>
                      <td className="py-2.5 text-right">
                        <div className="inline-flex items-center space-x-1.5">
                          <span className="font-mono text-slate-500 font-bold text-[11px]">{sharePct}%</span>
                          <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden inline-block">
                            <div className="bg-emerald-600 h-full" style={{ width: `${sharePct}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. Bottom Grid: Overdue Outside Office + Recent Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets Outside Location / Overdue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                <LogOut className="w-4 h-4 text-indigo-700" />
                <span>Outside Location Register ({outsideAssets.length})</span>
              </h3>
              <p className="text-xs text-slate-500">Live monitoring of portable equipment deployed off-site</p>
            </div>
            <button
              onClick={() => onNavigateToTab('check-in-out')}
              className="text-xs font-bold text-indigo-800 hover:underline"
            >
              View Full Log →
            </button>
          </div>

          {outsideAssets.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No assets currently checked out outside the office premises.
            </div>
          ) : (
            <div className="space-y-2.5">
              {outsideAssets.map((asset) => {
                const isOverdue =
                  asset.temporaryCheckOut?.expectedReturnDate &&
                  new Date(asset.temporaryCheckOut.expectedReturnDate) < new Date();

                return (
                  <div
                    key={asset.id}
                    onClick={() => onSelectAsset(asset)}
                    className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-slate-900">{asset.id}</span>
                        {isOverdue ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-red-100 text-red-800 border border-red-200 animate-pulse">
                            OVERDUE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-100 text-indigo-800">
                            ON-TIME
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 truncate mt-0.5">{asset.name}</h4>
                      <p className="text-[11px] text-slate-500 truncate">
                        Custodian: <span className="font-semibold text-slate-700">{asset.temporaryCheckOut?.person}</span> • Destination: {asset.temporaryCheckOut?.destination}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block font-medium">Expected Return</span>
                      <span className={`text-xs font-mono font-bold ${isOverdue ? 'text-red-700' : 'text-slate-700'}`}>
                        {asset.temporaryCheckOut?.expectedReturnDate}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Asset Activities Timeline (Section 2 - Recent Activities) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-emerald-800" />
                <span>Recent Movement Activities</span>
              </h3>
              <p className="text-xs text-slate-500">Live transaction stream of physical custody events</p>
            </div>
            <button
              onClick={() => onNavigateToTab('movement-history')}
              className="text-xs font-bold text-emerald-800 hover:underline"
            >
              Movement Ledger →
            </button>
          </div>

          {movements.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No recent movements logged.
            </div>
          ) : (
            <div className="space-y-2.5">
              {movements.map((m) => {
                const isIN = m.direction === 'IN';
                return (
                  <div
                    key={m.id}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                          isIN ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {isIN ? 'IN' : 'OUT'}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono font-bold text-slate-900">{m.assetId}</span>
                          <span className="text-[10px] text-slate-500 font-semibold truncate">
                            {m.assetName}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 truncate">{m.reason}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 font-mono block">{m.time}</span>
                      <span className="text-[11px] font-mono text-slate-600 font-bold">{m.date}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
