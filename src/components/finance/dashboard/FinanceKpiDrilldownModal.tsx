import React, { useState, useMemo } from 'react';
import {
  X,
  Download,
  Search,
  ArrowRight,
  ExternalLink,
  DollarSign,
  TrendingUp,
  FileText,
  Calendar,
  Building2,
  Users,
  CreditCard,
  Package,
  Layers,
} from 'lucide-react';
import { erpFinanceStorage } from '../../../services/finance/erpFinanceStorage';
import { financeStorage } from '../../../services/financeStorageService';

export type FinanceKpiType =
  | 'total-sales'
  | 'total-purchase'
  | 'total-expenses'
  | 'gross-profit'
  | 'net-profit'
  | 'receivables'
  | 'payables'
  | 'cash-balance'
  | 'bank-balance'
  | 'inventory-value'
  | 'loan-outstanding'
  | 'total-budget'
  | 'budget-utilization';

interface FinanceKpiDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  kpiType: FinanceKpiType | null;
  onViewTraceability: (ref: string) => void;
}

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(val);
};

export const FinanceKpiDrilldownModal: React.FC<FinanceKpiDrilldownModalProps> = ({
  isOpen,
  onClose,
  kpiType,
  onViewTraceability,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const kpiDetails = useMemo(() => {
    if (!kpiType) return null;

    let title = '';
    let subtitle = '';
    let headers: string[] = [];
    let rows: {
      id: string;
      ref: string;
      date?: string;
      party?: string;
      description?: string;
      category?: string;
      amount: number;
      status?: string;
    }[] = [];

    switch (kpiType) {
      case 'total-sales': {
        title = 'Total Sales — Source Invoices Drill-Down';
        subtitle = 'All confirmed sales invoices billed to clients in current financial period';
        headers = ['Invoice #', 'Date', 'Customer', 'Category / Cost Center', 'Tax Amount', 'Grand Total', 'Status'];
        const list = erpFinanceStorage.getSalesInvoices();
        rows = list.map((si) => ({
          id: si.id,
          ref: si.invoiceNumber,
          date: si.date,
          party: si.customerName,
          category: si.costCenter,
          description: `Items: ${si.items.map((i) => i.itemName).join(', ')}`,
          amount: si.grandTotal,
          status: si.status,
        }));
        break;
      }
      case 'total-purchase': {
        title = 'Total Purchases — Source Vendor Bills Drill-Down';
        subtitle = 'All verified purchase bills from approved suppliers';
        headers = ['Invoice #', 'Date', 'Vendor', 'Cost Center', 'Due Date', 'Grand Total', 'Status'];
        const list = erpFinanceStorage.getPurchaseInvoices();
        rows = list.map((pi) => ({
          id: pi.id,
          ref: pi.invoiceNumber,
          date: pi.date,
          party: pi.vendorName,
          category: pi.costCenter,
          description: `Due: ${pi.dueDate}`,
          amount: pi.grandTotal,
          status: pi.status,
        }));
        break;
      }
      case 'total-expenses': {
        title = 'Total Operating Expenses Drill-Down';
        subtitle = 'All approved operational, administrative, and technological expenditures';
        headers = ['Voucher Ref', 'Date', 'Vendor / Payee', 'Category', 'Department', 'Amount', 'Status'];
        const list = financeStorage.getTransactions();
        rows = list.map((e) => ({
          id: e.id,
          ref: e.invoiceRef || e.id,
          date: e.date,
          party: e.vendor,
          category: e.category,
          description: `${e.department} - ${e.description}`,
          amount: e.amount,
          status: e.status || 'Approved',
        }));
        break;
      }
      case 'gross-profit': {
        title = 'Gross Profit Computation Drill-Down';
        subtitle = 'Revenue minus Direct Cost of Goods Sold (COGS)';
        headers = ['Revenue / Cost Stream', 'Classification', 'Reference Basis', 'Gross Amount', 'Net Margin'];
        const salesInvoices = erpFinanceStorage.getSalesInvoices();
        const totSales = salesInvoices.reduce((s, i) => s + i.grandTotal, 0);
        const totCogs = salesInvoices.reduce((s, inv) => {
          return (
            s +
            inv.items.reduce((sum, line) => {
              const itm = erpFinanceStorage.getItemById(line.itemId);
              return sum + (itm?.purchasePrice || line.rate * 0.65) * line.quantity;
            }, 0)
          );
        }, 0);
        rows = [
          {
            id: 'rev-1',
            ref: 'REV-STREAM',
            party: 'Edutech & Cloud Training Sales',
            category: 'Sales Revenue',
            description: 'Direct billing from all confirmed sales invoices',
            amount: totSales,
            status: 'Income',
          },
          {
            id: 'cogs-1',
            ref: 'COGS-DIRECT',
            party: 'Hardware & Material Procurement',
            category: 'Cost of Sales',
            description: 'Direct costs of inventory items shipped and lab equipment',
            amount: -totCogs,
            status: 'Cost of Goods',
          },
        ];
        break;
      }
      case 'net-profit': {
        title = 'Net Profit Computation Drill-Down';
        subtitle = 'Gross Profit minus Operating Expenses, Depreciation, and Finance Costs';
        headers = ['Account Line', 'Classification', 'Notes', 'Amount', 'Status'];
        const salesInvoices = erpFinanceStorage.getSalesInvoices();
        const totSales = salesInvoices.reduce((s, i) => s + i.grandTotal, 0);
        const totExp = financeStorage.getTransactions().reduce((s, e) => s + e.amount, 0);
        const totLoans = erpFinanceStorage.getLoanRepayments().reduce((s, l) => s + l.interestPaid, 0);
        rows = [
          {
            id: 'np-rev',
            ref: 'GL-4000',
            party: 'Total Operating Sales',
            category: 'Operating Income',
            description: 'Cumulative billed turnover',
            amount: totSales,
            status: 'Income',
          },
          {
            id: 'np-exp',
            ref: 'GL-6000',
            party: 'Operating Overhead & SG&A',
            category: 'Operating Expense',
            description: 'Salaries, utilities, cloud infra, and marketing',
            amount: -totExp,
            status: 'Expense',
          },
          {
            id: 'np-int',
            ref: 'GL-6100',
            party: 'Loan Interest & Bank Charges',
            category: 'Financial Charges',
            description: 'Borrowing costs and bank fees',
            amount: -totLoans,
            status: 'Finance Cost',
          },
        ];
        break;
      }
      case 'receivables': {
        title = 'Accounts Receivable (Trade Debtors) Drill-Down';
        subtitle = 'Itemized customer balances and unpaid sales invoices';
        headers = ['Customer Name', 'Code', 'Total Due', 'Current Balance', 'Credit Limit', 'Status'];
        const parties = erpFinanceStorage.getParties('Customer');
        rows = parties
          .filter((p) => p.currentBalance > 0)
          .map((p) => ({
            id: p.id,
            ref: p.code,
            party: p.name,
            category: p.category || 'Customer',
            description: `GSTIN: ${p.gstin || 'Unregistered'} | Terms: ${p.paymentTerms}`,
            amount: p.currentBalance,
            status: p.currentBalance > p.creditLimit ? 'Over Limit' : 'Regular',
          }));
        break;
      }
      case 'payables': {
        title = 'Accounts Payable (Trade Creditors) Drill-Down';
        subtitle = 'Itemized vendor balances and outstanding bills';
        headers = ['Vendor Name', 'Code', 'Total Due', 'Current Balance', 'Payment Terms', 'Status'];
        const parties = erpFinanceStorage.getParties('Vendor');
        rows = parties
          .filter((p) => p.currentBalance < 0)
          .map((p) => ({
            id: p.id,
            ref: p.code,
            party: p.name,
            category: p.category || 'Vendor',
            description: `GSTIN: ${p.gstin || 'Unregistered'} | Terms: ${p.paymentTerms}`,
            amount: Math.abs(p.currentBalance),
            status: 'Payable Due',
          }));
        break;
      }
      case 'cash-balance': {
        title = 'Cash in Hand & Petty Cash Accounts Drill-Down';
        subtitle = 'Physical cash accounts across campuses and administrative offices';
        headers = ['Account Name', 'Code', 'Type / Custodian', 'GL Code', 'Current Balance', 'Status'];
        const cashAccs = erpFinanceStorage.getCashAccounts();
        rows = cashAccs.map((c) => ({
          id: c.id,
          ref: c.glAccountCode,
          party: c.name,
          category: c.type,
          description: `Custodian: ${c.custodian} | GL: ${c.glAccountCode}`,
          amount: c.currentBalance,
          status: 'Active',
        }));
        break;
      }
      case 'bank-balance': {
        title = 'Bank Accounts & Balances Drill-Down';
        subtitle = 'Commercial banking accounts, current accounts, and fixed deposits';
        headers = ['Bank & Branch', 'Account Number', 'Account Type', 'IFSC Code', 'Available Balance', 'Status'];
        const bankAccs = erpFinanceStorage.getBankAccounts();
        rows = bankAccs.map((b) => ({
          id: b.id,
          ref: b.accountNumber,
          party: `${b.bankName} - ${b.branch}`,
          category: b.accountType,
          description: `IFSC: ${b.ifscCode} | GL: ${b.glAccountCode}`,
          amount: b.currentBalance,
          status: b.isDefault ? 'Default / Active' : 'Active',
        }));
        break;
      }
      case 'inventory-value': {
        title = 'Inventory Valuation Drill-Down';
        subtitle = 'Perpetual stock items valued at FIFO cost';
        headers = ['Item Name', 'Code / SKU', 'Category', 'Current Stock', 'Unit Cost', 'Total Valuation', 'Status'];
        const items = erpFinanceStorage.getItems();
        rows = items.map((i) => ({
          id: i.id,
          ref: i.code,
          party: i.name,
          category: i.category,
          description: `Stock: ${i.currentStock} ${i.baseUnit} @ ₹${i.purchasePrice}`,
          amount: i.currentStock * i.purchasePrice,
          status: i.currentStock <= i.reorderLevel ? 'Reorder Needed' : 'Normal',
        }));
        break;
      }
      case 'loan-outstanding': {
        title = 'Loan Outstanding & Debt Schedule Drill-Down';
        subtitle = 'Term loans, overdrafts, and vehicle debt';
        headers = ['Loan Number', 'Lender Name', 'Loan Type', 'Sanctioned Amount', 'Outstanding Principal', 'Status'];
        const loans = erpFinanceStorage.getLoans();
        rows = loans.map((l) => ({
          id: l.id,
          ref: l.loanNumber,
          party: l.lenderName,
          category: l.loanType,
          description: `ROI: ${l.interestRate}% | Tenure: ${l.tenureMonths} mos | EMI: ₹${l.emiAmount.toLocaleString('en-IN')}`,
          amount: l.outstandingPrincipal,
          status: l.status,
        }));
        break;
      }
      case 'total-budget': {
        title = 'Annual Budget Allocation Drill-Down';
        subtitle = 'Cap allocations across departmental budget lines';
        headers = ['Budget Line', 'Code', 'Category', 'Allocated Budget', 'Actual Spend', 'Status'];
        const cats = financeStorage.getCategories();
        rows = cats.map((c) => ({
          id: c.id,
          ref: c.code || c.id,
          party: c.name,
          category: c.code,
          description: `Allocated: ${formatINR(c.allocatedBudget)} | Spend: ${formatINR(c.actualSpend)}`,
          amount: c.allocatedBudget,
          status: c.actualSpend > c.allocatedBudget ? 'Exceeded' : 'Within Budget',
        }));
        break;
      }
      case 'budget-utilization': {
        title = 'Budget Utilization & Variance Drill-Down';
        subtitle = 'Departmental expenditure vs allocated budget caps';
        headers = ['Category', 'Code', 'Allocated Cap', 'Actual Spent', 'Remaining', 'Utilization %'];
        const cats = financeStorage.getCategories();
        const txs = financeStorage.getTransactions();
        rows = cats.map((c) => {
          const spent = txs
            .filter((t) => t.category === c.name)
            .reduce((s, t) => s + t.amount, 0);
          const utilPct = c.allocatedBudget > 0 ? (spent / c.allocatedBudget) * 100 : 0;
          return {
            id: c.id,
            ref: c.code || c.id,
            party: c.name,
            category: c.code,
            description: `Spent: ${formatINR(spent)} of ${formatINR(c.allocatedBudget)} (${utilPct.toFixed(1)}%)`,
            amount: spent,
            status: utilPct > 100 ? 'Over Budget' : utilPct >= 90 ? 'Near Cap' : 'Within Budget',
          };
        });
        break;
      }
    }

    return { title, subtitle, headers, rows };
  }, [kpiType]);

  const filteredRows = useMemo(() => {
    if (!kpiDetails) return [];
    if (!searchTerm.trim()) return kpiDetails.rows;

    const q = searchTerm.toLowerCase();
    return kpiDetails.rows.filter(
      (r) =>
        r.ref.toLowerCase().includes(q) ||
        (r.party && r.party.toLowerCase().includes(q)) ||
        (r.description && r.description.toLowerCase().includes(q)) ||
        (r.category && r.category.toLowerCase().includes(q)) ||
        (r.status && r.status.toLowerCase().includes(q))
    );
  }, [kpiDetails, searchTerm]);

  const totalFilteredAmount = useMemo(() => {
    return filteredRows.reduce((sum, r) => sum + r.amount, 0);
  }, [filteredRows]);

  const handleExportCSV = () => {
    if (!kpiDetails) return;
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Reference,Party/Entity,Category,Details,Amount,Status',
        ...filteredRows.map(
          (r) =>
            `"${r.ref}","${r.party || ''}","${r.category || ''}","${(r.description || '').replace(/"/g, '""')}",${r.amount},"${r.status || ''}"`
        ),
      ].join('\n');

    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `${kpiType}_Drilldown.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen || !kpiDetails) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 rounded-xl border border-blue-500/30">
              <Layers className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{kpiDetails.title}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{kpiDetails.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by reference, party, or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#168A45]"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-xs text-slate-600 font-semibold">
              Total: <span className="font-mono text-slate-900 text-sm font-bold">{formatINR(totalFilteredAmount)}</span>
            </div>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Records Table */}
        <div className="overflow-x-auto flex-1 p-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3">Reference / Code</th>
                <th className="py-2.5 px-3">Party / Item / Entity</th>
                <th className="py-2.5 px-3">Category / Classification</th>
                <th className="py-2.5 px-3">Details & Notes</th>
                <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Trace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No transactions matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredRows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                      {r.ref}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      {r.party || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      <span className="px-2 py-0.5 rounded-md text-[11px] bg-slate-100 text-slate-700 font-medium">
                        {r.category || '-'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate" title={r.description}>
                      {r.description || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap text-slate-900">
                      {formatINR(r.amount)}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          r.status?.includes('Over') || r.status?.includes('Reorder')
                            ? 'bg-rose-100 text-rose-800'
                            : r.status?.includes('Paid') || r.status?.includes('Completed') || r.status?.includes('Normal')
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {r.status || 'Active'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => onViewTraceability(r.ref)}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                        title="View Complete Traceability Chain"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filteredRows.length} source records</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
