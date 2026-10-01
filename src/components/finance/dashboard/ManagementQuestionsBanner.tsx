import React, { useState } from 'react';
import {
  HelpCircle,
  TrendingUp,
  ShoppingCart,
  Receipt,
  DollarSign,
  Users,
  CreditCard,
  Landmark,
  Package,
  Layers,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  PieChart,
  ArrowRight,
} from 'lucide-react';
import { erpFinanceStorage } from '../../../services/finance/erpFinanceStorage';
import { financeStorage } from '../../../services/financeStorageService';
import { FinanceKpiType } from './FinanceKpiDrilldownModal';

interface ManagementQuestionsBannerProps {
  onDrillDown: (kpiType: FinanceKpiType) => void;
  onOpenTraceability: (ref: string) => void;
}

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

export const ManagementQuestionsBanner: React.FC<ManagementQuestionsBannerProps> = ({
  onDrillDown,
  onOpenTraceability,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Compute immediate executive answers
  const salesInvoices = erpFinanceStorage.getSalesInvoices();
  const totalSales = salesInvoices.reduce((s, i) => s + i.grandTotal, 0);

  const purchaseInvoices = erpFinanceStorage.getPurchaseInvoices();
  const totalPurchase = purchaseInvoices.reduce((s, i) => s + i.grandTotal, 0);

  const expenses = financeStorage.getTransactions();
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const cogs = salesInvoices.reduce((s, inv) => {
    return (
      s +
      inv.items.reduce((sum, line) => {
        const itm = erpFinanceStorage.getItemById(line.itemId);
        return sum + (itm?.purchasePrice || line.rate * 0.65) * line.quantity;
      }, 0)
    );
  }, 0);
  const grossProfit = totalSales - cogs;
  const netProfit = grossProfit - totalExpenses;

  const parties = erpFinanceStorage.getParties();
  const receivables = parties.filter((p) => p.currentBalance > 0).reduce((s, p) => s + p.currentBalance, 0);
  const payables = parties.filter((p) => p.currentBalance < 0).reduce((s, p) => s + Math.abs(p.currentBalance), 0);

  const cashAccounts = erpFinanceStorage.getCashAccounts();
  const cashBalance = cashAccounts.reduce((s, c) => s + c.currentBalance, 0);

  const bankAccounts = erpFinanceStorage.getBankAccounts();
  const bankBalance = bankAccounts.reduce((s, b) => s + b.currentBalance, 0);

  const items = erpFinanceStorage.getItems();
  const inventoryValue = items.reduce((s, i) => s + i.currentStock * i.purchasePrice, 0);

  const loans = erpFinanceStorage.getLoans();
  const loanOutstanding = loans.reduce((s, l) => s + l.outstandingPrincipal, 0);

  const overdueSales = salesInvoices.filter((si) => si.status !== 'Paid' && si.dueDate && si.dueDate < new Date().toISOString().split('T')[0]);
  const overdueReceivables = overdueSales.reduce((s, i) => s + i.balanceAmount, 0);

  const managementQuestions = [
    {
      q: 'How much did we sell?',
      ans: formatINR(totalSales),
      sub: `${salesInvoices.length} tax invoices generated`,
      kpi: 'total-sales' as FinanceKpiType,
      color: 'text-emerald-700',
    },
    {
      q: 'How much did we purchase?',
      ans: formatINR(totalPurchase),
      sub: `${purchaseInvoices.length} vendor bills posted`,
      kpi: 'total-purchase' as FinanceKpiType,
      color: 'text-blue-700',
    },
    {
      q: 'How much did we spend on operations?',
      ans: formatINR(totalExpenses),
      sub: `${expenses.length} operating vouchers`,
      kpi: 'total-expenses' as FinanceKpiType,
      color: 'text-rose-700',
    },
    {
      q: 'What is our Gross & Net Profit?',
      ans: `${formatINR(grossProfit)} / ${formatINR(netProfit)}`,
      sub: `Gross margin: ${((grossProfit / (totalSales || 1)) * 100).toFixed(1)}%`,
      kpi: 'gross-profit' as FinanceKpiType,
      color: 'text-emerald-800',
    },
    {
      q: 'What do customers owe us (Receivables)?',
      ans: formatINR(receivables),
      sub: `${parties.filter((p) => p.currentBalance > 0).length} debtor accounts active`,
      kpi: 'receivables' as FinanceKpiType,
      color: 'text-amber-700',
    },
    {
      q: 'What do we owe vendors (Payables)?',
      ans: formatINR(payables),
      sub: `${parties.filter((p) => p.currentBalance < 0).length} creditor accounts due`,
      kpi: 'payables' as FinanceKpiType,
      color: 'text-purple-700',
    },
    {
      q: 'Total Cash and Bank balances available?',
      ans: `${formatINR(cashBalance + bankBalance)}`,
      sub: `Cash: ${formatINR(cashBalance)} | Bank: ${formatINR(bankBalance)}`,
      kpi: 'bank-balance' as FinanceKpiType,
      color: 'text-blue-800',
    },
    {
      q: 'What is total inventory stock value?',
      ans: formatINR(inventoryValue),
      sub: `${items.length} SKUs valued at FIFO cost`,
      kpi: 'inventory-value' as FinanceKpiType,
      color: 'text-teal-700',
    },
    {
      q: 'What is our total outstanding bank debt?',
      ans: formatINR(loanOutstanding),
      sub: `${loans.length} sanctioned loan facilities`,
      kpi: 'loan-outstanding' as FinanceKpiType,
      color: 'text-slate-800',
    },
    {
      q: 'How much is in overdue customer invoices?',
      ans: formatINR(overdueReceivables),
      sub: `${overdueSales.length} overdue invoices needing recovery`,
      kpi: 'receivables' as FinanceKpiType,
      color: 'text-rose-800',
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              Management Executive FAQs & Quick Answers
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                10 Instant Key Queries
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Immediate executive answers to core business questions with 1-click drill-down to source transactions
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50/70 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
        >
          <span>{isExpanded ? 'Collapse Questions' : 'Explore All Questions'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5">
          {managementQuestions.map((mq, idx) => (
            <div
              key={idx}
              onClick={() => onDrillDown(mq.kpi)}
              className="p-3 bg-slate-50 hover:bg-indigo-50/60 rounded-xl border border-slate-200/80 hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <h4 className="text-[11px] font-bold text-slate-700 group-hover:text-indigo-900 leading-snug">
                  {mq.q}
                </h4>
                <div className={`text-sm font-black font-mono mt-2 ${mq.color}`}>
                  {mq.ans}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">{mq.sub}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-bold text-indigo-700">
                <span>View Source Ledger</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
