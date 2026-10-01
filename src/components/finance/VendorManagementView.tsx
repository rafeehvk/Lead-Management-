import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Receipt,
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Download,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  Landmark,
  FileText,
  Calendar,
  X,
  CreditCard,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Tag,
  Briefcase,
  Layers,
  ArrowDownRight,
  Check,
  MoreVertical,
  Users,
} from 'lucide-react';
import {
  Vendor,
  VendorInvoice,
  VendorPaymentRecord,
  VendorSummaryMetrics,
  PaymentMode,
  ExpenseCategory,
} from '../../types/finance';
import { financeStorage } from '../../services/financeStorageService';
import { VendorSpendBudgetContributionView } from './VendorSpendBudgetContributionView';
import { VendorSupplierLedgerView } from './VendorSupplierLedgerView';

interface VendorManagementViewProps {
  currentUserName?: string;
  userRole?: string;
  initialVendorId?: string;
  onNavigateTab?: (tab: string) => void;
}

export const VendorManagementView: React.FC<VendorManagementViewProps> = ({
  currentUserName = 'Finance Administrator',
  userRole = 'Admin',
  initialVendorId,
  onNavigateTab,
}) => {
  // State
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [invoices, setInvoices] = useState<VendorInvoice[]>([]);
  const [payments, setPayments] = useState<VendorPaymentRecord[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [metrics, setMetrics] = useState<VendorSummaryMetrics | null>(null);

  // Active view tab inside vendor management
  const [activeView, setActiveView] = useState<'directory' | 'contribution' | 'pending' | 'ledger'>('directory');
  const [selectedLedgerVendorId, setSelectedLedgerVendorId] = useState<string>(initialVendorId || '');

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [pendingFilter, setPendingFilter] = useState<'all' | 'overdue' | 'dueSoon' | 'partial'>('all');

  // Modals
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [isAddInvoiceOpen, setIsAddInvoiceOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<VendorInvoice | null>(null);
  const [selectedVendorDetail, setSelectedVendorDetail] = useState<Vendor | null>(null);

  // Notifications / Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Form states
  const [newVendorForm, setNewVendorForm] = useState({
    name: '',
    legalName: '',
    code: '',
    categoryId: 'CAT-02',
    categoryName: 'Campus IT & Cloud Infrastructure',
    department: 'IT & Tech',
    contactPerson: '',
    email: '',
    phone: '',
    gstin: '',
    pan: '',
    address: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    paymentTerms: 'Net 30' as 'Immediate' | 'Net 15' | 'Net 30' | 'Net 45' | 'Net 60',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branch: '',
    beneficiaryName: '',
    notes: '',
  });

  const [newInvoiceForm, setNewInvoiceForm] = useState({
    vendorId: '',
    invoiceNumber: '',
    purchaseOrderRef: '',
    description: '',
    invoiceDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    amount: '',
    taxAmount: '',
    paidAmount: '0',
    notes: '',
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMode: 'NEFT/RTGS' as PaymentMode,
    referenceNumber: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    approvedBy: currentUserName,
    notes: '',
    recordInExpenseLedger: true,
  });

  // Load Data
  const loadData = () => {
    const vList = financeStorage.getVendors();
    const invList = financeStorage.getVendorInvoices();
    const payList = financeStorage.getVendorPayments();
    const catList = financeStorage.getCategories();
    const met = financeStorage.getVendorSummaryMetrics();

    setVendors(vList);
    setInvoices(invList);
    setPayments(payList);
    setCategories(catList);
    setMetrics(met);
  };

  useEffect(() => {
    loadData();

    const handleDataChange = () => {
      loadData();
    };

    window.addEventListener('mysar_finance_data_changed', handleDataChange);
    return () => {
      window.removeEventListener('mysar_finance_data_changed', handleDataChange);
    };
  }, []);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Formatters
  const formatINR = (val: number): string => `₹${val.toLocaleString('en-IN')}`;

  const formatCompactINR = (val: number): string => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Calculate days remaining or overdue
  const getDueStatus = (dueDate: string, status: string) => {
    if (status === 'Paid') {
      return { label: 'Settled', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    }
    const dueTime = new Date(dueDate).getTime();
    const nowTime = new Date(todayStr).getTime();
    const diffDays = Math.round((dueTime - nowTime) / (1000 * 3600 * 24));

    if (diffDays < 0) {
      return {
        label: `${Math.abs(diffDays)}d overdue`,
        color: 'text-rose-700 bg-rose-50 border-rose-200 font-bold',
      };
    } else if (diffDays === 0) {
      return {
        label: 'Due Today',
        color: 'text-amber-800 bg-amber-100 border-amber-300 font-bold',
      };
    } else if (diffDays <= 7) {
      return {
        label: `Due in ${diffDays}d`,
        color: 'text-amber-700 bg-amber-50 border-amber-200 font-medium',
      };
    } else {
      return {
        label: `Due in ${diffDays}d`,
        color: 'text-slate-600 bg-slate-100 border-slate-200',
      };
    }
  };

  // Filtered Vendors
  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const matchesSearch =
        searchQuery === '' ||
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.gstin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.categoryName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'All' || v.categoryName === selectedCategory;
      const matchesStatus = selectedStatus === 'All' || v.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [vendors, searchQuery, selectedCategory, selectedStatus]);

  // Filtered Invoices (Pending / Payables Pipeline)
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        searchQuery === '' ||
        inv.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.categoryName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'All' || inv.categoryName === selectedCategory;

      if (!matchesSearch || !matchesCategory) return false;

      if (pendingFilter === 'overdue') {
        return inv.status === 'Overdue' || (inv.pendingAmount > 0 && inv.dueDate < todayStr);
      }
      if (pendingFilter === 'dueSoon') {
        if (inv.pendingAmount <= 0) return false;
        const dueTime = new Date(inv.dueDate).getTime();
        const nowTime = new Date(todayStr).getTime();
        const diffDays = (dueTime - nowTime) / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays <= 7;
      }
      if (pendingFilter === 'partial') {
        return inv.status === 'Partially Paid';
      }
      return true;
    });
  }, [invoices, searchQuery, selectedCategory, pendingFilter, todayStr]);

  // Filtered Payments / Ledger
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchesSearch =
        searchQuery === '' ||
        p.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.categoryName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'All' || p.categoryName === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [payments, searchQuery, selectedCategory]);

  // Vendor Category Pending Balances Breakdown
  const categoryPendingBreakdown = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    invoices.forEach((inv) => {
      if (inv.pendingAmount > 0 && inv.status !== 'Cancelled') {
        if (!map[inv.categoryName]) {
          map[inv.categoryName] = { count: 0, total: 0 };
        }
        map[inv.categoryName].count++;
        map[inv.categoryName].total += inv.pendingAmount;
      }
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [invoices]);

  // Vendor Spend & Budget Contribution Map for Quick Supplier Directory Footprint
  const vendorContributionsMap = useMemo(() => {
    try {
      const analysis = financeStorage.getVendorSpendBudgetContributionAnalysis({ timeframe: 'Monthly', month: 'Sep' });
      const map = new Map<string, typeof analysis.vendorContributions[0]>();
      analysis.vendorContributions.forEach((v) => map.set(v.vendorId, v));
      return map;
    } catch {
      return new Map<string, any>();
    }
  }, [vendors, invoices, payments]);

  // Handle Add Vendor Submit
  const handleAddVendorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorForm.name.trim() || !newVendorForm.contactPerson.trim()) {
      showToast('Supplier Name and Contact Person are required.', 'error');
      return;
    }

    const selectedCat = categories.find((c) => c.name === newVendorForm.categoryName);

    const created = financeStorage.addVendor({
      name: newVendorForm.name.trim(),
      legalName: newVendorForm.legalName.trim() || newVendorForm.name.trim(),
      code:
        newVendorForm.code.trim().toUpperCase() ||
        newVendorForm.name.substring(0, 4).toUpperCase() + '-01',
      categoryId: selectedCat?.id || 'CAT-02',
      categoryName: newVendorForm.categoryName,
      department: newVendorForm.department,
      contactPerson: newVendorForm.contactPerson.trim(),
      email: newVendorForm.email.trim(),
      phone: newVendorForm.phone.trim(),
      gstin: newVendorForm.gstin.trim(),
      pan: newVendorForm.pan.trim(),
      address: newVendorForm.address.trim(),
      city: newVendorForm.city.trim(),
      state: newVendorForm.state.trim(),
      paymentTerms: newVendorForm.paymentTerms,
      status: 'Active',
      rating: 5,
      notes: newVendorForm.notes.trim(),
      bankDetails:
        newVendorForm.accountNumber.trim() && newVendorForm.ifscCode.trim()
          ? {
              bankName: newVendorForm.bankName.trim() || 'HDFC Bank',
              accountNumber: newVendorForm.accountNumber.trim(),
              ifscCode: newVendorForm.ifscCode.trim().toUpperCase(),
              branch: newVendorForm.branch.trim() || 'Main Branch',
              beneficiaryName:
                newVendorForm.beneficiaryName.trim() || newVendorForm.legalName || newVendorForm.name,
            }
          : undefined,
    });

    setIsAddVendorOpen(false);
    showToast(`Supplier ${created.name} (${created.code}) successfully onboarded!`, 'success');
    loadData();

    // Reset Form
    setNewVendorForm({
      name: '',
      legalName: '',
      code: '',
      categoryId: 'CAT-02',
      categoryName: 'Campus IT & Cloud Infrastructure',
      department: 'IT & Tech',
      contactPerson: '',
      email: '',
      phone: '',
      gstin: '',
      pan: '',
      address: '',
      city: 'Bengaluru',
      state: 'Karnataka',
      paymentTerms: 'Net 30',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      branch: '',
      beneficiaryName: '',
      notes: '',
    });
  };

  // Handle Add Invoice Submit
  const handleAddInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vendor = vendors.find((v) => v.id === newInvoiceForm.vendorId);
    if (!vendor) {
      showToast('Please select a valid supplier.', 'error');
      return;
    }

    const grossAmount = parseFloat(newInvoiceForm.amount);
    if (isNaN(grossAmount) || grossAmount <= 0) {
      showToast('Please enter a valid invoice amount.', 'error');
      return;
    }

    const tax = parseFloat(newInvoiceForm.taxAmount) || 0;
    const initialPaid = parseFloat(newInvoiceForm.paidAmount) || 0;

    const newInv = financeStorage.addVendorInvoice({
      invoiceNumber: newInvoiceForm.invoiceNumber.trim() || `INV-${Date.now().toString().slice(-5)}`,
      vendorId: vendor.id,
      vendorName: vendor.name,
      categoryId: vendor.categoryId,
      categoryName: vendor.categoryName,
      department: vendor.department,
      description: newInvoiceForm.description.trim() || `Procurement bill for ${vendor.name}`,
      invoiceDate: newInvoiceForm.invoiceDate,
      dueDate: newInvoiceForm.dueDate,
      amount: grossAmount,
      taxAmount: tax,
      paidAmount: initialPaid,
      status: initialPaid >= grossAmount ? 'Paid' : initialPaid > 0 ? 'Partially Paid' : 'Pending',
      purchaseOrderRef: newInvoiceForm.purchaseOrderRef.trim(),
      notes: newInvoiceForm.notes.trim(),
    });

    setIsAddInvoiceOpen(false);
    showToast(`Invoice ${newInv.invoiceNumber} recorded for ${newInv.vendorName}!`, 'success');
    loadData();

    // Reset Form
    setNewInvoiceForm({
      vendorId: '',
      invoiceNumber: '',
      purchaseOrderRef: '',
      description: '',
      invoiceDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      amount: '',
      taxAmount: '',
      paidAmount: '0',
      notes: '',
    });
  };

  // Open Payment Modal for Invoice
  const openPaymentModal = (invoice: VendorInvoice) => {
    setSelectedInvoiceForPayment(invoice);
    setPaymentForm({
      amount: String(invoice.pendingAmount),
      paymentMode: 'NEFT/RTGS',
      referenceNumber: `UTR-${Date.now().toString().slice(-8)}`,
      paymentDate: new Date().toISOString().slice(0, 10),
      approvedBy: currentUserName,
      notes: `Settlement for ${invoice.invoiceNumber}`,
      recordInExpenseLedger: true,
    });
    setIsPaymentModalOpen(true);
  };

  // Handle Payment Submit
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPayment) return;

    const payAmount = parseFloat(paymentForm.amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      showToast('Please enter a valid disbursement amount.', 'error');
      return;
    }

    if (payAmount > selectedInvoiceForPayment.pendingAmount) {
      showToast(
        `Disbursement cannot exceed pending balance of ${formatINR(
          selectedInvoiceForPayment.pendingAmount
        )}`,
        'error'
      );
      return;
    }

    try {
      const res = financeStorage.recordVendorPayment({
        invoiceId: selectedInvoiceForPayment.id,
        amount: payAmount,
        paymentMode: paymentForm.paymentMode,
        referenceNumber: paymentForm.referenceNumber.trim() || `UTR-${Date.now().toString().slice(-8)}`,
        approvedBy: paymentForm.approvedBy || currentUserName,
        paymentDate: paymentForm.paymentDate,
        notes: paymentForm.notes.trim(),
        recordInExpenseLedger: paymentForm.recordInExpenseLedger,
      });

      setIsPaymentModalOpen(false);
      setSelectedInvoiceForPayment(null);

      const msg = res.transaction
        ? `Disbursed ${formatINR(payAmount)} to ${res.invoice.vendorName}! Recorded in Expense Ledger (${res.transaction.id}).`
        : `Disbursed ${formatINR(payAmount)} to ${res.invoice.vendorName} successfully!`;

      showToast(msg, 'success');
      loadData();
    } catch (err: any) {
      showToast(err?.message || 'Error recording disbursement.', 'error');
    }
  };

  // Export Vendor Directory CSV
  const exportVendorDirectoryCSV = () => {
    const headers = [
      'Vendor Code',
      'Supplier Name',
      'Legal Entity',
      'Budget Category',
      'Department',
      'Contact Person',
      'Email',
      'Phone',
      'GSTIN',
      'PAN',
      'Payment Terms',
      'Bank Name',
      'Account Number',
      'IFSC Code',
      'Status',
    ];

    const rows = vendors.map((v) => [
      v.code,
      `"${v.name.replace(/"/g, '""')}"`,
      `"${(v.legalName || '').replace(/"/g, '""')}"`,
      `"${v.categoryName.replace(/"/g, '""')}"`,
      v.department,
      `"${v.contactPerson.replace(/"/g, '""')}"`,
      v.email,
      v.phone,
      v.gstin,
      v.pan || '',
      v.paymentTerms,
      v.bankDetails?.bankName || '',
      v.bankDetails?.accountNumber || '',
      v.bankDetails?.ifscCode || '',
      v.status,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MYSAR_Vendors_Directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Supplier directory exported to CSV!', 'info');
  };

  // Export Vendor Settlements / Ledger CSV
  const exportSettlementsCSV = () => {
    const headers = [
      'Disbursement ID',
      'Date',
      'Supplier Code / Name',
      'Invoice Ref',
      'Linked Budget Category',
      'Department',
      'Amount Disbursed (INR)',
      'Payment Mode',
      'Reference / UTR Number',
      'Approving Authority',
      'Linked Expense Voucher',
    ];

    const rows = payments.map((p) => [
      p.id,
      p.paymentDate,
      `"${p.vendorName.replace(/"/g, '""')}"`,
      p.invoiceNumber,
      `"${p.categoryName.replace(/"/g, '""')}"`,
      p.department,
      p.amount,
      p.paymentMode,
      p.referenceNumber,
      `"${p.approvedBy.replace(/"/g, '""')}"`,
      p.linkedTransactionId || 'N/A',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MYSAR_Vendor_Settlements_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Vendor settlement ledger exported to CSV!', 'info');
  };

  return (
    <div id="vendor-management-view" className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Toast */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center space-x-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : toastMessage.type === 'error'
              ? 'bg-rose-50 text-rose-900 border-rose-200'
              : 'bg-blue-50 text-blue-900 border-blue-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : toastMessage.type === 'error' ? (
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-600 p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Header Banner & Quick Actions */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-emerald-50 rounded-xl text-[#0B5D2A] border border-emerald-200/80">
                <Building2 className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Vendor & Supplier Management
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                Accounts Payable
              </span>
            </div>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 max-w-2xl">
              Centralized procurement directory, pending payment pipeline, and historical transaction logs
              categorized and linked to institutional budget caps.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              id="btn-add-supplier"
              onClick={() => setIsAddVendorOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Supplier</span>
            </button>

            <button
              type="button"
              id="btn-record-invoice"
              onClick={() => setIsAddInvoiceOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-gray-200 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Record Bill / Invoice</span>
            </button>

            {onNavigateTab && (
              <button
                type="button"
                id="btn-goto-unified-party"
                onClick={() => onNavigateTab('finance-parties')}
                className="inline-flex items-center space-x-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer"
                title="Open Section 21 Unified Party Master"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Unified Party Master</span>
              </button>
            )}

            <button
              type="button"
              id="btn-export-vendors"
              onClick={exportVendorDirectoryCSV}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-gray-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              title="Download Supplier Master Directory"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Directory</span>
            </button>
          </div>
        </div>

        {/* 2. Top Metric KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-gray-100">
          {/* Total Suppliers */}
          <div id="metric-total-vendors" className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Registered Suppliers</span>
              <span className="p-1.5 rounded-lg bg-blue-100/60 text-blue-700">
                <Building2 className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold text-slate-900">{metrics?.totalVendors || 0}</span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                {metrics?.activeVendors || 0} Active
              </span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500">Across 6 budget categories</div>
          </div>

          {/* Pending Payables */}
          <div id="metric-pending-payables" className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Pending Payables</span>
              <span className="p-1.5 rounded-lg bg-amber-100/60 text-amber-700">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold text-amber-700">
                {formatINR(metrics?.totalPayablesPending || 0)}
              </span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              {metrics?.pendingInvoicesCount || 0} unpaid or partial bills
            </div>
          </div>

          {/* Overdue Liabilities */}
          <div
            id="metric-overdue-payables"
            className={`p-3.5 sm:p-4 rounded-xl border ${
              (metrics?.overduePayables || 0) > 0
                ? 'bg-rose-50/70 border-rose-200'
                : 'bg-slate-50 border-slate-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Overdue Payables</span>
              <span
                className={`p-1.5 rounded-lg ${
                  (metrics?.overduePayables || 0) > 0
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className={`text-xl sm:text-2xl font-bold ${
                  (metrics?.overduePayables || 0) > 0 ? 'text-rose-700' : 'text-slate-800'
                }`}
              >
                {formatINR(metrics?.overduePayables || 0)}
              </span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              {(metrics?.overdueInvoicesCount || 0) > 0 ? (
                <span className="text-rose-700 font-semibold">
                  {metrics?.overdueInvoicesCount} invoices past due date
                </span>
              ) : (
                'All bills within credit terms'
              )}
            </div>
          </div>

          {/* Total Paid YTD */}
          <div id="metric-paid-ytd" className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Disbursed YTD (2026)</span>
              <span className="p-1.5 rounded-lg bg-emerald-100/60 text-[#168A45]">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold text-slate-900">
                {formatCompactINR(metrics?.totalPaidYTD || 0)}
              </span>
              <span className="text-xs text-slate-500">
                ({metrics?.totalTransactionsCount || 0} vouchers)
              </span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500">Auto-tracked in Ledger</div>
          </div>
        </div>

        {/* Performance Metric Callout: Spend per Vendor vs. Total Budget Contribution */}
        <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50/50 to-purple-50 border border-purple-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start sm:items-center space-x-3.5">
            <span className="p-2.5 bg-purple-600 text-white rounded-xl shrink-0 shadow-2xs">
              <TrendingUp className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-extrabold text-purple-900 uppercase tracking-wider">
                  Cost Optimization Metric
                </span>
                <span className="text-xs font-bold text-slate-900">
                  Spend per Vendor vs. Total Budget Contribution
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-200/80 text-purple-900 border border-purple-300">
                  Pareto & Concentration Analysis
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
                Evaluates which suppliers take up the largest portion of the budget to help management make data-driven
                procurement consolidation and contract renegotiation decisions.
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-open-spend-contribution-banner"
            onClick={() => setActiveView('contribution')}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-purple-900 hover:bg-purple-950 text-white rounded-xl text-xs font-bold shadow-2xs transition-all shrink-0 cursor-pointer self-start sm:self-auto"
          >
            <span>Analyze Spend vs Budget</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 3. Category Payables Distribution Quick Pills */}
        {categoryPendingBreakdown.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-slate-500 text-[11px] uppercase tracking-wider mr-1">
              Outstanding By Category:
            </span>
            {categoryPendingBreakdown.map(([catName, data]) => (
              <span
                key={catName}
                onClick={() => setSelectedCategory(catName)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs cursor-pointer transition-all ${
                  selectedCategory === catName
                    ? 'bg-slate-800 text-white border-slate-800 font-bold'
                    : 'bg-white text-slate-700 border-gray-200 hover:bg-slate-50'
                }`}
              >
                <span>{catName.split('&')[0].trim()}</span>
                <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 text-[10px]">
                  {formatCompactINR(data.total)}
                </span>
              </span>
            ))}
            {selectedCategory !== 'All' && (
              <button
                type="button"
                onClick={() => setSelectedCategory('All')}
                className="text-[11px] text-blue-600 hover:underline font-semibold ml-1 cursor-pointer"
              >
                Clear Filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* 4. Sub-Tab Switcher & Filter Toolbar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl overflow-x-auto max-w-full">
          <button
            type="button"
            id="tab-view-directory"
            onClick={() => setActiveView('directory')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeView === 'directory'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 font-semibold'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-[#168A45]" />
            <span>Suppliers Directory</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full font-bold">
              {vendors.length}
            </span>
          </button>

          <button
            type="button"
            id="tab-view-contribution"
            onClick={() => setActiveView('contribution')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeView === 'contribution'
                ? 'bg-purple-900 text-white shadow-2xs'
                : 'text-purple-800 hover:text-purple-950 font-semibold'
            }`}
          >
            <TrendingUp className={`w-3.5 h-3.5 ${activeView === 'contribution' ? 'text-purple-300' : 'text-purple-600'}`} />
            <span>Spend vs. Budget Contribution</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeView === 'contribution'
                  ? 'bg-purple-800 text-purple-200'
                  : 'bg-purple-100 text-purple-800'
              }`}
            >
              Cost Optimization
            </span>
          </button>

          <button
            type="button"
            id="tab-view-pending"
            onClick={() => setActiveView('pending')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeView === 'pending'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 font-semibold'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Pending Payables</span>
            {metrics && metrics.pendingInvoicesCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full font-bold">
                {metrics.pendingInvoicesCount}
              </span>
            )}
          </button>

          <button
            type="button"
            id="tab-view-ledger"
            onClick={() => setActiveView('ledger')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeView === 'ledger'
                ? 'bg-purple-900 text-white shadow-2xs'
                : 'text-purple-800 hover:text-purple-950 font-semibold'
            }`}
          >
            <Receipt className={`w-3.5 h-3.5 ${activeView === 'ledger' ? 'text-purple-300' : 'text-purple-600'}`} />
            <span>Supplier AP Subledger & Settlements</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded-full font-bold">
              {payments.length}
            </span>
          </button>
        </div>

        {/* Global Search & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="input-vendor-search"
              placeholder={
                activeView === 'directory'
                  ? 'Search vendor, GSTIN, code...'
                  : activeView === 'pending'
                  ? 'Search invoice, supplier...'
                  : 'Search voucher, UTR, ref...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-gray-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
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

          {/* Category Filter */}
          <select
            id="select-vendor-category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-gray-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Specific filters based on active tab */}
          {activeView === 'directory' && (
            <select
              id="select-vendor-status-filter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-gray-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Under Review">Under Review</option>
              <option value="On Hold">On Hold</option>
              <option value="Inactive">Inactive</option>
            </select>
          )}

          {activeView === 'pending' && (
            <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setPendingFilter('all')}
                className={`px-2 py-1 rounded-lg font-semibold transition-all ${
                  pendingFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setPendingFilter('overdue')}
                className={`px-2 py-1 rounded-lg font-semibold transition-all ${
                  pendingFilter === 'overdue' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Overdue
              </button>
              <button
                type="button"
                onClick={() => setPendingFilter('dueSoon')}
                className={`px-2 py-1 rounded-lg font-semibold transition-all ${
                  pendingFilter === 'dueSoon' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Due in 7d
              </button>
            </div>
          )}

          {activeView === 'ledger' && (
            <button
              type="button"
              onClick={exportSettlementsCSV}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-gray-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Ledger</span>
            </button>
          )}
        </div>
      </div>

      {/* 5. TAB VIEW: SPEND VS BUDGET CONTRIBUTION (Cost Optimization) */}
      {activeView === 'contribution' && (
        <VendorSpendBudgetContributionView
          currentUserName={currentUserName}
          userRole={userRole}
          onNavigateTab={onNavigateTab}
          onSelectVendorInDirectory={(vendorId) => {
            setSelectedCategory('All');
            setSelectedStatus('All');
            setSearchQuery('');
            setActiveView('directory');
            const target = vendors.find((v) => v.id === vendorId);
            if (target) setSelectedVendorDetail(target);
          }}
        />
      )}

      {/* 6. TAB VIEW 1: SUPPLIERS DIRECTORY */}
      {activeView === 'directory' && (
        <div id="view-suppliers-directory" className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-gray-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Supplier & Code</th>
                    <th className="py-3 px-4">Budget Category</th>
                    <th className="py-3 px-4 min-w-[150px]">Budget Contribution</th>
                    <th className="py-3 px-4">Contact Person</th>
                    <th className="py-3 px-4">Terms</th>
                    <th className="py-3 px-4 text-right">Outstanding Payable</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredVendors.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <Building2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-slate-600">No suppliers match your criteria.</p>
                        <p className="text-xs text-slate-400 mt-1">Try changing your filters or add a new supplier.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredVendors.map((vendor) => {
                      // Calculate outstanding payable for this vendor
                      const vendorInvoices = invoices.filter((i) => i.vendorId === vendor.id);
                      const vendorPending = vendorInvoices.reduce(
                        (sum, i) => (i.status !== 'Cancelled' ? sum + i.pendingAmount : sum),
                        0
                      );
                      const vendorOverdue = vendorInvoices.some(
                        (i) => i.pendingAmount > 0 && (i.status === 'Overdue' || i.dueDate < todayStr)
                      );
                      const contrib = vendorContributionsMap.get(vendor.id);

                      return (
                        <tr
                          key={vendor.id}
                          className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                          onClick={() => setSelectedVendorDetail(vendor)}
                        >
                          {/* Name & Code */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                              {vendor.name}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono bg-slate-100 px-1 py-0.2 rounded text-slate-600">
                                {vendor.code}
                              </span>
                              <span>•</span>
                              <span>{vendor.city}, {vendor.state}</span>
                            </div>
                          </td>

                          {/* Budget Category */}
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-[#0B5D2A] border border-emerald-200/80">
                              {vendor.categoryName}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">{vendor.department}</div>
                          </td>

                          {/* Budget Contribution & Share */}
                          <td
                            className="py-3.5 px-4"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveView('contribution');
                            }}
                          >
                            {contrib ? (
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900 font-mono text-xs">
                                    {contrib.totalBudgetContributionPercent}%
                                  </span>
                                  <span className="text-[10px] text-slate-500">of budget</span>
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                                      contrib.concentrationRisk === 'High'
                                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                                        : contrib.concentrationRisk === 'Moderate'
                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    }`}
                                  >
                                    {contrib.concentrationRisk}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                                  <span>Spend: {formatCompactINR(contrib.effectiveSpend)}</span>
                                  <span>•</span>
                                  <span className="text-purple-700 font-bold hover:underline inline-flex items-center gap-0.5">
                                    Optimize
                                    <ArrowUpRight className="w-2.5 h-2.5" />
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">-</span>
                            )}
                          </td>

                          {/* Contact Person */}
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-slate-800">{vendor.contactPerson}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3" />
                              <span className="truncate max-w-[150px]">{vendor.email}</span>
                            </div>
                          </td>

                          {/* Terms */}
                          <td className="py-3.5 px-4">
                            <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full text-[11px]">
                              {vendor.paymentTerms}
                            </span>
                          </td>

                          {/* Outstanding Balance */}
                          <td className="py-3.5 px-4 text-right">
                            {vendorPending > 0 ? (
                              <div>
                                <span className="font-bold text-amber-700">{formatINR(vendorPending)}</span>
                                {vendorOverdue && (
                                  <div className="text-[10px] text-rose-600 font-bold flex items-center justify-end gap-1">
                                    <AlertTriangle className="w-3 h-3" /> Overdue
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 font-medium">₹0 (Clear)</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                vendor.status === 'Active'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : vendor.status === 'On Hold'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {vendor.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td
                            className="py-3.5 px-4 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedVendorDetail(vendor)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                                title="View details and invoices"
                              >
                                View
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedLedgerVendorId(vendor.id);
                                  setActiveView('ledger');
                                }}
                                className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1"
                                title="Open Supplier AP Subledger & Aging"
                              >
                                <Receipt className="w-3 h-3 text-purple-600" />
                                Ledger
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveView('contribution')}
                                className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                                title="Analyze Spend vs Budget"
                              >
                                Analysis
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setNewInvoiceForm((prev) => ({
                                    ...prev,
                                    vendorId: vendor.id,
                                  }));
                                  setIsAddInvoiceOpen(true);
                                }}
                                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                                title="Record bill for this supplier"
                              >
                                + Bill
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
      )}

      {/* 6. TAB VIEW 2: PENDING PAYABLES PIPELINE */}
      {activeView === 'pending' && (
        <div id="view-pending-payables" className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Outstanding Bills & Invoices</h3>
                <p className="text-xs text-slate-500">
                  Manage dues before deadlines, avoid supplier interest, and ensure budget category compliance.
                </p>
              </div>

              <div className="text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-gray-200">
                Total Pending:{' '}
                <span className="font-bold text-amber-700">
                  {formatINR(
                    filteredInvoices.reduce((sum, i) => (i.status !== 'Cancelled' ? sum + i.pendingAmount : sum), 0)
                  )}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Invoice # & Supplier</th>
                    <th className="py-3 px-4">Linked Budget Category</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-right">Bill Total</th>
                    <th className="py-3 px-4 text-right">Pending Balance</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                        <p className="font-semibold text-slate-700">No pending invoices match your filter.</p>
                        <p className="text-xs text-slate-400 mt-1">All dues settled or no records found.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => {
                      const dueStatus = getDueStatus(inv.dueDate, inv.status);

                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Invoice # & Vendor */}
                          <td className="py-3.5 px-4">
                            <div className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</div>
                            <div className="text-xs font-semibold text-slate-700 mt-0.5">{inv.vendorName}</div>
                            {inv.purchaseOrderRef && (
                              <div className="text-[10px] text-slate-400 font-mono">PO: {inv.purchaseOrderRef}</div>
                            )}
                          </td>

                          {/* Budget Category */}
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                              {inv.categoryName}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">{inv.department}</div>
                          </td>

                          {/* Description */}
                          <td className="py-3.5 px-4 max-w-[240px]">
                            <div className="truncate text-slate-700" title={inv.description}>
                              {inv.description}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">Inv Date: {inv.invoiceDate}</div>
                          </td>

                          {/* Due Date & Badge */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-medium text-slate-800">{inv.dueDate}</div>
                            <span
                              className={`inline-flex items-center px-2 py-0.2 mt-0.5 rounded-md text-[10px] border ${dueStatus.color}`}
                            >
                              {dueStatus.label}
                            </span>
                          </td>

                          {/* Bill Total */}
                          <td className="py-3.5 px-4 text-right font-medium text-slate-600">
                            {formatINR(inv.amount)}
                            {inv.paidAmount > 0 && (
                              <div className="text-[10px] text-emerald-600">Paid: {formatINR(inv.paidAmount)}</div>
                            )}
                          </td>

                          {/* Pending Balance */}
                          <td className="py-3.5 px-4 text-right">
                            {inv.pendingAmount > 0 ? (
                              <span className="font-bold text-amber-700 text-sm">
                                {formatINR(inv.pendingAmount)}
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-bold">₹0</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                inv.status === 'Paid'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : inv.status === 'Overdue'
                                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                  : inv.status === 'Partially Paid'
                                  ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            {inv.pendingAmount > 0 ? (
                              <button
                                type="button"
                                onClick={() => openPaymentModal(inv)}
                                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer"
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                                <span>Pay / Settle</span>
                              </button>
                            ) : (
                              <span className="inline-flex items-center text-xs font-semibold text-emerald-700">
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Settled
                              </span>
                            )}
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
      )}

      {/* 7. TAB VIEW 3: SUPPLIER AP SUBLEDGER & SETTLEMENTS */}
      {activeView === 'ledger' && (
        <div id="view-settlement-ledger" className="space-y-4">
          <VendorSupplierLedgerView
            currentUserName={currentUserName}
            userRole={userRole}
            initialVendorId={selectedLedgerVendorId}
            onSelectVendor={(vId) => setSelectedLedgerVendorId(vId)}
            onNavigateTab={onNavigateTab}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. MODAL: RECORD INVOICE PAYMENT / SETTLE BILL */}
      {/* ========================================================================= */}
      {isPaymentModalOpen && selectedInvoiceForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            id="modal-record-payment"
            className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
          >
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">Record Supplier Disbursement</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
              {/* Invoice Summary Box */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-500">Supplier:</span>
                  <span className="text-slate-900 font-bold">{selectedInvoiceForPayment.vendorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice Ref:</span>
                  <span className="font-mono text-slate-800">{selectedInvoiceForPayment.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Budget Category:</span>
                  <span className="font-semibold text-emerald-700">{selectedInvoiceForPayment.categoryName}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-gray-200">
                  <span className="text-slate-600 font-medium">Pending Balance:</span>
                  <span className="font-bold text-amber-700 text-sm">
                    {formatINR(selectedInvoiceForPayment.pendingAmount)}
                  </span>
                </div>
              </div>

              {/* Amount to Pay */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Disbursement Amount (₹ INR) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    id="input-payment-amount"
                    required
                    min="1"
                    max={selectedInvoiceForPayment.pendingAmount}
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                  <span>Supports partial payments</span>
                  <button
                    type="button"
                    onClick={() =>
                      setPaymentForm({
                        ...paymentForm,
                        amount: String(selectedInvoiceForPayment.pendingAmount),
                      })
                    }
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    Pay Full ({formatINR(selectedInvoiceForPayment.pendingAmount)})
                  </button>
                </div>
              </div>

              {/* Payment Mode & Ref */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    id="select-payment-mode"
                    value={paymentForm.paymentMode}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, paymentMode: e.target.value as PaymentMode })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="NEFT/RTGS">NEFT / RTGS</option>
                    <option value="Bank Transfer">Direct Bank Transfer</option>
                    <option value="Corporate Card">Corporate Credit Card</option>
                    <option value="Cheque">Cheque</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">UTR / Ref Number</label>
                  <input
                    type="text"
                    id="input-payment-reference"
                    required
                    placeholder="e.g. UTR-HDFC-9921"
                    value={paymentForm.referenceNumber}
                    onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Payment Date & Approver */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Disbursement Date</label>
                  <input
                    type="date"
                    id="input-payment-date"
                    required
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Approving Officer</label>
                  <input
                    type="text"
                    id="input-payment-approver"
                    required
                    value={paymentForm.approvedBy}
                    onChange={(e) => setPaymentForm({ ...paymentForm, approvedBy: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Auto-record in Expense Ledger checkbox */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    id="checkbox-record-in-ledger"
                    checked={paymentForm.recordInExpenseLedger}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, recordInExpenseLedger: e.target.checked })
                    }
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 block">
                      Auto-record in Finance Expense Ledger
                    </span>
                    <span className="text-slate-600 text-[11px]">
                      Deducts {formatINR(parseFloat(paymentForm.amount) || 0)} from the {selectedInvoiceForPayment.categoryName} category budget cap and updates monthly burn analytics.
                    </span>
                  </div>
                </label>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-gray-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 bg-white border border-gray-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-confirm-payment"
                  className="px-4 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
                >
                  Confirm & Disburse Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. MODAL: ADD SUPPLIER */}
      {/* ========================================================================= */}
      {isAddVendorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            id="modal-add-supplier"
            className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
          >
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">Onboard New Supplier / Vendor</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddVendorOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddVendorSubmit} className="p-6 space-y-4">
              {/* General Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Trade Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cisco Systems India"
                    value={newVendorForm.name}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Legal Registered Entity</label>
                  <input
                    type="text"
                    placeholder="e.g. Cisco Systems India Pvt Ltd"
                    value={newVendorForm.legalName}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, legalName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Vendor Code</label>
                  <input
                    type="text"
                    placeholder="e.g. CSCO-01 (Auto if blank)"
                    value={newVendorForm.code}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-mono uppercase focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Category & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Linked Budget Category *
                  </label>
                  <select
                    value={newVendorForm.categoryName}
                    onChange={(e) => {
                      const selected = categories.find((c) => c.name === e.target.value);
                      setNewVendorForm({
                        ...newVendorForm,
                        categoryName: e.target.value,
                        categoryId: selected?.id || 'CAT-02',
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Managing Department</label>
                  <select
                    value={newVendorForm.department}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="IT & Tech">IT & Tech</option>
                    <option value="Operations">Operations</option>
                    <option value="Academic">Academic</option>
                    <option value="Administration">Administration</option>
                    <option value="Finance & Accounts">Finance & Accounts</option>
                  </select>
                </div>
              </div>

              {/* Contact Person & Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Chandra"
                    value={newVendorForm.contactPerson}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="accounts@vendor.com"
                    value={newVendorForm.email}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone / Mobile</label>
                  <input
                    type="text"
                    placeholder="+91 98450 00000"
                    value={newVendorForm.phone}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Statutory & Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    placeholder="29AABCA1234A1Z5"
                    value={newVendorForm.gstin}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, gstin: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-mono uppercase focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">PAN Number</label>
                  <input
                    type="text"
                    placeholder="AABCA1234A"
                    value={newVendorForm.pan}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, pan: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-mono uppercase focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Credit Terms</label>
                  <select
                    value={newVendorForm.paymentTerms}
                    onChange={(e) =>
                      setNewVendorForm({
                        ...newVendorForm,
                        paymentTerms: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Immediate">Immediate / Advance</option>
                    <option value="Net 15">Net 15 Days</option>
                    <option value="Net 30">Net 30 Days</option>
                    <option value="Net 45">Net 45 Days</option>
                    <option value="Net 60">Net 60 Days</option>
                  </select>
                </div>
              </div>

              {/* Bank Account Details */}
              <div className="pt-2 border-t border-gray-100">
                <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-blue-600" />
                  Bank Account Information (For RTGS/NEFT Disbursements)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">Bank Name</label>
                    <input
                      type="text"
                      placeholder="e.g. HDFC Bank"
                      value={newVendorForm.bankName}
                      onChange={(e) => setNewVendorForm({ ...newVendorForm, bankName: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">Account Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 50200012345678"
                      value={newVendorForm.accountNumber}
                      onChange={(e) => setNewVendorForm({ ...newVendorForm, accountNumber: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-gray-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">IFSC Code</label>
                    <input
                      type="text"
                      placeholder="e.g. HDFC0000053"
                      value={newVendorForm.ifscCode}
                      onChange={(e) => setNewVendorForm({ ...newVendorForm, ifscCode: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-gray-200 rounded-lg text-xs font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddVendorOpen(false)}
                  className="px-4 py-2 bg-white border border-gray-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-save-new-supplier"
                  className="px-4 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
                >
                  Onboard Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. MODAL: RECORD BILL / INVOICE */}
      {/* ========================================================================= */}
      {isAddInvoiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            id="modal-record-invoice"
            className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
          >
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base">Record Supplier Bill / Invoice</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddInvoiceOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddInvoiceSubmit} className="p-6 space-y-4">
              {/* Supplier Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Supplier *</label>
                <select
                  required
                  value={newInvoiceForm.vendorId}
                  onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, vendorId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose Supplier --</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.code}) — {v.categoryName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Invoice Number & PO Ref */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. INV-2026-99"
                    value={newInvoiceForm.invoiceNumber}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, invoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Purchase Order Ref</label>
                  <input
                    type="text"
                    placeholder="e.g. PO-2026-081"
                    value={newInvoiceForm.purchaseOrderRef}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, purchaseOrderRef: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Date</label>
                  <input
                    type="date"
                    required
                    value={newInvoiceForm.invoiceDate}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, invoiceDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Due Date</label>
                  <input
                    type="date"
                    required
                    value={newInvoiceForm.dueDate}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Amount & Tax */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gross Bill Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 50000"
                    value={newInvoiceForm.amount}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GST / Tax Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 9000"
                    value={newInvoiceForm.taxAmount}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, taxAmount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description of Goods / Services</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Cloud server licenses for Q3 LMS rollout"
                  value={newInvoiceForm.description}
                  onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-gray-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddInvoiceOpen(false)}
                  className="px-4 py-2 bg-white border border-gray-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-save-new-invoice"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
                >
                  Save Bill to Payables
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. DRAWER: SUPPLIER PROFILE & TRANSACTION LEDGER */}
      {/* ========================================================================= */}
      {selectedVendorDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            id="drawer-vendor-details"
            className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
          >
            {/* Drawer Header */}
            <div className="p-6 bg-slate-900 text-white flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-bold">
                    {selectedVendorDetail.code}
                  </span>
                  <span className="text-xs text-slate-400">• {selectedVendorDetail.paymentTerms}</span>
                </div>
                <h2 className="text-xl font-bold mt-1 text-white">{selectedVendorDetail.name}</h2>
                <div className="text-xs text-slate-400 mt-0.5">
                  {selectedVendorDetail.legalName && selectedVendorDetail.legalName !== selectedVendorDetail.name ? (
                    <span>Legal: {selectedVendorDetail.legalName} • </span>
                  ) : null}
                  <span>Category: {selectedVendorDetail.categoryName}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVendorDetail(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Content */}
            <div className="p-6 space-y-6">
              {/* Key Details Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Contact */}
                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Primary Contact
                  </span>
                  <div className="text-xs font-bold text-slate-800">{selectedVendorDetail.contactPerson}</div>
                  <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span className="truncate">{selectedVendorDetail.email || 'N/A'}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{selectedVendorDetail.phone || 'N/A'}</span>
                  </div>
                </div>

                {/* Statutory & Location */}
                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Tax & Location
                  </span>
                  <div className="text-[11px] text-slate-700 font-mono">
                    GSTIN: <span className="font-bold text-slate-900">{selectedVendorDetail.gstin || 'N/A'}</span>
                  </div>
                  {selectedVendorDetail.pan && (
                    <div className="text-[11px] text-slate-600 font-mono mt-0.5">
                      PAN: {selectedVendorDetail.pan}
                    </div>
                  )}
                  <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    <span className="truncate">
                      {selectedVendorDetail.address ? `${selectedVendorDetail.address}, ` : ''}
                      {selectedVendorDetail.city}, {selectedVendorDetail.state}
                    </span>
                  </div>
                </div>

                {/* Bank Details */}
                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Bank Account
                  </span>
                  {selectedVendorDetail.bankDetails ? (
                    <div className="text-xs space-y-0.5 font-mono">
                      <div className="font-sans font-bold text-slate-800">
                        {selectedVendorDetail.bankDetails.bankName}
                      </div>
                      <div className="text-[11px] text-slate-700">
                        A/C: {selectedVendorDetail.bankDetails.accountNumber}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        IFSC: {selectedVendorDetail.bankDetails.ifscCode}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic">No bank account configured</div>
                  )}
                </div>
              </div>

              {/* Vendor Invoices & Bills Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Bills & Invoices ({invoices.filter((i) => i.vendorId === selectedVendorDetail.id).length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setNewInvoiceForm((prev) => ({
                        ...prev,
                        vendorId: selectedVendorDetail.id,
                      }));
                      setIsAddInvoiceOpen(true);
                    }}
                    className="text-xs text-blue-600 hover:underline font-bold"
                  >
                    + Add New Bill
                  </button>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-gray-200">
                      <tr>
                        <th className="py-2.5 px-3">Invoice #</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Due Date</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                        <th className="py-2.5 px-3 text-right">Pending</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {invoices.filter((i) => i.vendorId === selectedVendorDetail.id).length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-slate-400">
                            No bills recorded for this supplier.
                          </td>
                        </tr>
                      ) : (
                        invoices
                          .filter((i) => i.vendorId === selectedVendorDetail.id)
                          .map((inv) => (
                            <tr key={inv.id} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-mono font-bold text-slate-800">
                                {inv.invoiceNumber}
                              </td>
                              <td className="py-2 px-3 text-slate-600">{inv.invoiceDate}</td>
                              <td className="py-2 px-3 text-slate-600">{inv.dueDate}</td>
                              <td className="py-2 px-3 text-right font-medium">{formatINR(inv.amount)}</td>
                              <td className="py-2 px-3 text-right font-bold text-amber-700">
                                {formatINR(inv.pendingAmount)}
                              </td>
                              <td className="py-2 px-3 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    inv.status === 'Paid'
                                      ? 'bg-emerald-50 text-emerald-800'
                                      : inv.status === 'Overdue'
                                      ? 'bg-rose-50 text-rose-800'
                                      : 'bg-amber-50 text-amber-800'
                                  }`}
                                >
                                  {inv.status}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right">
                                {inv.pendingAmount > 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => openPaymentModal(inv)}
                                    className="px-2.5 py-1 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-lg text-xs font-bold cursor-pointer"
                                  >
                                    Pay
                                  </button>
                                ) : (
                                  <span className="text-emerald-700 font-medium">Cleared</span>
                                )}
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Historical Payments for this Vendor */}
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-purple-600" />
                  Historical Disbursements ({payments.filter((p) => p.vendorId === selectedVendorDetail.id).length})
                </h3>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-gray-200">
                      <tr>
                        <th className="py-2.5 px-3">Voucher #</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Invoice Ref</th>
                        <th className="py-2.5 px-3">Mode & UTR</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                        <th className="py-2.5 px-3 text-center">Ledger Voucher</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {payments.filter((p) => p.vendorId === selectedVendorDetail.id).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-400">
                            No disbursements recorded yet for this supplier.
                          </td>
                        </tr>
                      ) : (
                        payments
                          .filter((p) => p.vendorId === selectedVendorDetail.id)
                          .map((pay) => (
                            <tr key={pay.id} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-mono font-bold text-slate-800">{pay.id}</td>
                              <td className="py-2 px-3 text-slate-600">{pay.paymentDate}</td>
                              <td className="py-2 px-3 font-mono text-slate-700">{pay.invoiceNumber}</td>
                              <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">
                                {pay.paymentMode} • {pay.referenceNumber}
                              </td>
                              <td className="py-2 px-3 text-right font-bold text-emerald-700">
                                {formatINR(pay.amount)}
                              </td>
                              <td className="py-2 px-3 text-center">
                                <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                  {pay.linkedTransactionId || 'Direct'}
                                </span>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-gray-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Created on {selectedVendorDetail.createdDate}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLedgerVendorId(selectedVendorDetail.id);
                    setSelectedVendorDetail(null);
                    setActiveView('ledger');
                  }}
                  className="px-4 py-2 bg-purple-900 hover:bg-purple-950 text-white rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Receipt className="w-3.5 h-3.5 text-purple-300" />
                  <span>Open Full Supplier Subledger</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedVendorDetail(null)}
                  className="px-4 py-2 bg-slate-800 text-white hover:bg-slate-900 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
