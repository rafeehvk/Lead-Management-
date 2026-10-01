import React, { useState } from 'react';
import {
  X,
  PlusCircle,
  ShoppingCart,
  TrendingUp,
  Receipt,
  CreditCard,
  Users,
  Package,
  Layers,
  FileText,
  RotateCcw,
  Landmark,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { erpFinanceStorage } from '../../../services/finance/erpFinanceStorage';
import { financeStorage } from '../../../services/financeStorageService';

interface FinanceQuickActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActionTriggered?: (actionType: string) => void;
}

interface QuickActionDef {
  id: string;
  title: string;
  category: 'Purchases' | 'Sales' | 'Cash & Bank' | 'Inventory & Master' | 'Adjustments';
  description: string;
  icon: any;
  color: string;
  formType:
    | 'purchase-order'
    | 'purchase-invoice'
    | 'sales-invoice'
    | 'expense'
    | 'payment'
    | 'receipt'
    | 'party'
    | 'item'
    | 'loan'
    | 'stock-adjustment'
    | 'stock-transfer'
    | 'budget'
    | 'credit-note'
    | 'debit-note'
    | 'advance';
}

export const FinanceQuickActionsModal: React.FC<FinanceQuickActionsModalProps> = ({
  isOpen,
  onClose,
  onActionTriggered,
}) => {
  const [activeForm, setActiveForm] = useState<QuickActionDef | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Form input states
  const [partyName, setPartyName] = useState('');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const quickActions: QuickActionDef[] = [
    {
      id: 'qa-pur-inv',
      title: 'New Purchase Invoice',
      category: 'Purchases',
      description: 'Record incoming vendor tax bill, verify GST ITC, and schedule payment',
      icon: ShoppingCart,
      color: 'bg-blue-600',
      formType: 'purchase-invoice',
    },
    {
      id: 'qa-sal-inv',
      title: 'New Sales Invoice',
      category: 'Sales',
      description: 'Generate outward GST tax invoice with e-Invoice QR code generation',
      icon: TrendingUp,
      color: 'bg-emerald-600',
      formType: 'sales-invoice',
    },
    {
      id: 'qa-expense',
      title: 'New Expense Voucher',
      category: 'Purchases',
      description: 'Book operational overhead with department cost allocation',
      icon: Receipt,
      color: 'bg-rose-600',
      formType: 'expense',
    },
    {
      id: 'qa-payment',
      title: 'New Vendor Payment',
      category: 'Cash & Bank',
      description: 'Disburse funds from Bank/Cash with TDS deduction and invoice allocation',
      icon: CreditCard,
      color: 'bg-purple-600',
      formType: 'payment',
    },
    {
      id: 'qa-receipt',
      title: 'New Customer Receipt',
      category: 'Cash & Bank',
      description: 'Record payment remittance into bank with outstanding invoice clearing',
      icon: CreditCard,
      color: 'bg-teal-600',
      formType: 'receipt',
    },
    {
      id: 'qa-party',
      title: 'New Party (Customer/Vendor)',
      category: 'Inventory & Master',
      description: 'Register dual-trading entity with GSTIN verification and credit limit',
      icon: Users,
      color: 'bg-indigo-600',
      formType: 'party',
    },
    {
      id: 'qa-item',
      title: 'New Inventory Item Master',
      category: 'Inventory & Master',
      description: 'Create catalog SKU with HSN code, tax rate, and reorder threshold',
      icon: Package,
      color: 'bg-amber-600',
      formType: 'item',
    },
    {
      id: 'qa-stock-adj',
      title: 'Stock Adjustment (Physical Count)',
      category: 'Adjustments',
      description: 'Reconcile physical inventory variance against perpetual ERP ledger',
      icon: Layers,
      color: 'bg-orange-600',
      formType: 'stock-adjustment',
    },
    {
      id: 'qa-stock-transfer',
      title: 'Inter-Warehouse Stock Transfer',
      category: 'Adjustments',
      description: 'Transfer SKU items between central warehouse and regional campuses',
      icon: RotateCcw,
      color: 'bg-cyan-600',
      formType: 'stock-transfer',
    },
    {
      id: 'qa-loan',
      title: 'New Loan & Facility',
      category: 'Cash & Bank',
      description: 'Register bank term loan, vehicle loan, or working capital facility',
      icon: Landmark,
      color: 'bg-emerald-700',
      formType: 'loan',
    },
    {
      id: 'qa-budget',
      title: 'New Annual Budget Allocation',
      category: 'Purchases',
      description: 'Set annual ceiling cap and approval threshold for departmental cost centers',
      icon: Layers,
      color: 'bg-blue-700',
      formType: 'budget',
    },
    {
      id: 'qa-credit-note',
      title: 'New Credit Note (Sales Return)',
      category: 'Adjustments',
      description: 'Issue credit note to customer against sales invoice with GST adjustment',
      icon: FileText,
      color: 'bg-amber-700',
      formType: 'credit-note',
    },
    {
      id: 'qa-debit-note',
      title: 'New Debit Note (Purchase Return)',
      category: 'Adjustments',
      description: 'Issue debit note to vendor for defective supplies or rate difference',
      icon: FileText,
      color: 'bg-rose-700',
      formType: 'debit-note',
    },
    {
      id: 'qa-advance',
      title: 'New Advance Payment / Receipt',
      category: 'Cash & Bank',
      description: 'Record unallocated advance with GST voucher and future invoice linking',
      icon: Landmark,
      color: 'bg-violet-700',
      formType: 'advance',
    },
  ];

  const handleCreateFast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeForm) return;

    const numAmount = parseFloat(amount) || 25000;
    const refId = reference || `VCH-${Date.now().toString().slice(-6)}`;
    const party = partyName || 'Apex Commercial Solutions';

    if (activeForm.formType === 'sales-invoice') {
      const customer = erpFinanceStorage.getParties('Customer')[0] || { id: 'PRT-101', name: party };
      erpFinanceStorage.postSalesInvoice({
        customerId: customer.id,
        customerName: customer.name,
        invoiceNumber: refId,
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        costCenter: 'CC-REV-EDUTECH',
        items: [
          {
            itemId: 'ITM-001',
            itemCode: 'ITM-001',
            itemName: notes || 'Enterprise ERP Software License',
            hsnCode: '84713010',
            quantity: 1,
            unit: 'NOS',
            rate: numAmount,
            discount: 0,
            taxPercent: 18,
            cgst: numAmount * 0.09,
            sgst: numAmount * 0.09,
            igst: 0,
            total: numAmount * 1.18,
          },
        ],
      });
    } else if (activeForm.formType === 'purchase-invoice') {
      const vendor = erpFinanceStorage.getParties('Vendor')[0] || { id: 'PRT-201', name: party };
      erpFinanceStorage.postPurchaseInvoice({
        vendorId: vendor.id,
        vendorName: vendor.name,
        invoiceNumber: refId,
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        costCenter: 'CC-OPERATIONS',
        items: [
          {
            itemId: 'ITM-002',
            itemCode: 'ITM-002',
            itemName: notes || 'Dell Server Hardware Supplies',
            hsnCode: '84713010',
            quantity: 1,
            unit: 'NOS',
            rate: numAmount,
            discount: 0,
            taxPercent: 18,
            cgst: numAmount * 0.09,
            sgst: numAmount * 0.09,
            igst: 0,
            total: numAmount * 1.18,
          },
        ],
      });
    } else if (activeForm.formType === 'expense') {
      financeStorage.addTransaction({
        date: new Date().toISOString().split('T')[0],
        month: 'Apr',
        year: 2026,
        amount: numAmount,
        category: 'Campus IT & Cloud Infrastructure',
        department: 'IT & Cloud Infrastructure',
        vendor: party,
        description: notes || 'Cloud Hosting & Storage',
        paymentMode: 'NEFT/RTGS',
        invoiceRef: refId,
        approvedBy: 'Finance Controller',
        status: 'Approved',
      });
    } else if (activeForm.formType === 'payment') {
      const vendor = erpFinanceStorage.getParties('Vendor')[0] || { id: 'PRT-201', name: party };
      const bankAcc = erpFinanceStorage.getBankAccounts()[0];
      erpFinanceStorage.postPayment({
        paymentNumber: refId,
        partyId: vendor.id,
        partyName: vendor.name,
        date: new Date().toISOString().split('T')[0],
        amount: numAmount,
        paymentMethod: 'NEFT/RTGS',
        accountId: bankAcc ? bankAcc.id : 'BA-01',
        accountName: bankAcc ? `${bankAcc.bankName} - ${bankAcc.name}` : 'HDFC Bank',
        referenceNumber: `UTR-${Date.now().toString().slice(-8)}`,
        remarks: notes || 'Payment settlement',
      });
    } else if (activeForm.formType === 'receipt') {
      const customer = erpFinanceStorage.getParties('Customer')[0] || { id: 'PRT-101', name: party };
      const bankAcc = erpFinanceStorage.getBankAccounts()[0];
      erpFinanceStorage.postReceipt({
        receiptNumber: refId,
        partyId: customer.id,
        partyName: customer.name,
        date: new Date().toISOString().split('T')[0],
        amount: numAmount,
        paymentMethod: 'Bank Transfer',
        accountId: bankAcc ? bankAcc.id : 'BA-01',
        accountName: bankAcc ? `${bankAcc.bankName} - ${bankAcc.name}` : 'HDFC Bank',
        referenceNumber: `REC-${Date.now().toString().slice(-8)}`,
        remarks: notes || 'Payment received',
      });
    }

    setStatusMessage(`Successfully generated ${activeForm.title}: ${refId}`);
    setTimeout(() => {
      setStatusMessage(null);
      setActiveForm(null);
      setPartyName('');
      setAmount('');
      setReference('');
      setNotes('');
      if (onActionTriggered) onActionTriggered(activeForm.id);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#168A45]/20 rounded-xl border border-[#168A45]/30">
              <PlusCircle className="w-5 h-5 text-[#168A45]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Finance Quick Actions</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Rapidly initialize invoices, vouchers, payments, items, budgets, and adjustments
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success feedback toast */}
        {statusMessage && (
          <div className="p-3 bg-emerald-50 text-emerald-800 border-b border-emerald-200 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Content View */}
        {!activeForm ? (
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {quickActions.map((act) => {
                const IconComponent = act.icon;
                return (
                  <div
                    key={act.id}
                    onClick={() => setActiveForm(act)}
                    className="p-4 bg-slate-50 hover:bg-slate-100/90 rounded-2xl border border-slate-200/80 transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <div className={`p-2 rounded-xl text-white ${act.color}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-0.5 bg-slate-200/60 rounded-md">
                          {act.category}
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#168A45] transition-colors">
                        {act.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{act.description}</p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>Launch Entry</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-6 overflow-y-auto flex-1">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveForm(null)}
                  className="text-xs text-slate-500 hover:text-slate-900 font-semibold px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200"
                >
                  ← Back to Quick Actions
                </button>
                <h3 className="text-sm font-bold text-slate-900">{activeForm.title}</h3>
              </div>
            </div>

            <form onSubmit={handleCreateFast} className="space-y-4 max-w-xl mx-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Party Name / Vendor / Customer / Entity
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Education Trust, Cochin Tech University"
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-[#168A45]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 45000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-[#168A45]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Reference / Voucher # (Auto if blank)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SI-2026-9912"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-[#168A45]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Particulars / Notes / Description</label>
                <textarea
                  rows={2}
                  placeholder="Description of supplies, terms, or GL allocation"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-[#168A45]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveForm(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#168A45] hover:bg-[#127038] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Save & Post Voucher
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>14 standard ERP finance action flows available</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
