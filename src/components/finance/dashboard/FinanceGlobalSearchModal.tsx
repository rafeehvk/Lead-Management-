import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  FileText,
  Building2,
  Users,
  CreditCard,
  Receipt,
  Package,
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
  Tag,
} from 'lucide-react';
import { erpFinanceStorage } from '../../../services/finance/erpFinanceStorage';
import { financeStorage } from '../../../services/financeStorageService';

interface FinanceGlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (type: string, reference: string) => void;
}

interface SearchResultItem {
  id: string;
  module:
    | 'Sales'
    | 'Purchases'
    | 'Payments'
    | 'Receipts'
    | 'Parties'
    | 'Items'
    | 'Loans'
    | 'Budgets'
    | 'Expenses'
    | 'Cheques';
  title: string;
  reference: string;
  subtitle: string;
  amount?: number;
  date?: string;
  status?: string;
}

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

export const FinanceGlobalSearchModal: React.FC<FinanceGlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectResult,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('All');

  const allRecords = useMemo<SearchResultItem[]>(() => {
    const list: SearchResultItem[] = [];

    // Sales Invoices
    const salesInvoices = erpFinanceStorage.getSalesInvoices();
    salesInvoices.forEach((si) => {
      list.push({
        id: `si-${si.id}`,
        module: 'Sales',
        title: `Sales Invoice - ${si.customerName}`,
        reference: si.invoiceNumber,
        subtitle: `Order: ${si.orderNumber || 'Direct'} | Due: ${si.dueDate}`,
        amount: si.grandTotal,
        date: si.date,
        status: si.status,
      });
    });

    // Purchase Invoices
    const purchaseInvoices = erpFinanceStorage.getPurchaseInvoices();
    purchaseInvoices.forEach((pi) => {
      list.push({
        id: `pi-${pi.id}`,
        module: 'Purchases',
        title: `Purchase Bill - ${pi.vendorName}`,
        reference: pi.invoiceNumber,
        subtitle: `PO: ${pi.poNumber || 'Direct'} | Cost Center: ${pi.costCenter}`,
        amount: pi.grandTotal,
        date: pi.date,
        status: pi.status,
      });
    });

    // Purchase Orders
    const pos = erpFinanceStorage.getPurchaseOrders();
    pos.forEach((po) => {
      list.push({
        id: `po-${po.id}`,
        module: 'Purchases',
        title: `Purchase Order - ${po.vendorName}`,
        reference: po.poNumber,
        subtitle: `Dept: ${po.department} | ${po.items.length} line items`,
        amount: po.grandTotal,
        date: po.date,
        status: po.status,
      });
    });

    // Payments
    const payments = erpFinanceStorage.getPayments();
    payments.forEach((pay) => {
      list.push({
        id: `pay-${pay.id}`,
        module: 'Payments',
        title: `Vendor Payment - ${pay.partyName}`,
        reference: pay.paymentNumber,
        subtitle: `Account: ${pay.accountName} | Mode: ${pay.paymentMethod}`,
        amount: pay.amount,
        date: pay.date,
        status: pay.status,
      });
    });

    // Receipts
    const receipts = erpFinanceStorage.getReceipts();
    receipts.forEach((rec) => {
      list.push({
        id: `rec-${rec.id}`,
        module: 'Receipts',
        title: `Customer Receipt - ${rec.partyName}`,
        reference: rec.receiptNumber,
        subtitle: `Account: ${rec.accountName} | Mode: ${rec.paymentMethod}`,
        amount: rec.amount,
        date: rec.date,
        status: rec.status,
      });
    });

    // Parties
    const parties = erpFinanceStorage.getParties();
    parties.forEach((p) => {
      list.push({
        id: `prt-${p.id}`,
        module: 'Parties',
        title: `${p.name} (${p.type})`,
        reference: p.code,
        subtitle: `GSTIN: ${p.gstin || 'Unregistered'} | City: ${p.city || 'Kochi'}`,
        amount: Math.abs(p.currentBalance),
        date: p.createdDate,
        status: p.status,
      });
    });

    // Items
    const items = erpFinanceStorage.getItems();
    items.forEach((item) => {
      list.push({
        id: `itm-${item.id}`,
        module: 'Items',
        title: item.name,
        reference: item.code,
        subtitle: `SKU: ${item.sku} | Stock: ${item.currentStock} ${item.baseUnit} | Rate: ₹${item.salesPrice}`,
        amount: item.currentStock * item.purchasePrice,
        status: item.currentStock <= item.reorderLevel ? 'Low Stock' : 'In Stock',
      });
    });

    // Loans
    const loans = erpFinanceStorage.getLoans();
    loans.forEach((l) => {
      list.push({
        id: `loan-${l.id}`,
        module: 'Loans',
        title: `${l.lenderName} (${l.loanType})`,
        reference: l.loanNumber,
        subtitle: `Principal: ₹${l.principalAmount.toLocaleString('en-IN')} | ROI: ${l.interestRate}%`,
        amount: l.outstandingPrincipal,
        date: l.startDate,
        status: l.status,
      });
    });

    // Budgets
    const budgetCategories = financeStorage.getCategories();
    budgetCategories.forEach((b) => {
      list.push({
        id: `bgt-${b.id}`,
        module: 'Budgets',
        title: `Budget: ${b.name}`,
        reference: b.code || `BGT-${b.id.slice(0, 6)}`,
        subtitle: `Allocated: ₹${b.allocatedBudget.toLocaleString('en-IN')} | Spend: ₹${b.actualSpend.toLocaleString('en-IN')}`,
        amount: b.allocatedBudget,
      });
    });

    // Expenses
    const expenses = financeStorage.getTransactions();
    expenses.forEach((e) => {
      list.push({
        id: `exp-${e.id}`,
        module: 'Expenses',
        title: e.description,
        reference: e.invoiceRef || e.id,
        subtitle: `Vendor: ${e.vendor} | Dept: ${e.department} | Cat: ${e.category}`,
        amount: e.amount,
        date: e.date,
        status: e.status || 'Approved',
      });
    });

    // Cheques
    const cheques = erpFinanceStorage.getCheques();
    cheques.forEach((chq) => {
      list.push({
        id: `chq-${chq.id}`,
        module: 'Cheques',
        title: `Cheque (${chq.type}) - ${chq.partyName}`,
        reference: chq.chequeNumber,
        subtitle: `Bank: ${chq.bankName} | Maturity: ${chq.maturityDate}`,
        amount: chq.amount,
        date: chq.chequeDate,
        status: chq.status,
      });
    });

    return list;
  }, [isOpen]);

  // Filtered results
  const filteredResults = useMemo(() => {
    if (!searchTerm.trim()) {
      return [];
    }

    const query = searchTerm.toLowerCase().trim();

    return allRecords.filter((rec) => {
      const matchModule = selectedModuleFilter === 'All' || rec.module === selectedModuleFilter;
      const matchText =
        rec.title.toLowerCase().includes(query) ||
        rec.reference.toLowerCase().includes(query) ||
        rec.subtitle.toLowerCase().includes(query) ||
        (rec.status && rec.status.toLowerCase().includes(query));

      return matchModule && matchText;
    });
  }, [searchTerm, selectedModuleFilter, allRecords]);

  // Grouping by module
  const groupedResults = useMemo(() => {
    const groups: { [key: string]: SearchResultItem[] } = {};
    filteredResults.forEach((item) => {
      if (!groups[item.module]) {
        groups[item.module] = [];
      }
      groups[item.module].push(item);
    });
    return groups;
  }, [filteredResults]);

  if (!isOpen) return null;

  const modules = ['All', 'Sales', 'Purchases', 'Payments', 'Receipts', 'Parties', 'Items', 'Loans', 'Budgets', 'Expenses', 'Cheques'];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Search Header Input */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search invoice #, PO #, party, customer, vendor, payment, cheque, item, budget..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-slate-400 hover:text-slate-600 text-xs font-semibold px-2 py-1 rounded-md"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Module Filter Chips */}
        <div className="px-4 py-2.5 border-b border-slate-100 bg-white flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 mr-1">Modules:</span>
          {modules.map((m) => (
            <button
              key={m}
              onClick={() => setSelectedModuleFilter(m)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedModuleFilter === m
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="p-4 overflow-y-auto divide-y divide-slate-100 space-y-4">
          {!searchTerm.trim() ? (
            <div className="py-12 text-center text-slate-400">
              <Search className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">Global Financial Record Search</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Type any invoice number (e.g. SI-2026, PI-2026), PO, party name, item, payment reference, or cheque number to locate records instantly.
              </p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm font-medium text-slate-600">No matching financial records found for "{searchTerm}"</p>
              <p className="text-xs text-slate-400 mt-1">Try searching with a partial number or check module filters.</p>
            </div>
          ) : (
            (Object.entries(groupedResults) as [string, SearchResultItem[]][]).map(([moduleName, items]) => (
              <div key={moduleName} className="pt-2 first:pt-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Tag className="w-3 h-3 text-[#168A45]" />
                    {moduleName} ({items.length})
                  </span>
                </div>

                <div className="space-y-1.5">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        onSelectResult(item.module, item.reference);
                        onClose();
                      }}
                      className="p-3 bg-slate-50 hover:bg-slate-100/90 rounded-xl border border-slate-200/70 transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-blue-700 group-hover:underline">
                            {item.reference}
                          </span>
                          <span className="text-xs font-semibold text-slate-900 truncate">{item.title}</span>
                          {item.status && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-slate-200 text-slate-700">
                              {item.status}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate">{item.subtitle}</div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 text-right">
                        {item.amount !== undefined && (
                          <div className="font-mono text-xs font-bold text-slate-900">
                            {formatINR(item.amount)}
                          </div>
                        )}
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span>Press ESC or click outside to dismiss</span>
          <span>{filteredResults.length} records matched</span>
        </div>
      </div>
    </div>
  );
};
