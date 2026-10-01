import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Search,
  Filter,
  Calendar,
  Layers,
  TrendingUp,
  ShoppingCart,
  Receipt,
  Landmark,
  Package,
  CreditCard,
  ShieldCheck,
  Building2,
  FileText,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { erpFinanceStorage, COMPANY_CONFIG } from '../../../services/finance/erpFinanceStorage';
import { financeStorage } from '../../../services/financeStorageService';

type ReportCategory =
  | 'sales'
  | 'purchases'
  | 'inventory'
  | 'expenses'
  | 'party'
  | 'cash-bank'
  | 'loans'
  | 'budgets'
  | 'financial-statements'
  | 'gst'
  | 'tds';

interface ReportOption {
  id: string;
  category: ReportCategory;
  name: string;
  description: string;
}

const REPORT_CATALOG: ReportOption[] = [
  // Sales
  { id: 'sales-register', category: 'sales', name: 'Sales Register (Outward Tax Invoices)', description: 'Itemized sales invoices with GST breakup and customer details' },
  { id: 'customer-sales-summary', category: 'sales', name: 'Customer Sales Summary', description: 'Total revenue and invoice volumes grouped by customer account' },
  { id: 'tax-invoice-summary', category: 'sales', name: 'Tax Invoice & e-Invoice Summary', description: 'IRN status, QR code, and taxable turnover breakdown' },

  // Purchases
  { id: 'purchase-register', category: 'purchases', name: 'Purchase Register (Inward Bills)', description: 'Itemized vendor bills, HSN codes, and eligible input tax credit' },
  { id: 'vendor-spend-summary', category: 'purchases', name: 'Vendor Spend & Procurement Summary', description: 'Expenditure distribution across approved supplier accounts' },

  // Inventory
  { id: 'stock-valuation', category: 'inventory', name: 'Stock Valuation Register (FIFO)', description: 'Perpetual inventory stock on hand valued at unit FIFO cost' },
  { id: 'low-stock-register', category: 'inventory', name: 'Low Stock & Reorder Level Report', description: 'SKUs at or below minimum buffer threshold requiring replenishment' },

  // Expenses
  { id: 'monthly-expense-report', category: 'expenses', name: 'Monthly Operating Expense Ledger', description: 'Overhead transactions categorized by expense heads and cost centers' },
  { id: 'departmental-cost-report', category: 'expenses', name: 'Departmental Cost Allocation', description: 'Direct and indirect cost breakdown across IT, Marketing, Operations' },

  // Party
  { id: 'receivables-aging', category: 'party', name: 'Accounts Receivable Aging Report', description: 'Debtor balances partitioned by Current, 1-30, 31-60, 61-90, 90+ days' },
  { id: 'payables-aging', category: 'party', name: 'Accounts Payable Aging Report', description: 'Creditor liabilities grouped by aging brackets' },

  // Cash & Bank
  { id: 'bank-register', category: 'cash-bank', name: 'Bank Statement & Ledger Register', description: 'Bank debits, credits, and closing reconciliation balances' },
  { id: 'cash-book', category: 'cash-bank', name: 'Petty Cash Book & Fund Float', description: 'Cash in hand disbursements and campus cash floats' },

  // Loans
  { id: 'loan-schedule', category: 'loans', name: 'Loan Facilities & Amortization Schedule', description: 'Sanctioned term loans, outstanding principal, and EMI commitments' },

  // Budgets
  { id: 'budget-vs-actual', category: 'budgets', name: 'Budget vs Actual Variance Report', description: 'Annual cap allocations compared against committed and actual spend' },

  // Financial Statements
  { id: 'profit-loss', category: 'financial-statements', name: 'Profit & Loss Statement (P&L)', description: 'Comprehensive income statement showing Gross and Net Profit' },
  { id: 'balance-sheet', category: 'financial-statements', name: 'Balance Sheet (Statement of Financial Position)', description: 'Assets, Liabilities, and Equity ledger balances' },
  { id: 'trial-balance', category: 'financial-statements', name: 'Trial Balance (Double-Entry Verifier)', description: 'Debit and Credit balance equality check across all accounts' },

  // GST Reports
  { id: 'gstr-1-summary', category: 'gst', name: 'GSTR-1 Outward Supplies Summary', description: 'B2B, B2C, HSN summary, and outward tax liability for portal filing' },
  { id: 'gstr-3b-summary', category: 'gst', name: 'GSTR-3B Monthly Return & ITC Reconciliation', description: 'Eligible ITC, outward tax liability, and net GST payable' },

  // TDS Reports
  { id: 'tds-summary', category: 'tds', name: 'TDS Deducted Register & Section Summary', description: 'Tax deducted at source under 194C (Contractors), 194J (Professional), 194I (Rent)' },
];

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(val);
};

