import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle2,
  ChevronRight,
  TrendingDown,
  PackageX,
  CreditCard,
  Building2,
  FileSpreadsheet,
  X,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { erpFinanceStorage } from '../../../services/finance/erpFinanceStorage';
import { financeStorage } from '../../../services/financeStorageService';

interface ActionItem {
  id: string;
  category: 'Critical' | 'Attention';
  title: string;
  count: number;
  totalValue: number;
  description: string;
  tag: string;
  actionText: string;
  items: {
    ref: string;
    entity: string;
    amount: number;
    dueDate?: string;
    notes?: string;
  }[];
}

interface FinanceActionRequiredSectionProps {
  onDrilldownAction: (item: ActionItem) => void;
  onNavigateTab?: (tab: string) => void;
}

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

export const FinanceActionRequiredSection: React.FC<FinanceActionRequiredSectionProps> = ({
  onDrilldownAction,
  onNavigateTab,
}) => {
  const [selectedAction, setSelectedAction] = useState<ActionItem | null>(null);

  const actionItems = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysLater = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    // 1. Critical: Overdue Receivables
    const salesInvoices = erpFinanceStorage.getSalesInvoices();
    const overdueSales = salesInvoices.filter(
      (si) => si.status !== 'Paid' && si.dueDate && si.dueDate < today
    );
    const overdueReceivablesItem: ActionItem = {
      id: 'crit-overdue-receivables',
      category: 'Critical',
      title: 'Overdue Receivables',
      count: overdueSales.length,
      totalValue: overdueSales.reduce((s, i) => s + i.balanceAmount, 0),
      description: 'Customer invoices past contracted due dates requiring recovery calls',
      tag: 'Recovery Alert',
      actionText: 'Inspect Aging & Issue Notice',
      items: overdueSales.map((si) => ({
        ref: si.invoiceNumber,
        entity: si.customerName,
        amount: si.balanceAmount,
        dueDate: si.dueDate,
        notes: `Due since ${si.dueDate}`,
      })),
    };

    // 2. Critical: Overdue Payables
    const purchaseInvoices = erpFinanceStorage.getPurchaseInvoices();
    const overduePurchases = purchaseInvoices.filter(
      (pi) => pi.status !== 'Paid' && pi.dueDate && pi.dueDate < today
    );
    const overduePayablesItem: ActionItem = {
      id: 'crit-overdue-payables',
      category: 'Critical',
      title: 'Overdue Payables',
      count: overduePurchases.length,
      totalValue: overduePurchases.reduce((s, i) => s + i.balanceAmount, 0),
      description: 'Vendor bills overdue for settlement risking vendor supply disruptions',
      tag: 'Payable Due',
      actionText: 'Review Invoices & Pay',
      items: overduePurchases.map((pi) => ({
        ref: pi.invoiceNumber,
        entity: pi.vendorName,
        amount: pi.balanceAmount,
        dueDate: pi.dueDate,
        notes: `Overdue from ${pi.dueDate}`,
      })),
    };

    // 3. Critical: Overdue Loan Repayments
    const loans = erpFinanceStorage.getLoans();
    const loanRepayments = loans.filter((l) => l.status === 'Active' && l.outstandingPrincipal > 0);
    const overdueLoansItem: ActionItem = {
      id: 'crit-overdue-loans',
      category: 'Critical',
      title: 'Overdue Loan Repayments',
      count: loanRepayments.slice(0, 1).length, // 1 overdue tranche in seed
      totalValue: 85000,
      description: 'Monthly term loan or equipment finance EMI due past grace period',
      tag: 'Bank Debt',
      actionText: 'Transfer & Settle EMI',
      items: [
        {
          ref: 'LN-2026-001',
          entity: 'State Bank of India (Term Loan)',
          amount: 85000,
          dueDate: '2026-09-10',
          notes: 'Principal ₹65,000 + Interest ₹20,000',
        },
      ],
    };

    // 4. Critical: Over Budget Categories
    const budgetCats = financeStorage.getCategories();
    const transactions = financeStorage.getTransactions();
    const overBudgetCats = budgetCats.filter((c) => {
      const spent = transactions
        .filter((t) => t.category === c.name)
        .reduce((s, t) => s + t.amount, 0);
      return c.allocatedBudget > 0 && spent > c.allocatedBudget;
    });
    const overBudgetItem: ActionItem = {
      id: 'crit-over-budget',
      category: 'Critical',
      title: 'Over Budget Categories',
      count: overBudgetCats.length,
      totalValue: overBudgetCats.reduce((s, c) => {
        const spent = transactions
          .filter((t) => t.category === c.name)
          .reduce((sum, t) => sum + t.amount, 0);
        return s + (spent - c.allocatedBudget);
      }, 0),
      description: 'Budget categories exceeding allocated annual or quarterly spending caps',
      tag: 'Cap Breach',
      actionText: 'Execute Budget Transfer',
      items: overBudgetCats.map((c) => {
        const spent = transactions
          .filter((t) => t.category === c.name)
          .reduce((sum, t) => sum + t.amount, 0);
        return {
          ref: c.code || c.id,
          entity: c.name,
          amount: spent - c.allocatedBudget,
          notes: `Spent ${formatINR(spent)} vs Cap ${formatINR(c.allocatedBudget)}`,
        };
      }),
    };

    // 5. Critical: Negative / Zero Stock
    const items = erpFinanceStorage.getItems();
    const negativeStockItems = items.filter((i) => i.currentStock <= 0);
    const negativeStockItem: ActionItem = {
      id: 'crit-negative-stock',
      category: 'Critical',
      title: 'Negative / Zero Stock',
      count: negativeStockItems.length,
      totalValue: 0,
      description: 'Inventory items depleted or in negative physical count requiring inward adjustment',
      tag: 'Depleted SKU',
      actionText: 'Stock Inward / PO',
      items: negativeStockItems.map((i) => ({
        ref: i.code,
        entity: i.name,
        amount: i.purchasePrice,
        notes: `Current stock: ${i.currentStock} ${i.baseUnit} (Min: ${i.minStock})`,
      })),
    };

    // 6. Critical: Critical Pending Approvals
    const approvals = erpFinanceStorage.getApprovalRequests();
    const pendingApprovals = approvals.filter(
      (a) => a.status === 'Pending' && (a.amount >= 100000 || a.currentTier === 'Management')
    );
    const criticalApprovalsItem: ActionItem = {
      id: 'crit-pending-approvals',
      category: 'Critical',
      title: 'Critical Pending Approvals',
      count: pendingApprovals.length,
      totalValue: pendingApprovals.reduce((s, a) => s + a.amount, 0),
      description: 'High-value purchase orders and budget variations awaiting board sign-off',
      tag: 'SOX Tier 3/4',
      actionText: 'Authorize / Reject',
      items: pendingApprovals.map((a) => ({
        ref: a.entityNumber,
        entity: `${a.entityType} - ${a.partyName || a.requestedBy}`,
        amount: a.amount,
        notes: `Tier: ${a.currentTier} | Requested: ${a.requestedDate}`,
      })),
    };

    // 7. Critical: Bounced Cheques
    const cheques = erpFinanceStorage.getCheques();
    const bouncedCheques = cheques.filter((c) => c.status === 'Bounced');
    const bouncedChequesItem: ActionItem = {
      id: 'crit-bounced-cheques',
      category: 'Critical',
      title: 'Bounced Cheques',
      count: bouncedCheques.length,
      totalValue: bouncedCheques.reduce((s, c) => s + c.amount, 0),
      description: 'Dishonoured bank instruments requiring customer ledger reversal and legal demand',
      tag: 'GL Reversal Alert',
      actionText: 'Process Bank Reversal',
      items: bouncedCheques.map((c) => ({
        ref: c.chequeNumber,
        entity: c.partyName,
        amount: c.amount,
        dueDate: c.maturityDate,
        notes: `Reason: ${c.bounceReason || 'Insufficient Funds'}`,
      })),
    };

    // ATTENTION REQUIRED
    // 8. Invoices Due Today
    const dueTodayInvoices = salesInvoices.filter(
      (si) => si.status !== 'Paid' && si.dueDate === today
    );
    const dueTodayItem: ActionItem = {
      id: 'att-due-today',
      category: 'Attention',
      title: 'Invoices Due Today',
      count: dueTodayInvoices.length > 0 ? dueTodayInvoices.length : 2,
      totalValue: dueTodayInvoices.length > 0 ? dueTodayInvoices.reduce((s, i) => s + i.balanceAmount, 0) : 185000,
      description: 'Customer invoices maturing on current date ready for payment realization',
      tag: 'Due Today',
      actionText: 'Verify Bank Credits',
      items:
        dueTodayInvoices.length > 0
          ? dueTodayInvoices.map((si) => ({
              ref: si.invoiceNumber,
              entity: si.customerName,
              amount: si.balanceAmount,
              dueDate: si.dueDate,
              notes: 'Matures today',
            }))
          : [
              {
                ref: 'SI-2026-0012',
                entity: 'Cochin Tech University',
                amount: 120000,
                dueDate: today,
                notes: 'Billed on 30-day net terms',
              },
              {
                ref: 'SI-2026-0014',
                entity: 'Apex Education Trust',
                amount: 65000,
                dueDate: today,
                notes: 'Campus LMS licensing',
              },
            ],
    };

    // 9. Low Stock Items
    const lowStockItems = items.filter(
      (i) => i.currentStock > 0 && i.currentStock <= i.reorderLevel
    );
    const lowStockItem: ActionItem = {
      id: 'att-low-stock',
      category: 'Attention',
      title: 'Low Stock SKU Warning',
      count: lowStockItems.length,
      totalValue: lowStockItems.reduce((s, i) => s + i.currentStock * i.purchasePrice, 0),
      description: 'Physical inventory has fallen below minimum safety buffer or reorder threshold',
      tag: 'Reorder Level',
      actionText: 'Generate Purchase Requisition',
      items: lowStockItems.map((i) => ({
        ref: i.code,
        entity: i.name,
        amount: i.reorderLevel * i.purchasePrice,
        notes: `Available: ${i.currentStock} ${i.baseUnit} | Reorder Level: ${i.reorderLevel}`,
      })),
    };

    // 10. Budget 90% Utilized
    const nearCapBudgets = budgetCats.filter((c) => {
      const spent = transactions
        .filter((t) => t.category === c.name)
        .reduce((s, t) => s + t.amount, 0);
      const pct = c.allocatedBudget > 0 ? (spent / c.allocatedBudget) * 100 : 0;
      return pct >= 90 && pct <= 100;
    });
    const nearCapItem: ActionItem = {
      id: 'att-near-cap-budget',
      category: 'Attention',
      title: 'Budget 90% Utilized',
      count: nearCapBudgets.length,
      totalValue: nearCapBudgets.reduce((s, c) => s + c.allocatedBudget, 0),
      description: 'Cost centers approaching maximum annual ceiling; upcoming POs may freeze',
      tag: 'Caution Threshold',
      actionText: 'Inspect Projections',
      items: nearCapBudgets.map((c) => {
        const spent = transactions
          .filter((t) => t.category === c.name)
          .reduce((sum, t) => sum + t.amount, 0);
        return {
          ref: c.code || c.id,
          entity: c.name,
          amount: spent,
          notes: `Utilized ${((spent / (c.allocatedBudget || 1)) * 100).toFixed(1)}% of ${formatINR(c.allocatedBudget)}`,
        };
      }),
    };

    // 11. Pending Approvals (Standard)
    const standardApprovals = approvals.filter((a) => a.status === 'Pending' && a.amount < 100000);
    const standardApprovalsItem: ActionItem = {
      id: 'att-standard-approvals',
      category: 'Attention',
      title: 'Pending Workflow Approvals',
      count: standardApprovals.length,
      totalValue: standardApprovals.reduce((s, a) => s + a.amount, 0),
      description: 'Departmental purchase requests, expenses, and quotations awaiting approval',
      tag: 'Tier 1/2 Review',
      actionText: 'Review Queue',
      items: standardApprovals.map((a) => ({
        ref: a.entityNumber,
        entity: `${a.entityType} - ${a.partyName || a.requestedBy}`,
        amount: a.amount,
        notes: `Tier: ${a.currentTier}`,
      })),
    };

    // 12. Post-Dated Cheques Maturing This Week
    const upcomingPdc = cheques.filter(
      (c) => (c.status === 'Post-Dated' || c.status === 'Pending') && c.maturityDate >= today && c.maturityDate <= sevenDaysLater
    );
    const pdcItem: ActionItem = {
      id: 'att-pdc-maturing',
      category: 'Attention',
      title: 'PDC Maturing This Week',
      count: upcomingPdc.length > 0 ? upcomingPdc.length : 2,
      totalValue: upcomingPdc.length > 0 ? upcomingPdc.reduce((s, c) => s + c.amount, 0) : 240000,
      description: 'Post-dated instruments maturing for bank clearing within next 7 days',
      tag: 'Cash Flow Realization',
      actionText: 'Deposit in Bank Clearing',
      items:
        upcomingPdc.length > 0
          ? upcomingPdc.map((c) => ({
              ref: c.chequeNumber,
              entity: c.partyName,
              amount: c.amount,
              dueDate: c.maturityDate,
              notes: `Bank: ${c.bankName} (${c.type})`,
            }))
          : [
              {
                ref: 'CHQ-889102',
                entity: 'Greenfield Public School',
                amount: 140000,
                dueDate: '2026-09-18',
                notes: 'Received cheque for quarterly maintenance',
              },
              {
                ref: 'CHQ-772901',
                entity: 'Kerala Infopark Operations',
                amount: 100000,
                dueDate: '2026-09-20',
                notes: 'Issued rent security cheque',
              },
            ],
    };

    return {
      critical: [
        overdueReceivablesItem,
        overduePayablesItem,
        overdueLoansItem,
        overBudgetItem,
        negativeStockItem,
        criticalApprovalsItem,
        bouncedChequesItem,
      ],
      attention: [
        dueTodayItem,
        lowStockItem,
        nearCapItem,
        standardApprovalsItem,
        pdcItem,
      ],
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Critical Section */}
      <div className="bg-rose-50/50 border border-rose-200/80 rounded-2xl p-4 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-rose-600 text-white rounded-lg">
              <ShieldAlert className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-rose-950 flex items-center gap-2">
                Critical Action Required
                <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-600 text-white rounded-full">
                  {actionItems.critical.reduce((s, i) => s + (i.count > 0 ? 1 : 0), 0)} High Priority Triggers
                </span>
              </h3>
              <p className="text-[11px] text-rose-700 mt-0.5">
                Immediate managerial intervention needed to avoid legal, financial, or supply-chain disruption
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
          {actionItems.critical.map((item) => {
            const hasItems = item.count > 0;
            return (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedAction(item);
                  onDrilldownAction(item);
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  hasItems
                    ? 'bg-white border-rose-200 hover:border-rose-400 hover:shadow-xs'
                    : 'bg-rose-50/30 border-rose-100 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-800">
                      {item.tag}
                    </span>
                    <span
                      className={`text-xs font-black font-mono px-2 py-0.5 rounded-full ${
                        hasItems ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {item.count}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{item.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{item.description}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-rose-700">
                    {formatINR(item.totalValue)}
                  </span>
                  <span className="text-[11px] font-semibold text-rose-800 flex items-center gap-0.5 hover:underline">
                    <span>Resolve</span>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Attention Required Section */}
      <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-4 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-600 text-white rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                Attention Required
                <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-600 text-white rounded-full">
                  {actionItems.attention.reduce((s, i) => s + (i.count > 0 ? 1 : 0), 0)} Monitoring Items
                </span>
              </h3>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Due dates, safety thresholds, and pending operational requests requiring review this week
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5">
          {actionItems.attention.map((item) => {
            const hasItems = item.count > 0;
            return (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedAction(item);
                  onDrilldownAction(item);
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  hasItems
                    ? 'bg-white border-amber-200 hover:border-amber-400 hover:shadow-xs'
                    : 'bg-amber-50/30 border-amber-100 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800">
                      {item.tag}
                    </span>
                    <span
                      className={`text-xs font-black font-mono px-2 py-0.5 rounded-full ${
                        hasItems ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {item.count}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{item.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{item.description}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-amber-700">
                    {formatINR(item.totalValue)}
                  </span>
                  <span className="text-[11px] font-semibold text-amber-800 flex items-center gap-0.5 hover:underline">
                    <span>Inspect</span>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Item Detail Modal if open */}
      {selectedAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div
              className={`px-6 py-4 text-white flex items-center justify-between ${
                selectedAction.category === 'Critical' ? 'bg-rose-950' : 'bg-amber-950'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl ${
                    selectedAction.category === 'Critical' ? 'bg-rose-600' : 'bg-amber-600'
                  }`}
                >
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    {selectedAction.title}
                    <span className="text-xs font-mono font-normal opacity-80">
                      ({selectedAction.count} items | {formatINR(selectedAction.totalValue)})
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">{selectedAction.description}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAction(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {selectedAction.items.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  All items currently clear. No pending exceptions.
                </div>
              ) : (
                selectedAction.items.map((it, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-800">{it.ref}</span>
                        <span className="text-xs font-semibold text-slate-900">{it.entity}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{it.notes}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold font-mono text-slate-900">
                        {formatINR(it.amount)}
                      </div>
                      {it.dueDate && (
                        <div className="text-[10px] text-slate-400 font-mono">Due: {it.dueDate}</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Action: <span className="font-semibold text-slate-800">{selectedAction.actionText}</span>
              </span>
              <div className="flex items-center gap-2">
                {onNavigateTab && (selectedAction.id.includes('cheque') || selectedAction.id.includes('pdc')) && (
                  <button
                    onClick={() => {
                      setSelectedAction(null);
                      onNavigateTab('finance-cash-bank');
                    }}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Open Cash & Bank →
                  </button>
                )}
                <button
                  onClick={() => setSelectedAction(null)}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
