import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  Layers,
  UserCheck,
  Wrench,
  ShieldCheck,
  Trash2,
  DollarSign,
  Building,
} from 'lucide-react';
import { assetStorage } from '../../services/assetStorageService';
import { hrStorage } from '../../services/hrStorageService';

type ReportType =
  | 'register'
  | 'status'
  | 'category'
  | 'movement'
  | 'employee'
  | 'maintenance'
  | 'warranty'
  | 'retirement';

export const AssetReportsView: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<ReportType>('register');
  const assets = assetStorage.getAssets();
  const movements = assetStorage.getMovements();
  const maintenance = assetStorage.getMaintenanceRecords();
  const staff = hrStorage.getStaff();
  const categories = assetStorage.getCategories();
  const metrics = assetStorage.getMetrics();

  const handlePrint = () => {
    document.body.classList.add('asset-print-optimized');
    document.body.classList.add('erp-fullscreen-print-optimized');

    const cleanup = () => {
      document.body.classList.remove('asset-print-optimized');
      document.body.classList.remove('erp-fullscreen-print-optimized');
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup);

    setTimeout(() => {
      window.print();
      setTimeout(cleanup, 1200);
    }, 120);
  };

  const handleExport = () => {
    let csv = '';
    if (selectedReport === 'register' || selectedReport === 'status' || selectedReport === 'category' || selectedReport === 'warranty') {
      csv = assetStorage.exportAssetsToCSV();
    } else {
      csv = assetStorage.exportMovementsToCSV();
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Asset_Report_${selectedReport}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in">
      {/* 1. Header Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Asset Management Reports & Auditing</h2>
          <p className="text-xs text-slate-500">
            Exportable compliance statements, depreciation audits, and physical custody reports
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-2xs flex items-center space-x-1.5 cursor-pointer ring-1 ring-emerald-500/30"
            title="Trigger browser print dialogue (Print to paper or Save as PDF) with full-screen layout optimization"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print/PDF Report</span>
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-2xs flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Report Selector Chips */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'register', label: 'Asset Register Audit', icon: FileText },
          { id: 'status', label: 'Status & Utilization', icon: Layers },
          { id: 'category', label: 'Category & Valuation', icon: DollarSign },
          { id: 'movement', label: 'Physical Custody Movements', icon: Calendar },
          { id: 'employee', label: 'Staff Asset Holding', icon: UserCheck },
          { id: 'maintenance', label: 'Maintenance & Repairs', icon: Wrench },
          { id: 'warranty', label: 'Warranty Expiration Audit', icon: ShieldCheck },
          { id: 'retirement', label: 'Retirement & Write-Off', icon: Trash2 },
        ].map((rep) => {
          const Icon = rep.icon;
          const isActive = selectedReport === rep.id;
          return (
            <button
              key={rep.id}
              onClick={() => setSelectedReport(rep.id as ReportType)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{rep.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Printable Report Canvas */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-6">
        {/* Printable Header */}
        <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">MYSAR ERP ASSET REPORT</span>
            <h3 className="text-lg font-black text-slate-900 capitalize">
              {selectedReport.replace('-', ' ')} Summary Statement
            </h3>
            <p className="text-xs text-slate-500">
              Generated on {new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}
            </p>
          </div>
          <div className="text-right font-mono text-xs">
            <span className="text-slate-400 block">Total Portfolio Valuation</span>
            <span className="text-base font-black text-emerald-800">
              ₹{metrics.totalBookValue.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Report Content based on Selection */}
        {selectedReport === 'register' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Asset ID</th>
                  <th className="py-2.5 px-3">Name & Brand</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Serial No</th>
                  <th className="py-2.5 px-3">Custodian</th>
                  <th className="py-2.5 px-3 text-right">Purchase Cost</th>
                  <th className="py-2.5 px-3 text-right">Book Value</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assets.map((a) => (
                  <tr key={a.id}>
                    <td className="py-2 px-3 font-mono font-bold text-slate-900">{a.id}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800">{a.name}</td>
                    <td className="py-2 px-3 text-slate-600">{a.category}</td>
                    <td className="py-2 px-3 font-mono text-slate-500">{a.serialNumber}</td>
                    <td className="py-2 px-3 text-slate-700">
                      {a.currentAssignment?.employeeName || 'Store'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-700">
                      ₹{(a.purchaseInfo?.purchaseCost || 0).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-800">
                      ₹{(a.purchaseInfo?.currentBookValue || 0).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-[10px]">{a.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedReport === 'category' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-center">Asset Count</th>
                  <th className="py-2.5 px-3 text-right">Total Purchase Cost</th>
                  <th className="py-2.5 px-3 text-right">Current Book Value</th>
                  <th className="py-2.5 px-3 text-right">Total Depreciation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((c) => {
                  const catAssets = assets.filter((a) => a.category === c.name);
                  const cost = catAssets.reduce((s, a) => s + (a.purchaseInfo?.purchaseCost || 0), 0);
                  const book = catAssets.reduce((s, a) => s + (a.purchaseInfo?.currentBookValue || 0), 0);
                  return (
                    <tr key={c.id}>
                      <td className="py-2 px-3 font-bold text-slate-800">{c.name}</td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-700">
                        {catAssets.length}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-900">
                        ₹{cost.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-800">
                        ₹{book.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-rose-700">
                        -₹{(cost - book).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {selectedReport === 'employee' && (
          <div className="space-y-4">
            {staff.map((emp) => {
              const empData = assetStorage.getAssetsForEmployee(emp.id);
              if (!empData || empData.currentAssets.length === 0) return null;
              const empAssets = empData.currentAssets;

              return (
                <div key={emp.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                    <div>
                      <span className="font-bold text-slate-900 text-sm">
                        {emp.fullName}
                      </span>
                      <span className="text-slate-500 text-[11px] ml-2 font-mono">
                        ({emp.id} • {emp.department})
                      </span>
                    </div>
                    <span className="font-bold text-emerald-800 font-mono">
                      {empAssets.length} Assets Held
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {empAssets.map((ea) => (
                      <div key={ea.id} className="p-2 bg-white rounded border border-slate-200 flex justify-between">
                        <div>
                          <span className="font-mono font-bold text-slate-900 block">{ea.id}</span>
                          <span className="text-slate-700 font-medium">{ea.name}</span>
                        </div>
                        <span className="text-slate-400 font-mono text-[10px]">
                          Allocated: {ea.currentAssignment?.allocationDate}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedReport === 'maintenance' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">WO Number</th>
                  <th className="py-2.5 px-3">Asset ID</th>
                  <th className="py-2.5 px-3">Issue</th>
                  <th className="py-2.5 px-3">Service Provider</th>
                  <th className="py-2.5 px-3 text-right">Cost (₹)</th>
                  <th className="py-2.5 px-3 text-center">Warranty</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {maintenance.map((m) => (
                  <tr key={m.id}>
                    <td className="py-2 px-3 font-mono font-bold text-amber-800">{m.id}</td>
                    <td className="py-2 px-3 font-mono font-bold text-slate-900">{m.assetId}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800">{m.issue}</td>
                    <td className="py-2 px-3 text-slate-700">{m.serviceProvider}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      ₹{m.cost.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-center text-[10px] font-bold">
                      {m.warrantyClaim ? 'Covered' : 'Paid'}
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-[10px]">{m.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
