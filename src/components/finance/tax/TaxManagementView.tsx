import React, { useState, useMemo } from 'react';
import {
  Percent,
  Plus,
  Search,
  Filter,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Building2,
  Layers,
  ArrowRight,
  ShieldCheck,
  Scale,
  Calendar,
  DollarSign,
  Receipt,
  X,
  Clock,
  Info,
  ExternalLink,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import {
  TaxMasterRecord,
  RcmSelfInvoiceRecord,
  TdsRecord,
  TdsEntryRecord,
  TaxType,
} from '../../../types/finance';
import {
  gstTaxEngine,
  validateGstinChecksum,
  detectSupplyType,
  calculateTaxBreakup,
} from '../../../services/finance/gstTaxEngine';
import { erpFinanceStorage, COMPANY_CONFIG } from '../../../services/finance/erpFinanceStorage';

export function TaxManagementView() {
  const [activeTab, setActiveTab] = useState<'masters' | 'gst-rcm' | 'tds-tcs' | 'reports'>('masters');
  const [reportSubTab, setReportSubTab] = useState<'purchase' | 'sales' | 'gstr3b' | 'tds'>('purchase');

  // Storage data
  const [taxMasters, setTaxMasters] = useState<TaxMasterRecord[]>(() => gstTaxEngine.getTaxMasters());
  const [tdsSections, setTdsSections] = useState<TdsRecord[]>(() => gstTaxEngine.getTdsSections());
  const [tdsEntries, setTdsEntries] = useState<TdsEntryRecord[]>(() => gstTaxEngine.getTdsEntries());
  const [rcmVouchers, setRcmVouchers] = useState<RcmSelfInvoiceRecord[]>(() => gstTaxEngine.getRcmVouchers());

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');

  // Modals
  const [isAddTaxModalOpen, setIsAddTaxModalOpen] = useState(false);
  const [isRcmModalOpen, setIsRcmModalOpen] = useState(false);
  const [isChallanModalOpen, setIsChallanModalOpen] = useState(false);
  const [selectedTdsEntry, setSelectedTdsEntry] = useState<TdsEntryRecord | null>(null);

  // New Tax Form State
  const [taxForm, setTaxForm] = useState({
    taxName: '',
    taxCode: '',
    rate: 18,
    cgst: 9,
    sgst: 9,
    igst: 18,
    cess: 0,
    taxType: 'Purchase Tax' as TaxType,
    effectiveDate: new Date().toISOString().split('T')[0],
    status: 'Active' as 'Active' | 'Inactive',
    isRcm: false,
    appliesTo: 'Both' as 'Goods' | 'Services' | 'Both',
    description: '',
  });

  // New RCM Form State
  const [rcmForm, setRcmForm] = useState({
    vendorName: '',
    vendorGstin: '',
    natureOfSupply: 'Legal Advisory Services',
    taxableAmount: 50000,
    ratePercent: 18,
    partyState: 'Kerala',
    partyStateCode: '32',
    notes: '',
  });

  // Challan Deposit Form State
  const [challanForm, setChallanForm] = useState({
    challanNumber: '',
    bsrCode: '0210045',
    depositDate: new Date().toISOString().split('T')[0],
    certificateNumber: '',
  });

  // Simulator State for Intra vs Inter
  const [simPartyState, setSimPartyState] = useState('Kerala');
  const [simPartyStateCode, setSimPartyStateCode] = useState('32');
  const [simAmount, setSimAmount] = useState(100000);
  const [simRate, setSimRate] = useState(18);
  const [simIsRcm, setSimIsRcm] = useState(false);
  const [simIsSez, setSimIsSez] = useState(false);
  const [simGstinInput, setSimGstinInput] = useState('32AABCC1234F1Z5');

  // Refresh data helper
  const reloadData = () => {
    setTaxMasters(gstTaxEngine.getTaxMasters());
    setTdsSections(gstTaxEngine.getTdsSections());
    setTdsEntries(gstTaxEngine.getTdsEntries());
    setRcmVouchers(gstTaxEngine.getRcmVouchers());
  };

  // Invoices from storage for reports
  const purchaseInvoices = useMemo(() => erpFinanceStorage.getPurchaseInvoices(), []);
  const salesInvoices = useMemo(() => erpFinanceStorage.getSalesInvoices(), []);

  // Compute Tax Executive Metrics
  const metrics = useMemo(() => {
    const totalOutwardGst = salesInvoices.reduce(
      (sum, inv) => sum + (inv.cgstTotal || 0) + (inv.sgstTotal || 0) + (inv.igstTotal || 0),
      0
    );
    const totalInwardItc = purchaseInvoices.reduce(
      (sum, inv) => sum + (inv.cgstTotal || 0) + (inv.sgstTotal || 0) + (inv.igstTotal || 0),
      0
    );
    const rcmLiability = rcmVouchers.reduce((sum, r) => sum + r.totalTaxAmount, 0);
    const netGstPayable = Math.max(0, totalOutwardGst + rcmLiability - totalInwardItc);
    const totalTdsDeducted = tdsEntries.reduce((sum, t) => sum + t.tdsAmount, 0);

    return {
      totalOutwardGst,
      totalInwardItc,
      rcmLiability,
      netGstPayable,
      totalTdsDeducted,
    };
  }, [purchaseInvoices, salesInvoices, rcmVouchers, tdsEntries]);

  // Filtered Tax Masters
  const filteredTaxMasters = useMemo(() => {
    return taxMasters.filter((t) => {
      const matchSearch =
        t.taxName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.taxCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = typeFilter === 'All' || t.taxType === typeFilter;
      return matchSearch && matchType;
    });
  }, [taxMasters, searchQuery, typeFilter]);

  // Handle Tax Form Rate Change to keep CGST + SGST & IGST in sync
  const handleRateChange = (newRate: number) => {
    setTaxForm((prev) => ({
      ...prev,
      rate: newRate,
      cgst: newRate / 2,
      sgst: newRate / 2,
      igst: newRate,
    }));
  };

  // Save new Tax Master
  const handleSaveTaxMaster = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taxForm.taxName || !taxForm.taxCode) return;

    gstTaxEngine.saveTaxMaster({
      taxName: taxForm.taxName,
      taxCode: taxForm.taxCode,
      rate: Number(taxForm.rate),
      cgst: Number(taxForm.cgst),
      sgst: Number(taxForm.sgst),
      igst: Number(taxForm.igst),
      cess: Number(taxForm.cess),
      taxType: taxForm.taxType,
      effectiveDate: taxForm.effectiveDate,
      status: taxForm.status,
      isRcm: taxForm.isRcm,
      appliesTo: taxForm.appliesTo,
      description: taxForm.description,
    });

    reloadData();
    setIsAddTaxModalOpen(false);
  };

  // Create RCM Self-Invoice
  const handleCreateRcmInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rcmForm.vendorName || !rcmForm.taxableAmount) return;

    gstTaxEngine.createRcmSelfInvoice({
      vendorName: rcmForm.vendorName,
      vendorGstin: rcmForm.vendorGstin,
      natureOfSupply: rcmForm.natureOfSupply,
      taxableAmount: Number(rcmForm.taxableAmount),
      ratePercent: Number(rcmForm.ratePercent),
      partyState: rcmForm.partyState,
      partyStateCode: rcmForm.partyStateCode,
      notes: rcmForm.notes,
    });

    reloadData();
    setIsRcmModalOpen(false);
  };

  // Update TDS Challan deposit
  const handleSaveChallan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTdsEntry) return;

    selectedTdsEntry.challanNumber = challanForm.challanNumber;
    selectedTdsEntry.bsrCode = challanForm.bsrCode;
    selectedTdsEntry.depositDate = challanForm.depositDate;
    if (challanForm.certificateNumber) {
      selectedTdsEntry.certificateIssued = true;
      selectedTdsEntry.certificateNumber = challanForm.certificateNumber;
    }

    reloadData();
    setIsChallanModalOpen(false);
    setSelectedTdsEntry(null);
  };

  // Simulated GST Calculation
  const simResult = useMemo(() => {
    return calculateTaxBreakup({
      amount: simAmount,
      taxRatePercent: simRate,
      partyState: simPartyState,
      partyStateCode: simPartyStateCode,
      isRcm: simIsRcm,
      isSez: simIsSez,
    });
  }, [simAmount, simRate, simPartyState, simPartyStateCode, simIsRcm, simIsSez]);

  // Validated GSTIN check
  const gstinValidationResult = useMemo(() => {
    return validateGstinChecksum(simGstinInput);
  }, [simGstinInput]);

  return (
    <div className="space-y-6" id="tax-management-view">
      {/* Executive Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-50 text-[#0B5D2A] rounded-lg">
                <Percent className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Tax & GST Compliance Management
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-[#0B5D2A] rounded-full border border-emerald-200">
                GSTIN: {COMPANY_CONFIG.gstin} (Kerala - 32)
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Tax Masters with CGST/SGST/IGST/CESS split, RCM self-invoicing, Mod-36 GSTIN verification, TDS Section 194 deduction, and statutory GSTR reports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="add-tax-master-btn"
              onClick={() => setIsAddTaxModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-white bg-[#0B5D2A] hover:bg-[#094c22] rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              New Tax Rate
            </button>
            <button
              id="generate-rcm-btn"
              onClick={() => setIsRcmModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-xs"
            >
              <Scale className="w-4 h-4 text-purple-600" />
              RCM Self-Invoice
            </button>
          </div>
        </div>

        {/* Executive Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80">
            <p className="text-xs font-medium text-slate-500">Net GST Payable (Cash)</p>
            <p className="text-lg font-bold text-slate-900 mt-1">
              ₹{metrics.netGstPayable.toLocaleString('en-IN')}
            </p>
            <span className="text-[11px] text-emerald-600 font-medium">Output − Eligible ITC + RCM</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80">
            <p className="text-xs font-medium text-slate-500">Outward Tax (Sales)</p>
            <p className="text-lg font-bold text-slate-900 mt-1">
              ₹{metrics.totalOutwardGst.toLocaleString('en-IN')}
            </p>
            <span className="text-[11px] text-slate-500">{salesInvoices.length} Sales Invoices</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80">
            <p className="text-xs font-medium text-slate-500">Input Tax Credit (ITC)</p>
            <p className="text-lg font-bold text-emerald-700 mt-1">
              ₹{metrics.totalInwardItc.toLocaleString('en-IN')}
            </p>
            <span className="text-[11px] text-emerald-600 font-medium">{purchaseInvoices.length} Inward Bills</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80">
            <p className="text-xs font-medium text-slate-500">RCM Liability (Sec 9(3))</p>
            <p className="text-lg font-bold text-purple-700 mt-1">
              ₹{metrics.rcmLiability.toLocaleString('en-IN')}
            </p>
            <span className="text-[11px] text-purple-600 font-medium">{rcmVouchers.length} Self-Invoices</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80">
            <p className="text-xs font-medium text-slate-500">TDS Payable (GL 2150)</p>
            <p className="text-lg font-bold text-amber-700 mt-1">
              ₹{metrics.totalTdsDeducted.toLocaleString('en-IN')}
            </p>
            <span className="text-[11px] text-amber-600 font-medium">Sec 194C/J/I Withheld</span>
          </div>
        </div>
      </div>

      {/* Primary Sub-Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-3 gap-6">
        <button
          id="tab-tax-masters"
          onClick={() => setActiveTab('masters')}
          className={`pb-3 text-sm font-semibold transition-all relative ${
            activeTab === 'masters'
              ? 'text-[#0B5D2A] border-b-2 border-[#0B5D2A]'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4" />
            <span>Tax Master & Rates</span>
            <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-700 rounded-full font-bold">
              {taxMasters.length}
            </span>
          </div>
        </button>

        <button
          id="tab-gst-rcm"
          onClick={() => setActiveTab('gst-rcm')}
          className={`pb-3 text-sm font-semibold transition-all relative ${
            activeTab === 'gst-rcm'
              ? 'text-[#0B5D2A] border-b-2 border-[#0B5D2A]'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4" />
            <span>GST Rules & RCM Center</span>
            <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full font-bold">
              Intra/Inter
            </span>
          </div>
        </button>

        <button
          id="tab-tds-tcs"
          onClick={() => setActiveTab('tds-tcs')}
          className={`pb-3 text-sm font-semibold transition-all relative ${
            activeTab === 'tds-tcs'
              ? 'text-[#0B5D2A] border-b-2 border-[#0B5D2A]'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span>TDS / TCS Management</span>
            <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded-full font-bold">
              Form 26Q
            </span>
          </div>
        </button>

        <button
          id="tab-tax-reports"
          onClick={() => setActiveTab('reports')}
          className={`pb-3 text-sm font-semibold transition-all relative ${
            activeTab === 'reports'
              ? 'text-[#0B5D2A] border-b-2 border-[#0B5D2A]'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>Tax Reports (GSTR-1, 2, 3B)</span>
          </div>
        </button>
      </div>

      {/* TAB 1: TAX MASTER */}
      {activeTab === 'masters' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="search-tax-input"
                type="text"
                placeholder="Search tax name, code, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0B5D2A]/20 focus:border-[#0B5D2A]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-medium text-slate-500">Tax Type:</span>
              <select
                id="filter-tax-type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-sm rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-[#0B5D2A]"
              >
                <option value="All">All Tax Types</option>
                <option value="Purchase Tax">Purchase Tax</option>
                <option value="Sales Tax">Sales Tax</option>
                <option value="Expense Tax">Expense Tax</option>
                <option value="Purchase Return Tax">Purchase Return Tax</option>
                <option value="Sales Return Tax">Sales Return Tax</option>
              </select>
            </div>
          </div>

          {/* Tax Rates Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm" id="tax-masters-table">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Tax Code / ID</th>
                    <th className="px-4 py-3">Tax Name</th>
                    <th className="px-4 py-3">Total Rate</th>
                    <th className="px-4 py-3">CGST / SGST Breakup</th>
                    <th className="px-4 py-3">IGST Rate</th>
                    <th className="px-4 py-3">CESS</th>
                    <th className="px-4 py-3">Tax Type</th>
                    <th className="px-4 py-3">RCM</th>
                    <th className="px-4 py-3">Effective Date</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {filteredTaxMasters.map((tax) => (
                    <tr key={tax.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-mono text-xs font-bold text-slate-900">{tax.taxCode}</div>
                        <div className="text-[11px] text-slate-400">{tax.id}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-900">{tax.taxName}</div>
                        {tax.description && (
                          <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{tax.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-800">
                          {tax.rate}%
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-xs font-medium text-slate-900">
                          CGST: <span className="font-bold text-emerald-700">{tax.cgst}%</span>
                        </div>
                        <div className="text-xs font-medium text-slate-900 mt-0.5">
                          SGST: <span className="font-bold text-blue-700">{tax.sgst}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-indigo-700 text-xs">{tax.igst}%</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-slate-600">{tax.cess}%</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border ${
                            tax.taxType === 'Sales Tax'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : tax.taxType === 'Purchase Tax'
                              ? 'bg-emerald-50 text-[#0B5D2A] border-emerald-200'
                              : tax.taxType === 'Expense Tax'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {tax.taxType}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {tax.isRcm ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold bg-purple-100 text-purple-800 rounded-md">
                            <Scale className="w-3 h-3" /> Yes
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600 font-mono">
                        {tax.effectiveDate || '2025-04-01'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            tax.status === 'Active'
                              ? 'bg-emerald-100 text-[#0B5D2A]'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {tax.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredTaxMasters.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center text-sm text-slate-500">
                        No tax masters found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GST RULES & RCM CENTER */}
      {activeTab === 'gst-rcm' && (
        <div className="space-y-6">
          {/* Intra vs Inter Interactive Simulator */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-[#0B5D2A]" />
                  Intra-State vs Inter-State Tax Detection Engine
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Evaluates Party Place of Supply / State Code against Casbiro Solutions Company State (Kerala, Code 32) to determine CGST + SGST vs IGST.
                </p>
              </div>
              <span className="text-xs font-mono font-bold bg-emerald-50 text-[#0B5D2A] px-2.5 py-1 rounded-md border border-emerald-200">
                Company: Kerala (32)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Party State / Place of Supply
                </label>
                <select
                  id="sim-party-state"
                  value={simPartyState}
                  onChange={(e) => {
                    setSimPartyState(e.target.value);
                    const map: Record<string, string> = {
                      Kerala: '32',
                      Maharashtra: '27',
                      Karnataka: '29',
                      'Tamil Nadu': '33',
                      Delhi: '07',
                      Telangana: '36',
                      Gujarat: '24',
                    };
                    setSimPartyStateCode(map[e.target.value] || '32');
                  }}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="Kerala">Kerala (32 - Intra-State)</option>
                  <option value="Maharashtra">Maharashtra (27 - Inter-State)</option>
                  <option value="Karnataka">Karnataka (29 - Inter-State)</option>
                  <option value="Tamil Nadu">Tamil Nadu (33 - Inter-State)</option>
                  <option value="Delhi">Delhi (07 - Inter-State)</option>
                  <option value="Telangana">Telangana (36 - Inter-State)</option>
                  <option value="Gujarat">Gujarat (24 - Inter-State)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Taxable Base (₹)</label>
                <input
                  id="sim-amount"
                  type="number"
                  value={simAmount}
                  onChange={(e) => setSimAmount(Number(e.target.value))}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tax Rate (%)</label>
                <select
                  id="sim-rate"
                  value={simRate}
                  onChange={(e) => setSimRate(Number(e.target.value))}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value={18}>18% (Standard Rate)</option>
                  <option value={12}>12% (IT Hardware)</option>
                  <option value={5}>5% (Essential Printables)</option>
                  <option value={28}>28% (Luxury & Heavy)</option>
                  <option value={0}>0% (Exempt)</option>
                </select>
              </div>

              <div className="flex items-center gap-4 pt-6">
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={simIsRcm}
                    onChange={(e) => setSimIsRcm(e.target.checked)}
                    className="rounded text-[#0B5D2A] focus:ring-[#0B5D2A]"
                  />
                  <span>RCM Applicable</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={simIsSez}
                    onChange={(e) => setSimIsSez(e.target.checked)}
                    className="rounded text-[#0B5D2A] focus:ring-[#0B5D2A]"
                  />
                  <span>SEZ Zero-Rated</span>
                </label>
              </div>
            </div>

            {/* Simulation Result Banner */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                      simResult.isIntraState
                        ? 'bg-emerald-100 text-[#0B5D2A]'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {simResult.isIntraState ? 'INTRA-STATE SUPPLY' : 'INTER-STATE SUPPLY'}
                  </span>
                  {simIsRcm && (
                    <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-purple-100 text-purple-800">
                      REVERSE CHARGE MECHANISM
                    </span>
                  )}
                  {simIsSez && (
                    <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800">
                      SEZ UNIT (0% LUT)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1.5">
                  {simResult.isIntraState
                    ? 'Place of supply is within Kerala (32). Splitting equally into CGST and SGST.'
                    : 'Place of supply is outside Kerala. Levying full Integrated Goods and Services Tax (IGST).'}
                </p>
              </div>

              <div className="flex items-center gap-6 font-mono text-sm">
                <div>
                  <span className="text-xs text-slate-500 block font-sans">CGST ({simResult.cgstRate}%)</span>
                  <span className="font-bold text-slate-900">₹{simResult.cgstAmount.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block font-sans">SGST ({simResult.sgstRate}%)</span>
                  <span className="font-bold text-slate-900">₹{simResult.sgstAmount.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block font-sans">IGST ({simResult.igstRate}%)</span>
                  <span className="font-bold text-slate-900">₹{simResult.igstAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="pl-4 border-l border-slate-300">
                  <span className="text-xs text-slate-500 block font-sans">Grand Total</span>
                  <span className="font-extrabold text-[#0B5D2A] text-base">
                    ₹{simResult.grandTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mod-36 Checksum Verification Tool */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#0B5D2A]" />
              GSTIN Checksum Validator (Mod-36 Algorithm)
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Validates the 15-character Indian GST identification number according to the official GST Council Luhn Mod-36 specification.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                id="gstin-validator-input"
                type="text"
                maxLength={15}
                value={simGstinInput}
                onChange={(e) => setSimGstinInput(e.target.value.toUpperCase())}
                placeholder="Enter 15-digit GSTIN (e.g. 32AABCC1234F1Z5)"
                className="w-full sm:w-96 text-sm font-mono tracking-wider px-3.5 py-2 rounded-lg border border-slate-300 uppercase"
              />

              <div className="flex items-center gap-2">
                {gstinValidationResult.isValid ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-[#0B5D2A] border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4" /> Valid Mod-36 GSTIN (State: {gstinValidationResult.stateCode}, PAN: {gstinValidationResult.pan})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    <AlertTriangle className="w-4 h-4" /> {gstinValidationResult.error || 'Invalid GSTIN'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Reverse Charge Mechanism (RCM) Self-Invoices */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-purple-600" />
                  RCM Self-Invoicing Register (Section 9(3) / 9(4))
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Recipient is liable to pay tax to the government on inward supplies from advocates, GTA, director sitting fees, and unregistered contractors.
                </p>
              </div>

              <button
                id="new-rcm-self-inv-btn"
                onClick={() => setIsRcmModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Issue Self-Invoice
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm" id="rcm-vouchers-table">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Voucher #</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Vendor / Service Provider</th>
                    <th className="px-4 py-3">Nature of Supply</th>
                    <th className="px-4 py-3">Taxable Value</th>
                    <th className="px-4 py-3">CGST + SGST / IGST</th>
                    <th className="px-4 py-3">RCM Tax Liability</th>
                    <th className="px-4 py-3">ITC Claimed</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {rcmVouchers.map((rcm) => (
                    <tr key={rcm.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-mono font-bold text-xs text-purple-900">
                        {rcm.voucherNumber}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 font-mono">{rcm.date}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{rcm.vendorName}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{rcm.natureOfSupply}</td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold">
                        ₹{rcm.taxableAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono">
                        {rcm.igstAmount > 0 ? (
                          <span>IGST: ₹{rcm.igstAmount.toLocaleString('en-IN')}</span>
                        ) : (
                          <span>₹{rcm.cgstAmount} + ₹{rcm.sgstAmount}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-purple-700">
                        ₹{rcm.totalTaxAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Eligible ITC
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-0.5 text-xs font-bold rounded-full bg-purple-100 text-purple-800">
                          {rcm.status}
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

      {/* TAB 3: TDS / TCS MANAGEMENT */}
      {activeTab === 'tds-tcs' && (
        <div className="space-y-6">
          {/* TDS Sections Reference */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-700" />
              Statutory TDS & TCS Sections (Indian Income Tax Act)
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Automated withholding on payments to vendors, contractors, landlords, and technical professionals.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {tdsSections.map((sec) => (
                <div key={sec.id} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-amber-900 px-2 py-0.5 bg-amber-100 rounded-md">
                      Section {sec.section}
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {sec.rateIndividual}% / {sec.rateCompany}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2">{sec.description}</p>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Threshold: <span className="font-semibold text-slate-700">₹{sec.thresholdLimit.toLocaleString('en-IN')}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Form 26Q TDS Deductions Register */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Form 26Q Quarterly Return Register
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Summary of tax deducted at source from vendor disbursements and statutory challan deposits.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Quarter: Q1 (Apr-Jun)</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm" id="tds-entries-table">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Payment #</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Vendor Name / PAN</th>
                    <th className="px-4 py-3">Section</th>
                    <th className="px-4 py-3">Gross Billed</th>
                    <th className="px-4 py-3">TDS Rate</th>
                    <th className="px-4 py-3">TDS Deducted</th>
                    <th className="px-4 py-3">Net Disbursed</th>
                    <th className="px-4 py-3">Challan / BSR</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {tdsEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-slate-900">
                        {entry.paymentNumber}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 font-mono">{entry.date}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{entry.vendorName}</div>
                        <div className="text-xs font-mono text-slate-500">PAN: {entry.vendorPan}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md">
                          {entry.section}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold">
                        ₹{entry.grossAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-800">{entry.tdsRate}%</td>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-amber-700">
                        ₹{entry.tdsAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900">
                        ₹{entry.netPaidAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {entry.challanNumber ? (
                          <div>
                            <span className="font-mono font-semibold text-emerald-700">
                              {entry.challanNumber}
                            </span>
                            <div className="text-[11px] text-slate-500 font-mono">BSR: {entry.bsrCode}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-amber-600 font-semibold">Pending Deposit</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            setSelectedTdsEntry(entry);
                            setChallanForm({
                              challanNumber: entry.challanNumber || `CHL-${Date.now().toString().slice(-6)}`,
                              bsrCode: entry.bsrCode || '0210045',
                              depositDate: entry.depositDate || new Date().toISOString().split('T')[0],
                              certificateNumber: entry.certificateNumber || '',
                            });
                            setIsChallanModalOpen(true);
                          }}
                          className="text-xs font-semibold text-[#0B5D2A] hover:underline"
                        >
                          {entry.challanNumber ? 'Update Challan' : 'Record Deposit'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TAX REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Reports Subnav */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
            <button
              onClick={() => setReportSubTab('purchase')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                reportSubTab === 'purchase'
                  ? 'bg-[#0B5D2A] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Purchase Tax Report (GSTR-2 ITC)
            </button>
            <button
              onClick={() => setReportSubTab('sales')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                reportSubTab === 'sales'
                  ? 'bg-[#0B5D2A] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Sales Tax Report (GSTR-1 Outward)
            </button>
            <button
              onClick={() => setReportSubTab('gstr3b')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                reportSubTab === 'gstr3b'
                  ? 'bg-[#0B5D2A] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              GST Summary (GSTR-3B Return)
            </button>
            <button
              onClick={() => setReportSubTab('tds')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                reportSubTab === 'tds'
                  ? 'bg-[#0B5D2A] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              TDS / TCS Compliance Report
            </button>
          </div>

          {/* 1. Purchase Tax Report */}
          {reportSubTab === 'purchase' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Purchase Tax & Inward ITC Register</h3>
                  <p className="text-xs text-slate-500">
                    Input Tax Credit breakdown across vendor purchases and supplier invoices.
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-600">
                  Total Eligible ITC: ₹{metrics.totalInwardItc.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm" id="purchase-tax-report-table">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Invoice #</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Vendor Name</th>
                      <th className="px-4 py-3">Taxable Value</th>
                      <th className="px-4 py-3">CGST</th>
                      <th className="px-4 py-3">SGST</th>
                      <th className="px-4 py-3">IGST</th>
                      <th className="px-4 py-3">Total Tax</th>
                      <th className="px-4 py-3">RCM</th>
                      <th className="px-4 py-3">Grand Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    {purchaseInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-mono font-bold text-xs text-slate-900">
                          {inv.invoiceNumber}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 font-mono">{inv.date}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{inv.vendorName}</td>
                        <td className="px-4 py-3 font-mono text-xs">
                          ₹{inv.subtotal.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-emerald-700">
                          ₹{(inv.cgstTotal || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-blue-700">
                          ₹{(inv.sgstTotal || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-indigo-700">
                          ₹{(inv.igstTotal || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs font-bold text-slate-900">
                          ₹{((inv.cgstTotal || 0) + (inv.sgstTotal || 0) + (inv.igstTotal || 0)).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {inv.isReverseCharge ? (
                            <span className="font-bold text-purple-700">Yes</span>
                          ) : (
                            <span className="text-slate-400">No</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs font-bold text-[#0B5D2A]">
                          ₹{inv.grandTotal.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. Sales Tax Report */}
          {reportSubTab === 'sales' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Sales Tax & Outward Supplies Register (GSTR-1)</h3>
                  <p className="text-xs text-slate-500">
                    B2B and B2C outward taxable turnover with e-Invoice IRN & e-Way Bill tracking.
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-600">
                  Total Tax Collected: ₹{metrics.totalOutwardGst.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm" id="sales-tax-report-table">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Invoice #</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Customer Name</th>
                      <th className="px-4 py-3">Taxable Value</th>
                      <th className="px-4 py-3">CGST</th>
                      <th className="px-4 py-3">SGST</th>
                      <th className="px-4 py-3">IGST</th>
                      <th className="px-4 py-3">Total Tax</th>
                      <th className="px-4 py-3">e-Invoice IRN</th>
                      <th className="px-4 py-3">e-Way Bill</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    {salesInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-mono font-bold text-xs text-slate-900">
                          {inv.invoiceNumber}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 font-mono">{inv.date}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{inv.customerName}</td>
                        <td className="px-4 py-3 font-mono text-xs">
                          ₹{inv.subtotal.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-emerald-700">
                          ₹{(inv.cgstTotal || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-blue-700">
                          ₹{(inv.sgstTotal || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-indigo-700">
                          ₹{(inv.igstTotal || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs font-bold text-slate-900">
                          ₹{((inv.cgstTotal || 0) + (inv.sgstTotal || 0) + (inv.igstTotal || 0)).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                          {inv.eInvoiceIrn || 'N/A'}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                          {inv.eWayBillNo || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. GSTR-3B Summary */}
          {reportSubTab === 'gstr3b' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">GSTR-3B Statutory Summary Table</h3>
                <p className="text-xs text-slate-500">
                  Government-format monthly self-declaration return of outward supplies and input tax credit claimed.
                </p>
              </div>

              {/* Table 3.1: Outward Supplies */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-4 py-2.5 font-bold text-xs text-slate-800 border-b border-slate-200">
                  3.1 Details of Outward Supplies and Inward Supplies Liable to Reverse Charge
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold">
                    <tr>
                      <th className="px-4 py-2">Nature of Supplies</th>
                      <th className="px-4 py-2">Total Taxable Value</th>
                      <th className="px-4 py-2">Integrated Tax (IGST)</th>
                      <th className="px-4 py-2">Central Tax (CGST)</th>
                      <th className="px-4 py-2">State Tax (SGST)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    <tr>
                      <td className="px-4 py-2.5 font-sans font-medium text-slate-800">
                        (a) Outward taxable supplies (other than zero rated, nil rated and exempted)
                      </td>
                      <td className="px-4 py-2.5">
                        ₹{salesInvoices.reduce((s, i) => s + i.subtotal, 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-2.5">
                        ₹{salesInvoices.reduce((s, i) => s + (i.igstTotal || 0), 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-2.5">
                        ₹{salesInvoices.reduce((s, i) => s + (i.cgstTotal || 0), 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-2.5">
                        ₹{salesInvoices.reduce((s, i) => s + (i.sgstTotal || 0), 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 font-sans font-medium text-slate-800">
                        (d) Inward supplies liable to reverse charge (Section 9(3))
                      </td>
                      <td className="px-4 py-2.5">
                        ₹{rcmVouchers.reduce((s, r) => s + r.taxableAmount, 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-2.5">
                        ₹{rcmVouchers.reduce((s, r) => s + r.igstAmount, 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-2.5">
                        ₹{rcmVouchers.reduce((s, r) => s + r.cgstAmount, 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-2.5">
                        ₹{rcmVouchers.reduce((s, r) => s + r.sgstAmount, 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Table 4: Eligible ITC */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-4 py-2.5 font-bold text-xs text-slate-800 border-b border-slate-200">
                  4. Eligible Input Tax Credit (ITC)
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold">
                    <tr>
                      <th className="px-4 py-2">Details</th>
                      <th className="px-4 py-2">Integrated Tax</th>
                      <th className="px-4 py-2">Central Tax</th>
                      <th className="px-4 py-2">State Tax</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    <tr>
                      <td className="px-4 py-2.5 font-sans font-medium text-slate-800">
                        (A)(3) Inward supplies liable to reverse charge
                      </td>
                      <td className="px-4 py-2.5">
                        ₹{rcmVouchers.reduce((s, r) => s + r.igstAmount, 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-2.5">
                        ₹{rcmVouchers.reduce((s, r) => s + r.cgstAmount, 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-2.5">
                        ₹{rcmVouchers.reduce((s, r) => s + r.sgstAmount, 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 font-sans font-medium text-slate-800">
                        (A)(5) All other Input Tax Credit (Regular Vendors)
                      </td>
                      <td className="px-4 py-2.5">
                        ₹{purchaseInvoices.reduce((s, i) => s + (i.igstTotal || 0), 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-2.5">
                        ₹{purchaseInvoices.reduce((s, i) => s + (i.cgstTotal || 0), 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-2.5">
                        ₹{purchaseInvoices.reduce((s, i) => s + (i.sgstTotal || 0), 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr className="bg-emerald-50/60 font-bold text-emerald-950">
                      <td className="px-4 py-2.5 font-sans">
                        (C) Net ITC Available (A − B)
                      </td>
                      <td className="px-4 py-2.5">
                        ₹{(purchaseInvoices.reduce((s, i) => s + (i.igstTotal || 0), 0) + rcmVouchers.reduce((s, r) => s + r.igstAmount, 0)).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-2.5">
                        ₹{(purchaseInvoices.reduce((s, i) => s + (i.cgstTotal || 0), 0) + rcmVouchers.reduce((s, r) => s + r.cgstAmount, 0)).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-2.5">
                        ₹{(purchaseInvoices.reduce((s, i) => s + (i.sgstTotal || 0), 0) + rcmVouchers.reduce((s, r) => s + r.sgstAmount, 0)).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. TDS Compliance Report */}
          {reportSubTab === 'tds' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">TDS / TCS Withholding Tax Register</h3>
                  <p className="text-xs text-slate-500">
                    Deductions under Section 194C, 194J, 194I and statutory challan details.
                  </p>
                </div>
                <span className="text-xs font-semibold text-amber-800">
                  Total Tax Withheld: ₹{metrics.totalTdsDeducted.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Payment #</th>
                      <th className="px-4 py-3">Vendor / Deductee</th>
                      <th className="px-4 py-3">PAN</th>
                      <th className="px-4 py-3">Section</th>
                      <th className="px-4 py-3">Gross Amount</th>
                      <th className="px-4 py-3">TDS Rate</th>
                      <th className="px-4 py-3">TDS Amount</th>
                      <th className="px-4 py-3">Challan Ref</th>
                      <th className="px-4 py-3">Certificate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700 font-mono text-xs">
                    {tdsEntries.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-bold text-slate-900">{t.paymentNumber}</td>
                        <td className="px-4 py-3 font-sans font-medium text-slate-900">{t.vendorName}</td>
                        <td className="px-4 py-3">{t.vendorPan}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded font-bold">
                            {t.section}
                          </span>
                        </td>
                        <td className="px-4 py-3">₹{t.grossAmount.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 font-bold">{t.tdsRate}%</td>
                        <td className="px-4 py-3 font-bold text-amber-700">₹{t.tdsAmount.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 font-sans">
                          {t.challanNumber ? (
                            <span className="text-emerald-700 font-semibold">{t.challanNumber}</span>
                          ) : (
                            <span className="text-amber-600 font-semibold">Pending</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-sans">
                          {t.certificateIssued ? (
                            <span className="text-emerald-700 font-semibold">Form 16A Issued</span>
                          ) : (
                            <span className="text-slate-400">Not Issued</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD TAX MASTER */}
      {isAddTaxModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#0B5D2A]" />
                Create Tax Master Rate
              </h3>
              <button
                onClick={() => setIsAddTaxModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTaxMaster} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tax Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GST-18"
                    value={taxForm.taxCode}
                    onChange={(e) => setTaxForm({ ...taxForm, taxCode: e.target.value.toUpperCase() })}
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tax Type</label>
                  <select
                    value={taxForm.taxType}
                    onChange={(e) => setTaxForm({ ...taxForm, taxType: e.target.value as TaxType })}
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2"
                  >
                    <option value="Purchase Tax">Purchase Tax</option>
                    <option value="Sales Tax">Sales Tax</option>
                    <option value="Expense Tax">Expense Tax</option>
                    <option value="Purchase Return Tax">Purchase Return Tax</option>
                    <option value="Sales Return Tax">Sales Return Tax</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tax Name / Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GST 18% (Standard IT & Consulting)"
                  value={taxForm.taxName}
                  onChange={(e) => setTaxForm({ ...taxForm, taxName: e.target.value })}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              {/* Breakup Inputs */}
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs font-bold text-slate-800 block mb-2">
                  Tax Breakup (CGST / SGST / IGST / CESS)
                </span>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Total %</label>
                    <input
                      type="number"
                      step="0.1"
                      value={taxForm.rate}
                      onChange={(e) => handleRateChange(Number(e.target.value))}
                      className="w-full text-xs font-mono font-bold rounded border border-slate-300 px-2 py-1.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-0.5">CGST %</label>
                    <input
                      type="number"
                      step="0.1"
                      value={taxForm.cgst}
                      onChange={(e) => setTaxForm({ ...taxForm, cgst: Number(e.target.value) })}
                      className="w-full text-xs font-mono rounded border border-slate-300 px-2 py-1.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-0.5">SGST %</label>
                    <input
                      type="number"
                      step="0.1"
                      value={taxForm.sgst}
                      onChange={(e) => setTaxForm({ ...taxForm, sgst: Number(e.target.value) })}
                      className="w-full text-xs font-mono rounded border border-slate-300 px-2 py-1.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-0.5">IGST %</label>
                    <input
                      type="number"
                      step="0.1"
                      value={taxForm.igst}
                      onChange={(e) => setTaxForm({ ...taxForm, igst: Number(e.target.value) })}
                      className="w-full text-xs font-mono rounded border border-slate-300 px-2 py-1.5"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Effective Date</label>
                  <input
                    type="date"
                    value={taxForm.effectiveDate}
                    onChange={(e) => setTaxForm({ ...taxForm, effectiveDate: e.target.value })}
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
                <div className="flex items-center gap-4 pt-6">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={taxForm.isRcm}
                      onChange={(e) => setTaxForm({ ...taxForm, isRcm: e.target.checked })}
                      className="rounded text-[#0B5D2A] focus:ring-[#0B5D2A]"
                    />
                    <span>Reverse Charge (RCM)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddTaxModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0B5D2A] hover:bg-[#094c22] rounded-lg shadow-xs"
                >
                  Save Tax Rate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE RCM SELF-INVOICE */}
      {isRcmModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Scale className="w-5 h-5 text-purple-700" />
                Issue RCM Self-Invoice (Section 9(3))
              </h3>
              <button onClick={() => setIsRcmModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRcmInvoice} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vendor / Service Provider
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Advocate V. K. Nambiar & Associates"
                  value={rcmForm.vendorName}
                  onChange={(e) => setRcmForm({ ...rcmForm, vendorName: e.target.value })}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nature of Supply (RCM Category)
                </label>
                <select
                  value={rcmForm.natureOfSupply}
                  onChange={(e) => setRcmForm({ ...rcmForm, natureOfSupply: e.target.value })}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="Legal Advisory & Corporate Advocacy">Legal Advisory & Corporate Advocacy</option>
                  <option value="Goods Transport Agency (GTA) Freight">Goods Transport Agency (GTA) Freight</option>
                  <option value="Director Board Meeting Sitting Fees">Director Board Meeting Sitting Fees</option>
                  <option value="Security & Facility Services">Security & Facility Services</option>
                  <option value="Import of Services from Foreign Vendor">Import of Services from Foreign Vendor</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Taxable Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={rcmForm.taxableAmount}
                    onChange={(e) => setRcmForm({ ...rcmForm, taxableAmount: Number(e.target.value) })}
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tax Rate (%)</label>
                  <select
                    value={rcmForm.ratePercent}
                    onChange={(e) => setRcmForm({ ...rcmForm, ratePercent: Number(e.target.value) })}
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2"
                  >
                    <option value={18}>18% (Standard Legal/Director)</option>
                    <option value={5}>5% (GTA Freight)</option>
                    <option value={12}>12% (Specified Services)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Narration / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Notes for accounting journal voucher and self-invoice registry..."
                  value={rcmForm.notes}
                  onChange={(e) => setRcmForm({ ...rcmForm, notes: e.target.value })}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div className="p-3 bg-purple-50 rounded-lg text-xs text-purple-900">
                <strong>Accounting Rule:</strong> Automatically posts Dr. Input Tax Credit (GL 1315) and Cr. GST Output Liability RCM (GL 2160).
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRcmModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-xs"
                >
                  Issue Self-Invoice & Post GL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECORD TDS CHALLAN DEPOSIT */}
      {isChallanModalOpen && selectedTdsEntry && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-700" />
                Record TDS Challan Deposit
              </h3>
              <button onClick={() => setIsChallanModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveChallan} className="space-y-4 text-sm">
              <div className="p-3 bg-slate-50 rounded-lg text-xs">
                <p><strong>Vendor:</strong> {selectedTdsEntry.vendorName}</p>
                <p><strong>TDS Deducted:</strong> ₹{selectedTdsEntry.tdsAmount.toLocaleString('en-IN')} ({selectedTdsEntry.section})</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Challan Number / CIN</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CHL-008912"
                  value={challanForm.challanNumber}
                  onChange={(e) => setChallanForm({ ...challanForm, challanNumber: e.target.value })}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">BSR Code</label>
                  <input
                    type="text"
                    required
                    value={challanForm.bsrCode}
                    onChange={(e) => setChallanForm({ ...challanForm, bsrCode: e.target.value })}
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Deposit Date</label>
                  <input
                    type="date"
                    required
                    value={challanForm.depositDate}
                    onChange={(e) => setChallanForm({ ...challanForm, depositDate: e.target.value })}
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Form 16A Certificate # (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. TDS-CERT-2026-Q1-042"
                  value={challanForm.certificateNumber}
                  onChange={(e) => setChallanForm({ ...challanForm, certificateNumber: e.target.value })}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsChallanModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-xs"
                >
                  Save Challan Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
