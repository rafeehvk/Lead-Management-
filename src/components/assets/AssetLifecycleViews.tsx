import React, { useState } from 'react';
import {
  Wrench,
  ShieldCheck,
  FileText,
  Trash2,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  Printer,
  Calendar,
  DollarSign,
  Building,
} from 'lucide-react';
import { AssetMaintenance, AssetRetirement, Asset } from '../../types/asset';
import { assetStorage } from '../../services/assetStorageService';

// ==========================================
// 1. ASSET MAINTENANCE VIEW (Section 13)
// ==========================================
export const AssetMaintenanceView: React.FC<{
  onSelectAsset?: (asset: Asset) => void;
  actorName?: string;
}> = ({ onSelectAsset, actorName = 'Admin' }) => {
  const [records, setRecords] = useState<AssetMaintenance[]>(() =>
    assetStorage.getMaintenanceRecords()
  );
  const [statusFilter, setStatusFilter] = useState('ALL');

  const refreshData = () => {
    setRecords(assetStorage.getMaintenanceRecords());
  };

  const handleCompleteWorkOrder = (id: string) => {
    assetStorage.completeMaintenance(
      id,
      {
        finalCost: 2500,
        verifiedBy: actorName,
        remarks: 'Service completed by technician. Hardware tested and fully operational.',
        partsReplaced: 'Battery Pack & Thermal Paste Replaced',
      },
      actorName
    );
    refreshData();
  };

  const filtered = records.filter(
    (r) => statusFilter === 'ALL' || r.status === statusFilter
  );

  return (
    <div className="space-y-4 pb-12 animate-in fade-in">
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Asset Maintenance & Repair Management</h2>
          <p className="text-xs text-slate-500">
            Work order tracking, preventive maintenance schedules, and OEM warranty claims
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
          >
            <option value="ALL">All Work Orders</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Scheduled">Scheduled</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">WO Number</th>
                <th className="py-3 px-4">Asset ID</th>
                <th className="py-3 px-4">Service Date</th>
                <th className="py-3 px-4">Reported Issue</th>
                <th className="py-3 px-4">Service Provider</th>
                <th className="py-3 px-4 text-right">Cost (₹)</th>
                <th className="py-3 px-4 text-center">Warranty Covered</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-[#F7FAF8]">
                  <td className="py-3 px-4 font-mono font-bold text-amber-800">{m.id}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{m.assetId}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{m.serviceDate}</td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-800 block">{m.issue}</span>
                    <span className="text-[10px] text-slate-500 block truncate max-w-xs">{m.description}</span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-700">{m.serviceProvider}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    ₹{m.cost.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.warrantyClaim
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {m.warrantyClaim ? 'Yes (OEM Claim)' : 'No'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        m.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-900 animate-pulse'
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {m.status !== 'Completed' ? (
                      <button
                        onClick={() => handleCompleteWorkOrder(m.id)}
                        className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded text-[10px]"
                      >
                        Mark Completed
                      </button>
                    ) : (
                      <span className="text-[10px] text-emerald-700 font-semibold">Repaired</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. ASSET WARRANTY VIEW (Section 14)
// ==========================================
export const AssetWarrantyView: React.FC = () => {
  const assets = assetStorage.getAssets();
  const [filterMode, setFilterMode] = useState<'ALL' | 'EXPIRING' | 'EXPIRED'>('ALL');

  const assetsWithWarranty = assets.filter((a) => a.warranty);

  const filtered = assetsWithWarranty.filter((a) => {
    const end = new Date(a.warranty.endDate);
    const now = new Date();
    const days = Math.round((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (filterMode === 'EXPIRING') return days >= 0 && days <= 60;
    if (filterMode === 'EXPIRED') return days < 0;
    return true;
  });

  return (
    <div className="space-y-4 pb-12 animate-in fade-in">
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Warranty Protection & AMC Register</h2>
          <p className="text-xs text-slate-500">
            Monitor equipment warranties, AMC renewals, SLA obligations, and claim eligibility
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg ${
              filterMode === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            All Warranties
          </button>
          <button
            onClick={() => setFilterMode('EXPIRING')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg ${
              filterMode === 'EXPIRING'
                ? 'bg-amber-800 text-white'
                : 'bg-white text-amber-800 border border-amber-300'
            }`}
          >
            Expiring Soon (60 Days)
          </button>
          <button
            onClick={() => setFilterMode('EXPIRED')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg ${
              filterMode === 'EXPIRED'
                ? 'bg-rose-800 text-white'
                : 'bg-white text-rose-800 border border-rose-300'
            }`}
          >
            Expired Policies
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((a) => {
          const end = new Date(a.warranty.endDate);
          const now = new Date();
          const daysLeft = Math.round((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const isExpired = daysLeft < 0;

          return (
            <div
              key={a.id}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-900">{a.id}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isExpired
                      ? 'bg-rose-100 text-rose-800'
                      : daysLeft <= 30
                      ? 'bg-amber-100 text-amber-800 animate-pulse'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {isExpired ? 'EXPIRED' : `${daysLeft} Days Remaining`}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-800 truncate">{a.name}</h4>
                <p className="text-[10px] text-slate-500">
                  {a.brand} {a.model} • S/N: {a.serialNumber}
                </p>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Provider:</span>
                  <span className="font-semibold text-slate-700">{a.warranty.provider}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Policy / Cert No:</span>
                  <span className="font-mono text-slate-800 font-bold">{a.warranty.warrantyNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Expiry Date:</span>
                  <span className="font-mono text-slate-800">{a.warranty.endDate}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==========================================
// 3. ASSET DOCUMENTS VIEW (Section 15)
// ==========================================
export const AssetDocumentsView: React.FC = () => {
  const assets = assetStorage.getAssets();

  return (
    <div className="space-y-4 pb-12 animate-in fade-in">
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <h2 className="text-base font-bold text-slate-900">Asset Documents & Digital Certificates</h2>
        <p className="text-xs text-slate-500">
          Central document repository for equipment procurement invoices, warranty certificates, and disposal forms
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {assets.map((asset) => (
          <div key={asset.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="font-mono text-xs font-bold text-slate-900 block">{asset.id}</span>
                <span className="text-xs text-slate-600 font-semibold truncate block">{asset.name}</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1 text-xs">
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100">
                <span className="text-slate-700">Vendor Tax Invoice</span>
                <button className="text-emerald-800 font-bold hover:underline">Download</button>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100">
                <span className="text-slate-700">Warranty Card</span>
                <button className="text-emerald-800 font-bold hover:underline">Download</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// 4. ASSET RETIREMENT / DISPOSAL VIEW (Section 16)
// ==========================================
export const AssetRetirementView: React.FC = () => {
  const retirements = assetStorage.getRetirements();
  const retiredAssets = assetStorage.getAssets().filter(
    (a) => a.status === 'Retired' || a.status === 'Disposed'
  );

  return (
    <div className="space-y-4 pb-12 animate-in fade-in">
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Asset Retirement & Decommissioning Register</h2>
          <p className="text-xs text-slate-500">
            Audit register of written-off, scrapped, recycled, or sold hardware inventory
          </p>
        </div>
        <div className="text-right font-mono text-xs text-slate-500">
          Total Decommissioned: <strong className="text-slate-800">{retiredAssets.length}</strong>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Asset ID</th>
                <th className="py-3 px-4">Retirement Date</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Disposal Method</th>
                <th className="py-3 px-4 text-right">Salvage Value (₹)</th>
                <th className="py-3 px-4">Authorized By</th>
                <th className="py-3 px-4">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {retirements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No retired or disposed assets in records.
                  </td>
                </tr>
              ) : (
                retirements.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F7FAF8]">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.assetId}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{r.retirementDate}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{r.reason}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {r.disposalMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{r.disposalValue.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">{r.approvedBy}</td>
                    <td className="py-3 px-4 text-slate-500">{r.remarks || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