export const FinanceReportCenterView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory>('sales');
  const [selectedReportId, setSelectedReportId] = useState<string>('sales-register');

  // Filters
  const [financialYear, setFinancialYear] = useState('FY 2026-27');
  const [fromDate, setFromDate] = useState('2026-04-01');
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [branchFilter, setBranchFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;
  const [sortAsc, setSortAsc] = useState(false);

  const selectedReport = useMemo(() => {
    return REPORT_CATALOG.find((r) => r.id === selectedReportId) || REPORT_CATALOG[0];
  }, [selectedReportId]);

  // Compute Report Table Dataset
  const reportData = useMemo(() => {
    let headers: string[] = [];
    let rows: {
      col1: string;
      col2: string;
      col3: string;
      col4: string;
      col5: string;
      amount: number;
      tag?: string;
    }[] = [];

    switch (selectedReportId) {
      case 'sales-register':
      case 'tax-invoice-summary': {
        headers = ['Invoice #', 'Date', 'Customer Name', 'Cost Center', 'Tax (₹)', 'Grand Total (₹)', 'Status'];
        const list = erpFinanceStorage.getSalesInvoices();
        rows = list.map((si) => ({
          col1: si.invoiceNumber,
          col2: si.date,
          col3: si.customerName,
          col4: si.costCenter,
          col5: formatINR(si.cgstTotal + si.sgstTotal + si.igstTotal),
          amount: si.grandTotal,
          tag: si.status,
        }));
        break;
      }
      case 'customer-sales-summary': {
        headers = ['Customer Name', 'GSTIN', 'Total Invoices', 'Payment Terms', 'Avg Ticket', 'Total Revenue (₹)', 'Status'];
        const parties = erpFinanceStorage.getParties('Customer');
        const sales = erpFinanceStorage.getSalesInvoices();
        rows = parties.map((p) => {
          const pSales = sales.filter((s) => s.customerId === p.id || s.customerName === p.name);
          const totalRev = pSales.reduce((s, i) => s + i.grandTotal, 0);
          return {
            col1: p.name,
            col2: p.gstin || 'Unregistered',
            col3: `${pSales.length} invoices`,
            col4: p.paymentTerms,
            col5: pSales.length > 0 ? formatINR(totalRev / pSales.length) : '₹0',
            amount: totalRev,
            tag: p.status,
          };
        });
        break;
      }
      case 'purchase-register':
      case 'vendor-spend-summary': {
        headers = ['Invoice #', 'Date', 'Vendor Name', 'Cost Center', 'Tax (ITC) (₹)', 'Total Amount (₹)', 'Status'];
        const list = erpFinanceStorage.getPurchaseInvoices();
        rows = list.map((pi) => ({
          col1: pi.invoiceNumber,
          col2: pi.date,
          col3: pi.vendorName,
          col4: pi.costCenter,
          col5: formatINR(pi.cgstTotal + pi.sgstTotal + pi.igstTotal),
          amount: pi.grandTotal,
          tag: pi.status,
        }));
        break;
      }
      case 'stock-valuation':
      case 'low-stock-register': {
        headers = ['SKU / Code', 'Item Name', 'Category', 'Warehouse', 'Current Stock', 'Stock Valuation (₹)', 'Status'];
        let items = erpFinanceStorage.getItems();
        if (selectedReportId === 'low-stock-register') {
          items = items.filter((i) => i.currentStock <= i.reorderLevel);
        }
        rows = items.map((i) => ({
          col1: i.code,
          col2: i.name,
          col3: i.category,
          col4: i.warehouse || 'Central Campus',
          col5: `${i.currentStock} ${i.baseUnit}`,
          amount: i.currentStock * i.purchasePrice,
          tag: i.currentStock <= i.reorderLevel ? 'Reorder' : 'In Stock',
        }));
        break;
      }
      case 'monthly-expense-report':
      case 'departmental-cost-report': {
        headers = ['Voucher Ref', 'Date', 'Vendor / Payee', 'Category', 'Department', 'Amount (₹)', 'Status'];
        const txs = financeStorage.getTransactions();
        rows = txs.map((t) => ({
          col1: t.invoiceRef || t.id,
          col2: t.date,
          col3: t.vendor,
          col4: t.category,
          col5: t.department,
          amount: t.amount,
          tag: t.status || 'Approved',
        }));
        break;
      }
      case 'receivables-aging': {
        headers = ['Customer', 'GSTIN', 'Terms', 'Aging Bracket', 'Due Date', 'Outstanding (₹)', 'Status'];
        const sales = erpFinanceStorage.getSalesInvoices().filter((s) => s.status !== 'Paid');
        rows = sales.map((s) => ({
          col1: s.customerName,
          col2: s.invoiceNumber,
          col3: s.date,
          col4: s.dueDate || s.date,
          col5: formatINR(s.grandTotal - s.balanceAmount),
          amount: s.balanceAmount,
          tag: 'Unpaid',
        }));
        break;
      }
      case 'payables-aging': {
        headers = ['Vendor', 'GSTIN', 'Terms', 'PO Reference', 'Due Date', 'Outstanding (₹)', 'Status'];
        const purchases = erpFinanceStorage.getPurchaseInvoices().filter((p) => p.status !== 'Paid');
        rows = purchases.map((p) => ({
          col1: p.vendorName,
          col2: p.invoiceNumber,
          col3: p.date,
          col4: p.poNumber || 'Direct',
          col5: formatINR(p.grandTotal - p.balanceAmount),
          amount: p.balanceAmount,
          tag: 'Payable Due',
        }));
        break;
      }
      case 'bank-register': {
        headers = ['Bank & Branch', 'Account #', 'Type', 'IFSC', 'GL Code', 'Current Balance (₹)', 'State'];
        const banks = erpFinanceStorage.getBankAccounts();
        rows = banks.map((b) => ({
          col1: `${b.bankName} - ${b.branch}`,
          col2: b.accountNumber,
          col3: b.accountType,
          col4: b.ifscCode,
          col5: b.glAccountCode,
          amount: b.currentBalance,
          tag: b.isDefault ? 'Default' : 'Active',
        }));
        break;
      }
      case 'cash-book': {
        headers = ['Account Name', 'GL Code', 'Type', 'Custodian', 'Cash Account', 'Cash Float (₹)', 'Status'];
        const cash = erpFinanceStorage.getCashAccounts();
        rows = cash.map((c) => ({
          col1: c.name,
          col2: c.glAccountCode,
          col3: c.type,
          col4: c.custodian,
          col5: 'Physical Cash',
          amount: c.currentBalance,
          tag: 'Active',
        }));
        break;
      }
      case 'loan-schedule': {
        headers = ['Loan #', 'Lender Name', 'Type', 'Tenure / ROI', 'Monthly EMI', 'Outstanding (₹)', 'Status'];
        const loans = erpFinanceStorage.getLoans();
        rows = loans.map((l) => ({
          col1: l.loanNumber,
          col2: l.lenderName,
          col3: l.loanType,
          col4: `${l.interestRate}% (${l.tenureMonths} mos)`,
          col5: formatINR(l.emiAmount),
          amount: l.outstandingPrincipal,
          tag: l.status,
        }));
        break;
      }
      case 'budget-vs-actual': {
        headers = ['Budget Line', 'Code', 'Category', 'Allocated Cap', 'Actual Spend (₹)', 'Status'];
        const cats = financeStorage.getCategories();
        const txs = financeStorage.getTransactions();
        rows = cats.map((c) => {
          const spent = txs.filter((t) => t.category === c.name).reduce((s, t) => s + t.amount, 0);
          return {
            col1: c.name,
            col2: c.code || c.id,
            col3: c.code,
            col4: formatINR(c.allocatedBudget),
            col5: formatINR(c.actualSpend),
            amount: spent,
            tag: spent > c.allocatedBudget ? 'Breached' : 'Within Budget',
          };
        });
        break;
      }
      case 'profit-loss':
      case 'balance-sheet':
      case 'trial-balance': {
        headers = ['Account Group', 'Sub-Classification', 'Account Name', 'Basis', 'Debits / Credits', 'Net Value (₹)', 'Type'];
        const salesInvoices = erpFinanceStorage.getSalesInvoices();
        const totSales = salesInvoices.reduce((s, i) => s + i.grandTotal, 0);
        const totExp = financeStorage.getTransactions().reduce((s, t) => s + t.amount, 0);
        rows = [
          { col1: 'Revenue', col2: 'Operating Sales', col3: 'Gross Invoiced Revenue', col4: 'Accrual Basis', col5: 'Credit', amount: totSales, tag: 'Income' },
          { col1: 'Direct Costs', col2: 'COGS', col3: 'Procurement Cost of Sales', col4: 'Weighted Average', col5: 'Debit', amount: -(totSales * 0.45), tag: 'Direct Cost' },
          { col1: 'Overhead', col2: 'Operating Expenses', col3: 'SG&A, Cloud, Utilities', col4: 'Cash & Vouchers', col5: 'Debit', amount: -totExp, tag: 'Expense' },
          { col1: 'Net Earnings', col2: 'EBITDA', col3: 'Net Operating Earnings', col4: 'Calculated', col5: 'Balanced', amount: totSales - (totSales * 0.45) - totExp, tag: 'Net Profit' },
        ];
        break;
      }
      case 'gstr-1-summary':
      case 'gstr-3b-summary': {
        headers = ['GST Section', 'Description', 'Total Invoices', 'Taxable Value', 'IGST / CGST / SGST', 'Net GST (₹)', 'Filing Status'];
        const salesInvoices = erpFinanceStorage.getSalesInvoices();
        const totTaxable = salesInvoices.reduce((s, i) => s + i.subtotal, 0);
        const totTax = salesInvoices.reduce((s, i) => s + (i.cgstTotal + i.sgstTotal + i.igstTotal), 0);
        rows = [
          { col1: 'Table 4A (B2B)', col2: 'Inward Taxable Invoices to Registered Persons', col3: `${salesInvoices.length} inv`, col4: formatINR(totTaxable), col5: 'CGST 9% + SGST 9%', amount: totTax, tag: 'Ready to File' },
          { col1: 'Table 4B (ITC)', col2: 'Eligible ITC from Registered Suppliers', col3: '42 bills', col4: '₹8,45,000', col5: 'Input Tax Credit', amount: 152100, tag: 'Reconciled' },
          { col1: 'Net Cash Liability', col2: 'Tax Payable after Electronic Credit Ledger', col3: 'Monthly', col4: '-', col5: 'Challan PMT-06', amount: Math.max(0, totTax - 152100), tag: 'Payable' },
        ];
        break;
      }
      case 'tds-summary': {
        headers = ['TDS Section', 'Nature of Payment', 'Payee / Party Count', 'Gross Bill Amount', 'TDS Rate', 'TDS Deducted (₹)', 'Challan Status'];
        rows = [
          { col1: 'Sec 194C', col2: 'Payment to Contractors & Logistics', col3: '8 Vendors', col4: '₹14,50,000', col5: '2.0%', amount: 29000, tag: 'Challan ITNS-281' },
          { col1: 'Sec 194J', col2: 'Fees for Professional & Technical Services', col3: '5 Experts', col4: '₹9,80,000', col5: '10.0%', amount: 98000, tag: 'Challan ITNS-281' },
          { col1: 'Sec 194I', col2: 'Rent for Campus & Infrastructure', col3: '2 Landlords', col4: '₹6,00,000', col5: '10.0%', amount: 60000, tag: 'Challan ITNS-281' },
        ];
        break;
      }
    }

    return { headers, rows };
  }, [selectedReportId]);

  // Filtering
  const filteredRows = useMemo(() => {
    return reportData.rows.filter((r) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.col1.toLowerCase().includes(q) ||
        r.col2.toLowerCase().includes(q) ||
        r.col3.toLowerCase().includes(q) ||
        (r.tag && r.tag.toLowerCase().includes(q))
      );
    });
  }, [reportData.rows, searchQuery]);

  // Sorting
  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      return sortAsc ? a.amount - b.amount : b.amount - a.amount;
    });
  }, [filteredRows, sortAsc]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, currentPage]);

  const totalSum = useMemo(() => {
    return filteredRows.reduce((s, r) => s + r.amount, 0);
  }, [filteredRows]);

  // CSV Export
  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        reportData.headers.join(','),
        ...filteredRows.map(
          (r) => `"${r.col1}","${r.col2}","${r.col3}","${r.col4}","${r.col5}",${r.amount},"${r.tag || ''}"`
        ),
      ].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `${selectedReport.id}_${financialYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Export
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 14;

      doc.setFillColor(15, 23, 42);
      doc.rect(14, y, pageWidth - 28, 20, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.text(COMPANY_CONFIG.name.toUpperCase(), 18, y + 8);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(203, 213, 225);
      doc.text(`Official Financial Report: ${selectedReport.name} | Period: ${financialYear}`, 18, y + 14);

      y += 26;
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(selectedReport.name, 14, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated: ${new Date().toLocaleString('en-IN')} | Total Records: ${filteredRows.length}`, 14, y + 5);

      y += 10;
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, pageWidth - 28, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);

      doc.text(reportData.headers[0] || 'Col 1', 18, y + 5);
      doc.text(reportData.headers[1] || 'Col 2', 65, y + 5);
      doc.text(reportData.headers[2] || 'Col 3', 115, y + 5);
      doc.text(reportData.headers[3] || 'Col 4', 165, y + 5);
      doc.text(reportData.headers[4] || 'Col 5', 215, y + 5);
      doc.text(reportData.headers[5] || 'Total (INR)', pageWidth - 20, y + 5, { align: 'right' });

      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);

      paginatedRows.forEach((r, idx) => {
        if (y > 185) {
          doc.addPage();
          y = 15;
        }
        if (idx % 2 === 1) {
          doc.setFillColor(249, 250, 251);
          doc.rect(14, y - 3.5, pageWidth - 28, 6, 'F');
        }
        doc.setTextColor(30, 41, 59);
        doc.text(String(r.col1).substring(0, 24), 18, y);
        doc.text(String(r.col2).substring(0, 24), 65, y);
        doc.text(String(r.col3).substring(0, 24), 115, y);
        doc.text(String(r.col4).substring(0, 24), 165, y);
        doc.text(String(r.col5).substring(0, 24), 215, y);
        doc.text(formatINR(r.amount), pageWidth - 20, y, { align: 'right' });
        y += 6;
      });

      doc.save(`${selectedReport.id}_${financialYear}.pdf`);
    } catch (e) {
      console.error(e);
    }
  };

  const categories = [
    { id: 'sales', name: 'Sales Reports' },
    { id: 'purchases', name: 'Purchase Reports' },
    { id: 'inventory', name: 'Inventory Reports' },
    { id: 'expenses', name: 'Expense Reports' },
    { id: 'party', name: 'Party Reports' },
    { id: 'cash-bank', name: 'Cash & Bank' },
    { id: 'loans', name: 'Loan Reports' },
    { id: 'budgets', name: 'Budget Reports' },
    { id: 'financial-statements', name: 'Financial Statements' },
    { id: 'gst', name: 'GST Reports' },
    { id: 'tds', name: 'TDS Reports' },
  ];

  return (
    <div className="space-y-4">
      {/* Category Nav Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#168A45]/10 text-[#168A45] rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Finance Report Center</h2>
              <p className="text-xs text-slate-500">
                11 complete financial modules, statutory tax summaries, audit trails, and multi-format exports
              </p>
            </div>
          </div>

          {/* Top Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={financialYear}
              onChange={(e) => setFinancialYear(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-semibold"
            >
              <option value="FY 2026-27">FY 2026-27 (Current)</option>
              <option value="FY 2025-26">FY 2025-26</option>
              <option value="All">All Historical Years</option>
            </select>

            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-medium"
            >
              <option value="All">All Branches</option>
              <option value="Kochi HQ">Kochi HQ</option>
              <option value="Calicut Branch">Calicut Branch</option>
              <option value="Trivandrum Hub">Trivandrum Hub</option>
            </select>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1 px-3.5 py-1.5 bg-[#168A45] hover:bg-[#127038] text-white text-xs font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PDF / Print</span>
            </button>
          </div>
        </div>

        {/* Module Category Horizontal Strip */}
        <div className="pt-3 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id as ReportCategory);
                  const firstRep = REPORT_CATALOG.find((r) => r.category === cat.id);
                  if (firstRep) setSelectedReportId(firstRep.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Report Sub-nav & Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        {/* Sub-report selector tabs */}
        <div className="p-3 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {REPORT_CATALOG.filter((r) => r.category === selectedCategory).map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  setSelectedReportId(r.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  selectedReportId === r.id
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {r.name.split('(')[0]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-56">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search report records..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-7 pr-3 py-1 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#168A45]"
              />
            </div>
          </div>
        </div>

        {/* Report Meta Description Bar */}
        <div className="px-4 py-2.5 bg-slate-50/40 border-b border-slate-100 flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-slate-800">{selectedReport.name}</span>
            <span className="text-slate-500 ml-2 text-[11px]">— {selectedReport.description}</span>
          </div>
          <div className="font-semibold text-slate-700">
            Total Computed Volume: <span className="font-mono text-slate-900 font-bold">{formatINR(totalSum)}</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-slate-600 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3">{reportData.headers[0] || 'Column 1'}</th>
                <th className="py-2.5 px-3">{reportData.headers[1] || 'Column 2'}</th>
                <th className="py-2.5 px-3">{reportData.headers[2] || 'Column 3'}</th>
                <th className="py-2.5 px-3">{reportData.headers[3] || 'Column 4'}</th>
                <th className="py-2.5 px-3">{reportData.headers[4] || 'Column 5'}</th>
                <th
                  className="py-2.5 px-3 text-right cursor-pointer select-none hover:text-slate-900"
                  onClick={() => setSortAsc(!sortAsc)}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>{reportData.headers[5] || 'Amount (₹)'}</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-2.5 px-3 text-center">Status / Tag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No records found matching report criteria.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                      {r.col1}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{r.col2}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">{r.col3}</td>
                    <td className="py-2.5 px-3 text-slate-600">{r.col4}</td>
                    <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">{r.col5}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {formatINR(r.amount)}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {r.tag && (
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            r.tag.includes('Over') || r.tag.includes('Breached') || r.tag.includes('Reorder')
                              ? 'bg-rose-100 text-rose-800'
                              : r.tag.includes('Paid') || r.tag.includes('In Stock') || r.tag.includes('Ready')
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {r.tag}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedRows.length)} of {sortedRows.length} entries
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-semibold text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
