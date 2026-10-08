import React, { useState } from 'react';
import {
  Proposal,
  ProposalPaymentTracking,
  ProposalPaymentStage,
  PaymentStageKey,
  PaymentStageStatus,
} from '../types';
import { formatINR } from '../utils/pdfGenerator';
import {
  getProposalPaymentTracking,
  updateProposalStage,
  getPaymentBadgeClass,
} from '../utils/paymentScheduleUtils';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  IndianRupee,
  Calendar,
  CreditCard,
  Hash,
  FileText,
  Edit3,
  Save,
  X,
  TrendingUp,
  Building2,
  ShieldCheck,
  Receipt,
  UserCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface ProposalPaymentDashboardProps {
  proposal: Proposal;
  onUpdateProposal?: (updated: Proposal) => void;
  currentUser?: string;
  isCompact?: boolean;
  onClose?: () => void;
}

export const ProposalPaymentDashboard: React.FC<ProposalPaymentDashboardProps> = ({
  proposal,
  onUpdateProposal,
  currentUser = 'Accounts Officer',
  isCompact = false,
  onClose,
}) => {
  const tracking = getProposalPaymentTracking(proposal);

  const [activeEditingStageKey, setActiveEditingStageKey] = useState<PaymentStageKey | null>(null);
  const [editStatus, setEditStatus] = useState<PaymentStageStatus>('Paid');
  const [editPaidAmount, setEditPaidAmount] = useState<number>(0);
  const [editPaidDate, setEditPaidDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [editPaymentMode, setEditPaymentMode] = useState<string>('Bank Transfer');
  const [editRefNumber, setEditRefNumber] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  const startEditStage = (stage: ProposalPaymentStage) => {
    setActiveEditingStageKey(stage.stageKey);
    setEditStatus(stage.status === 'Pending' ? 'Paid' : stage.status);
    setEditPaidAmount(stage.paidAmount > 0 ? stage.paidAmount : stage.targetAmount);
    setEditPaidDate(stage.paidDate || new Date().toISOString().split('T')[0]);
    setEditPaymentMode(stage.paymentMode || 'Bank Transfer');
    setEditRefNumber(stage.referenceNumber || '');
    setEditNotes(stage.notes || '');
  };

  const handleSaveStageUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEditingStageKey) return;

    const updatedTracking = updateProposalStage(
      tracking,
      activeEditingStageKey,
      {
        status: editStatus,
        paidAmount: Number(editPaidAmount) || 0,
        paidDate: editPaidDate,
        paymentMode: editPaymentMode,
        referenceNumber: editRefNumber.trim(),
        notes: editNotes.trim(),
      },
      currentUser
    );

    const updatedProposal: Proposal = {
      ...proposal,
      paymentTracking: updatedTracking,
    };

    if (onUpdateProposal) {
      onUpdateProposal(updatedProposal);
    }

    setSaveSuccessMessage('Payment milestone successfully recorded!');
    setActiveEditingStageKey(null);
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  const percentCollected =
    tracking.totalAgreedAmount > 0
      ? Math.round((tracking.totalPaidAmount / tracking.totalAgreedAmount) * 100)
      : 0;

  return (
    <div className="space-y-6 w-full">
      {/* Top Banner & Context */}
      <div className="bg-gradient-to-r from-emerald-900 to-[#0B5D2A] text-white rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-[11px] font-bold tracking-wider uppercase border border-emerald-400/30">
                Payment Status Dashboard
              </span>
              <span className="text-xs font-mono bg-white/10 px-2 py-0.5 rounded text-white/90">
                {proposal.proposalNumber}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white text-[#0B5D2A] font-bold">
                {proposal.proposalStatus}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {proposal.instituteName}
            </h2>
            <p className="text-xs text-emerald-100/80 mt-1 flex items-center gap-2 flex-wrap">
              <span>Contact: {proposal.contactPerson}</span>
              <span>•</span>
              <span>Plan: {proposal.pricingType}</span>
              <span>•</span>
              <span>Students: {proposal.studentCount}</span>
              <span>•</span>
              <span>Agreement: {proposal.agreementDetails?.agreementPeriod || '5 Years'}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="mt-5 pt-4 border-t border-white/15">
          <div className="flex items-center justify-between text-xs mb-1.5 text-emerald-100">
            <span className="font-semibold flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-300" />
              <span>Overall Contract Realization Progress</span>
            </span>
            <span className="font-mono font-bold text-sm text-white">
              {percentCollected}% Realized ({formatINR(tracking.totalPaidAmount)} of {formatINR(tracking.totalAgreedAmount)})
            </span>
          </div>
          <div className="w-full h-3 bg-black/25 rounded-full overflow-hidden p-0.5 border border-white/20">
            <div
              className="h-full bg-gradient-to-r from-emerald-300 to-teal-200 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${Math.min(100, percentCollected)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Save Success Alert */}
      {saveSuccessMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-[#0B5D2A] rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#168A45]" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* 4 KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Total Contract Value
          </div>
          <div className="text-xl font-black text-slate-900">
            {formatINR(tracking.totalAgreedAmount)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Agreed commercial proposal fee
          </div>
        </div>

        <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-[#168A45] uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Total Collected</span>
            <span className="text-[10px] bg-emerald-50 text-[#0B5D2A] px-1.5 py-0.5 rounded font-black">
              {percentCollected}%
            </span>
          </div>
          <div className="text-xl font-black text-[#0B5D2A]">
            {formatINR(tracking.totalPaidAmount)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Verified payments received
          </div>
        </div>

        <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Remaining Balance</span>
            <span className="text-[10px] bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded font-black">
              {100 - percentCollected}%
            </span>
          </div>
          <div className="text-xl font-black text-amber-900">
            {formatINR(tracking.balanceAmount)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Pending across future stages
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Overall Payment Status
          </div>
          <div className="pt-0.5">
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs border ${getPaymentBadgeClass(
                tracking.overallPaymentStatus
              )}`}
            >
              {tracking.overallPaymentStatus}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {tracking.overallPaymentStatus === 'Fully Paid'
              ? 'All 3 milestones fully settled'
              : tracking.overallPaymentStatus === 'Partially Paid'
              ? 'Milestone payments in progress'
              : 'Awaiting registration remittance'}
          </div>
        </div>
      </div>

      {/* 3-Stage Milestone Visual Step Progression Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#EAF7EF] text-[#168A45] flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Agreed 3-Stage Milestone Payment Schedule
              </h3>
              <p className="text-[11px] text-slate-500">
                Milestone 1: Registration Fee • Milestone 2: Balance 60% Onboarding • Milestone 3: Balance 40% After 2 Months
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-[#168A45] bg-[#EAF7EF] px-2.5 py-1 rounded-full border border-emerald-200">
            Official Contract Milestones
          </span>
        </div>

        {/* Milestone Steps Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {tracking.stages.map((stage, idx) => {
            const isPaid = stage.status === 'Paid';
            const isPartial = stage.status === 'Partially Paid';
            const isPending = stage.status === 'Pending';

            return (
              <div
                key={stage.stageKey}
                className={`relative rounded-xl p-4 border transition-all ${
                  isPaid
                    ? 'bg-[#F4FAF6] border-emerald-300 shadow-2xs'
                    : isPartial
                    ? 'bg-amber-50/50 border-amber-300 shadow-2xs'
                    : 'bg-slate-50/60 border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Milestone Badge & Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                        isPaid
                          ? 'bg-[#168A45] text-white'
                          : isPartial
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isPaid ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {stage.stageName}
                    </span>
                  </div>
                  <span
                    className={`text-[10.5px] px-2 py-0.5 rounded-full border ${getPaymentBadgeClass(
                      stage.status
                    )}`}
                  >
                    {stage.status}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 mb-3 min-h-[32px] leading-snug">
                  {stage.description}
                </p>

                {/* Amount & Progress details */}
                <div className="bg-white rounded-lg p-2.5 border border-gray-200/80 space-y-1.5 text-xs mb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-[11px]">Agreed Target:</span>
                    <span className="font-bold text-slate-900">{formatINR(stage.targetAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-[11px]">Amount Paid:</span>
                    <span
                      className={`font-bold ${
                        stage.paidAmount > 0 ? 'text-[#0B5D2A]' : 'text-slate-400'
                      }`}
                    >
                      {formatINR(stage.paidAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                    <span className="text-slate-500 text-[11px]">Pending Balance:</span>
                    <span
                      className={`font-bold ${
                        stage.targetAmount - stage.paidAmount > 0
                          ? 'text-amber-800'
                          : 'text-emerald-700'
                      }`}
                    >
                      {formatINR(Math.max(0, stage.targetAmount - stage.paidAmount))}
                    </span>
                  </div>
                </div>

                {/* Metadata details: Date, mode, ref */}
                <div className="space-y-1 text-[11px] text-slate-600 mb-3 bg-white/60 p-2 rounded-md border border-dashed border-gray-200">
                  {stage.dueDate && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>Due Date: <strong className="text-slate-800">{stage.dueDate}</strong></span>
                    </div>
                  )}
                  {stage.paidDate && (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-[#168A45] shrink-0" />
                      <span>Paid Date: <strong className="text-slate-800">{stage.paidDate}</strong></span>
                    </div>
                  )}
                  {stage.paymentMode && (
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>Mode: <strong className="text-slate-800">{stage.paymentMode}</strong></span>
                    </div>
                  )}
                  {stage.referenceNumber && (
                    <div className="flex items-center gap-1.5">
                      <Hash className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>Ref/UTR: <strong className="text-slate-800">{stage.referenceNumber}</strong></span>
                    </div>
                  )}
                </div>

                {/* Action button */}
                <button
                  type="button"
                  onClick={() => startEditStage(stage)}
                  className="w-full py-1.5 px-3 bg-white hover:bg-[#EAF7EF] text-[#0B5D2A] border border-emerald-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#168A45]" />
                  <span>
                    {stage.status === 'Paid' ? 'Update Stage Details' : 'Record Payment / Update'}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inline Stage Editor Form (When an editing stage is active) */}
      {activeEditingStageKey && (
        <div className="bg-white border-2 border-[#168A45] rounded-xl p-5 shadow-lg animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#EAF7EF] text-[#168A45] flex items-center justify-center font-bold">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Update Payment: {tracking.stages.find((s) => s.stageKey === activeEditingStageKey)?.stageName}
                </h4>
                <p className="text-[11px] text-slate-500">
                  Record remittance details, payment mode, and reference numbers
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveEditingStageKey(null)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveStageUpdate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as PaymentStageStatus)}
                  className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#168A45] focus:bg-white"
                >
                  <option value="Paid">Paid (Fully Cleared)</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Pending">Pending (Not Received)</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Amount Paid (₹)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const st = tracking.stages.find((s) => s.stageKey === activeEditingStageKey);
                      if (st) setEditPaidAmount(st.targetAmount);
                    }}
                    className="text-[10px] text-[#168A45] hover:underline font-bold"
                  >
                    Quick Full Amount
                  </button>
                </div>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={editPaidAmount}
                  onChange={(e) => setEditPaidAmount(Number(e.target.value) || 0)}
                  className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#168A45] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={editPaidDate}
                  onChange={(e) => setEditPaidDate(e.target.value)}
                  className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#168A45] focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Mode
                </label>
                <select
                  value={editPaymentMode}
                  onChange={(e) => setEditPaymentMode(e.target.value)}
                  className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#168A45] focus:bg-white"
                >
                  <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                  <option value="UPI">UPI / QR Code</option>
                  <option value="Cheque / DD">Cheque / Demand Draft</option>
                  <option value="Cash">Cash with Official Receipt</option>
                  <option value="Other">Other Mode</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  UTR / Reference / Cheque No.
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR123456789 / CHQ-987654"
                  value={editRefNumber}
                  onChange={(e) => setEditRefNumber(e.target.value)}
                  className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#168A45] focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Internal Accounts Notes & Remarks
              </label>
              <input
                type="text"
                placeholder="e.g. Cleared in HDFC current account, acknowledged to Principal"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#168A45] focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveEditingStageKey(null)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-98 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Payment Record</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Agreed Payment Clauses & Reference */}
      <div className="bg-[#F7FAF8] border border-gray-200 rounded-xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#168A45]" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Official Proposal Contract Terms (Section 5 & 6)
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">
            Casbiro Solutions Private Limited
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-slate-700 pt-1">
          <div className="bg-white p-3 rounded-lg border border-gray-200/80">
            <span className="font-bold text-[#0B5D2A] block mb-1">
              Payment Schedule Milestones:
            </span>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              <li>Registration fee at the time of registration.</li>
              <li>Balance 60% after students onboarding.</li>
              <li>After two months balance 40% will pay.</li>
            </ul>
          </div>

          <div className="bg-white p-3 rounded-lg border border-gray-200/80">
            <span className="font-bold text-[#0B5D2A] block mb-1">
              Payment Terms & Invoicing:
            </span>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              <li>Registration fee will be deducted from total fee.</li>
              <li>Official GST invoice issued for every stage payment.</li>
              <li>Payment accepted via NEFT, RTGS, IMPS, UPI, or Cheque.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Transaction Records Table */}
      {tracking.transactions && tracking.transactions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#168A45]" />
              <span>Recorded Transaction Ledger ({tracking.transactions.length})</span>
            </h4>
            <span className="text-[11px] text-slate-400">
              Audited by Accounts
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200 text-slate-600 font-bold text-[10.5px] uppercase">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Stage</th>
                  <th className="py-2.5 px-3">Mode</th>
                  <th className="py-2.5 px-3">Reference / UTR</th>
                  <th className="py-2.5 px-3">Recorded By</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-slate-700">
                {tracking.transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-[#F7FAF8]">
                    <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-900">
                      {txn.paidDate}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-[#EAF7EF] text-[#0B5D2A]">
                        {txn.stageKey === 'registration'
                          ? 'Registration'
                          : txn.stageKey === 'onboarding'
                          ? 'Onboarding 60%'
                          : '2-Month 40%'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">{txn.paymentMode}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                      {txn.referenceNumber || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{txn.recordedBy || 'System'}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#0B5D2A] whitespace-nowrap">
                      {formatINR(txn.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
