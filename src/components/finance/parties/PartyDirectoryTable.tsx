import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Users,
  Building2,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Eye,
  Edit2,
  ShieldAlert,
  ArrowUpDown,
  CreditCard,
  Plus,
  Receipt,
  FileCheck,
} from 'lucide-react';
import { PartyMaster, PartyType, GSTRegistrationType } from '../../../types/finance';
import { validateGSTIN } from '../../../utils/gstUtils';

interface PartyDirectoryTableProps {
  parties: PartyMaster[];
  onSelectParty: (party: PartyMaster) => void;
  onEditParty: (party: PartyMaster) => void;
  onNewParty: () => void;
  onOpenOpeningBalances: () => void;
  onOpenReports: (tab?: 'ledger' | 'receivables' | 'payables' | 'statement') => void;
}

export const PartyDirectoryTable: React.FC<PartyDirectoryTableProps> = ({
  parties,
  onSelectParty,
  onEditParty,
  onNewParty,
  onOpenOpeningBalances,
  onOpenReports,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | PartyType>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [gstTypeFilter, setGstTypeFilter] = useState<'All' | GSTRegistrationType>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Derive unique categories from existing data
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    parties.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [parties]);

  // Filtered list
  const filteredParties = useMemo(() => {
    return parties.filter((p) => {
      if (typeFilter !== 'All' && p.type !== typeFilter) return false;
      if (categoryFilter !== 'All' && p.category !== categoryFilter) return false;
      if (gstTypeFilter !== 'All' && p.gstType !== gstTypeFilter) return false;
      if (statusFilter !== 'All' && p.status !== statusFilter) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchCode = p.code.toLowerCase().includes(q);
        const matchContact = p.contactPerson.toLowerCase().includes(q);
        const matchPhone = p.phone.toLowerCase().includes(q);
        const matchGst = p.gstin?.toLowerCase().includes(q);
        const matchPan = p.pan?.toLowerCase().includes(q);
        const matchCity = p.city.toLowerCase().includes(q);
        return matchName || matchCode || matchContact || matchPhone || matchGst || matchPan || matchCity;
      }
      return true;
    });
  }, [parties, typeFilter, categoryFilter, gstTypeFilter, statusFilter, searchTerm]);

  // Metrics
  const metrics = useMemo(() => {
    const total = parties.length;
    const customers = parties.filter((p) => p.type === 'Customer' || p.type === 'Customer & Vendor').length;
    const vendors = parties.filter((p) => p.type === 'Vendor' || p.type === 'Customer & Vendor').length;
    const dual = parties.filter((p) => p.type === 'Customer & Vendor').length;

    let totalReceivables = 0;
    let totalPayables = 0;
    parties.forEach((p) => {
      if (p.currentBalance > 0) totalReceivables += p.currentBalance;
      if (p.currentBalance < 0) totalPayables += Math.abs(p.currentBalance);
    });

    return { total, customers, vendors, dual, totalReceivables, totalPayables };
  }, [parties]);

  const getTypeBadge = (type: PartyType) => {
    switch (type) {
      case 'Customer & Vendor':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            Dual: Cust & Vend
          </span>
        );
      case 'Customer':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Customer
          </span>
        );
      case 'Vendor':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            Vendor
          </span>
        );
    }
  };

  const getStatusBadge = (status: PartyMaster['status']) => {
    switch (status) {
      case 'Active':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200">Active</span>;
      case 'On Hold':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">On Hold</span>;
      case 'Blacklisted':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 border border-red-200 font-semibold">Blacklisted</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">Inactive</span>;
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Total Parties</p>
          <p className="text-xl font-bold text-slate-800 mt-1">{metrics.total}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Unified Master</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-emerald-600">Customers</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">{metrics.customers}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Active Buyers</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-amber-600">Vendors</p>
          <p className="text-xl font-bold text-amber-700 mt-1">{metrics.vendors}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Suppliers & Contractors</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-purple-200 bg-purple-50/40 shadow-xs">
          <p className="text-xs font-medium text-purple-700">Customer & Vendor</p>
          <p className="text-xl font-bold text-purple-800 mt-1">{metrics.dual}</p>
          <p className="text-[11px] text-purple-600/80 mt-0.5">Dual Transactions</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Receivables (Dr)</p>
          <p className="text-lg font-bold text-slate-900 mt-1">₹{metrics.totalReceivables.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">From Customers</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Payables (Cr)</p>
          <p className="text-lg font-bold text-slate-900 mt-1">₹{metrics.totalPayables.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-amber-600 mt-0.5">To Vendors</p>
        </div>
      </div>

      {/* Control Bar: Filters & Action Buttons */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Name, Code, Phone, GSTIN, PAN, or City..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onOpenOpeningBalances}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors"
            >
              <FileCheck className="w-3.5 h-3.5 text-slate-600" />
              Opening Balances
            </button>
            <button
              onClick={() => onOpenReports('receivables')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
            >
              <Receipt className="w-3.5 h-3.5" />
              Party Reports
            </button>
            <button
              onClick={onNewParty}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Party
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-medium inline-flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filters:
          </span>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-md bg-white text-slate-700 text-xs focus:ring-1 focus:ring-blue-500"
          >
            <option value="All">All Types</option>
            <option value="Customer">Customer</option>
            <option value="Vendor">Vendor</option>
            <option value="Customer & Vendor">Customer & Vendor</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-md bg-white text-slate-700 text-xs focus:ring-1 focus:ring-blue-500"
          >
            <option value="All">All Categories</option>
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* GST Type */}
          <select
            value={gstTypeFilter}
            onChange={(e) => setGstTypeFilter(e.target.value as any)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-md bg-white text-slate-700 text-xs focus:ring-1 focus:ring-blue-500"
          >
            <option value="All">All GST Reg Types</option>
            <option value="Regular">Regular</option>
            <option value="Composition">Composition</option>
            <option value="SEZ">SEZ</option>
            <option value="Unregistered">Unregistered</option>
            <option value="Consumer">Consumer</option>
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-md bg-white text-slate-700 text-xs focus:ring-1 focus:ring-blue-500"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="On Hold">On Hold</option>
            <option value="Blacklisted">Blacklisted</option>
            <option value="Inactive">Inactive</option>
          </select>

          {(searchTerm || typeFilter !== 'All' || categoryFilter !== 'All' || gstTypeFilter !== 'All' || statusFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('All');
                setCategoryFilter('All');
                setGstTypeFilter('All');
                setStatusFilter('All');
              }}
              className="text-xs text-blue-600 hover:text-blue-800 underline ml-2"
            >
              Reset Filters
            </button>
          )}

          <div className="ml-auto text-xs text-slate-500 font-medium">
            Showing {filteredParties.length} of {parties.length} parties
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="py-3 px-4 font-semibold">Party Code & Name</th>
                <th className="py-3 px-3 font-semibold">Type & Category</th>
                <th className="py-3 px-3 font-semibold">GSTIN & Place of Supply</th>
                <th className="py-3 px-3 font-semibold">Credit Limit</th>
                <th className="py-3 px-4 font-semibold text-right">Current Balance</th>
                <th className="py-3 px-3 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredParties.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium">No parties found matching criteria</p>
                    <p className="text-xs text-slate-400 mt-1">Try clearing your filters or add a new party master record.</p>
                  </td>
                </tr>
              ) : (
                filteredParties.map((party) => {
                  const gstValid = party.gstin ? validateGSTIN(party.gstin) : null;
                  const isOverCredit =
                    party.creditLimit > 0 && party.currentBalance > party.creditLimit;

                  return (
                    <tr
                      key={party.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      onClick={() => onSelectParty(party)}
                    >
                      {/* Name & Contact */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                          {party.name}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">
                            {party.code}
                          </span>
                          <span>• {party.city}, {party.state}</span>
                          {party.phone && <span>• {party.phone}</span>}
                        </div>
                      </td>

                      {/* Type & Category */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col gap-1 items-start">
                          {getTypeBadge(party.type)}
                          <span className="text-xs text-slate-600 font-medium">
                            {party.category || 'General'}
                          </span>
                        </div>
                      </td>

                      {/* GSTIN & Place of Supply */}
                      <td className="py-3.5 px-3">
                        {party.gstin ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 font-mono text-xs text-slate-800">
                              <span>{party.gstin}</span>
                              {gstValid?.isValid ? (
                                <span className="text-[10px] px-1 py-0.2 bg-emerald-50 text-emerald-700 rounded border border-emerald-200" title="Valid GSTN Checksum">
                                  ✓ Valid
                                </span>
                              ) : (
                                <span className="text-[10px] px-1 py-0.2 bg-amber-50 text-amber-700 rounded border border-amber-200" title={gstValid?.error || 'Invalid format'}>
                                  ⚠ Check
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {party.placeOfSupply} ({party.gstType})
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Unregistered / Consumer</span>
                        )}
                      </td>

                      {/* Credit Limit */}
                      <td className="py-3.5 px-3">
                        <div className="text-xs text-slate-900 font-medium">
                          {party.creditLimit > 0 ? `₹${party.creditLimit.toLocaleString('en-IN')}` : 'No Limit'}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          Rule: <span className="font-medium text-slate-700">{party.creditLimitAction}</span>
                        </div>
                      </td>

                      {/* Current Balance */}
                      <td className="py-3.5 px-4 text-right">
                        <div
                          className={`font-semibold text-sm ${
                            party.currentBalance > 0
                              ? 'text-emerald-700'
                              : party.currentBalance < 0
                              ? 'text-amber-700'
                              : 'text-slate-600'
                          }`}
                        >
                          ₹{Math.abs(party.currentBalance).toLocaleString('en-IN')}{' '}
                          <span className="text-xs font-normal">
                            {party.currentBalance > 0 ? 'Dr (Rec)' : party.currentBalance < 0 ? 'Cr (Pay)' : 'Nil'}
                          </span>
                        </div>
                        {isOverCredit && (
                          <div className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-red-600 bg-red-50 px-1 py-0.2 rounded border border-red-200 mt-0.5">
                            <ShieldAlert className="w-2.5 h-2.5" /> Limit Exceeded
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center">{getStatusBadge(party.status)}</td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => onSelectParty(party)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors"
                            title="View Full Profile & Subledger"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditParty(party)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                            title="Edit Party Master"
                          >
                            <Edit2 className="w-4 h-4" />
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
      </div>
    </div>
  );
};
