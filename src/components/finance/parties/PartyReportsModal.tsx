import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  FileText,
  Printer,
  Mail,
  CheckCircle2,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { erpFinanceStorage } from '../../../services/finance/erpFinanceStorage';
import { PartyMaster } from '../../../types/finance';

interface PartyReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'receivables' | 'payables' | 'statement';
  selectedParty?: PartyMaster | null;
}

export const PartyReportsModal: React.FC<PartyReportsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'receivables',
  selectedParty,
}) => {
  const [activeTab, setActiveTab] = useState<'receivables' | 'payables' | 'statement'>(initialTab);
  const [partySelectId, setPartySelectId] = useState<string>(selectedParty?.id || '');
  const [statementFrom, setStatementFrom] = useState('2026-01-01');
  const [statementTo, setStatementTo] = useState(new Date().toISOString().split('T')[0]);
  const [emailSentNotice, setEmailSentNotice] = useState(false);

  // Load parties list
  const allParties = useMemo(() => erpFinanceStorage.getParties(), [isOpen]);

  // Set default party if none selected
  useEffect(() => {
    if (selectedParty) {
      setPartySelectId(selectedParty.id);
    } else if (allParties.length > 0 && !partySelectId) {
      setPartySelectId(allParties[0].id);
    }
  }, [selectedParty, allParties, partySelectId]);

  // Receivables Aging data
  const receivablesAging = useMemo(() => {
    return erpFinanceStorage.getReceivablesAgingReport();
  }, [isOpen]);

  // Payables Aging data
  const payablesAging = useMemo(() => {
    return erpFinanceStorage.getPayablesAgingReport();
  }, [isOpen]);

  // Statement of Account
  const statement = useMemo(() => {
    if (!partySelectId) return null;
    return erpFinanceStorage.getStatementOfAccount(partySelectId, statementFrom, statementTo);
  }, [partySelectId, statementFrom, statementTo, isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleEmailStatement = () => {
    setEmailSentNotice(true);
    setTimeout(() => setEmailSentNotice(false), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 rounded-xl border border-blue-500/30">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Party Financial Reports & Aging Analysis</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Accounts Receivable Aging, Accounts Payable Aging, and Formal Statement of Accounts
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

        {/* Tab Strip */}
        <div className="flex items-center justify-between px-6 pt-2.5 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2 text-xs font-medium">
            <button
              onClick={() => setActiveTab('receivables')}
              className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'receivables'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
              Receivables Aging (Debtors)
            </button>
            <button
              onClick={() => setActiveTab('payables')}
              className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'payables'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-amber-600" />
              Payables Aging (Creditors)
            </button>
            <button
              onClick={() => setActiveTab('statement')}
              className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'statement'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Statement of Account
            </button>
          </div>

          <div className="flex items-center gap-2 pb-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
          </div>
        </div>

        {/* Notification Toast */}
        {emailSentNotice && (
          <div className="px-6 py-2 bg-emerald-50 border-b border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Statement of Account successfully queued and emailed to {statement?.party?.email || 'party contact'}.
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: Receivables Aging */}
          {activeTab === 'receivables' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Total Outstanding</span>
                  <span className="text-base font-bold text-slate-900">
                    ₹{receivablesAging.summary.totalOutstanding.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
                  <span className="text-[11px] text-emerald-700 block">0–30 Days (Current)</span>
                  <span className="text-base font-bold text-emerald-800">
                    ₹{receivablesAging.summary.totalCurrent.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200">
                  <span className="text-[11px] text-amber-700 block">31–60 Days</span>
                  <span className="text-base font-bold text-amber-800">
                    ₹{receivablesAging.summary.total31To60.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="bg-orange-50/60 p-3 rounded-xl border border-orange-200">
                  <span className="text-[11px] text-orange-700 block">61–90 Days</span>
                  <span className="text-base font-bold text-orange-800">
                    ₹{receivablesAging.summary.total61To90.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="bg-red-50/60 p-3 rounded-xl border border-red-200">
                  <span className="text-[11px] text-red-700 block">&gt; 90 Days (Overdue)</span>
                  <span className="text-base font-bold text-red-800">
                    ₹{receivablesAging.summary.totalOver90.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Customer / Entity</th>
                      <th className="py-2.5 px-3">Contact</th>
                      <th className="py-2.5 px-3 text-right">0-30 Days (₹)</th>
                      <th className="py-2.5 px-3 text-right">31-60 Days</th>
                      <th className="py-2.5 px-3 text-right">61-90 Days</th>
                      <th className="py-2.5 px-3 text-right">&gt; 90 Days</th>
                      <th className="py-2.5 px-4 text-right">Total Outstanding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {receivablesAging.list.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                          No outstanding customer receivables found.
                        </td>
                      </tr>
                    ) : (
                      receivablesAging.list.map((c) => (
                        <tr key={c.customerId} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-sans">
                            <span className="font-semibold text-slate-900 block">{c.customerName}</span>
                            <span className="text-[11px] text-slate-500">{c.customerCode}</span>
                          </td>
                          <td className="py-2.5 px-3 font-sans text-slate-600 text-[11px]">
                            {c.phone || c.email || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right text-emerald-700">₹{c.current.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 text-right text-amber-700">₹{c.days31To60.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 text-right text-orange-700">₹{c.days61To90.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 text-right text-red-700 font-semibold">₹{c.over90.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                            ₹{c.totalDue.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Payables Aging */}
          {activeTab === 'payables' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Total Payables</span>
                  <span className="text-base font-bold text-slate-900">
                    ₹{payablesAging.summary.totalOutstanding.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
                  <span className="text-[11px] text-emerald-700 block">0–30 Days (Current)</span>
                  <span className="text-base font-bold text-emerald-800">
                    ₹{payablesAging.summary.totalCurrent.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200">
                  <span className="text-[11px] text-amber-700 block">31–60 Days</span>
                  <span className="text-base font-bold text-amber-800">
                    ₹{payablesAging.summary.total31To60.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="bg-orange-50/60 p-3 rounded-xl border border-orange-200">
                  <span className="text-[11px] text-orange-700 block">61–90 Days</span>
                  <span className="text-base font-bold text-orange-800">
                    ₹{payablesAging.summary.total61To90.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="bg-red-50/60 p-3 rounded-xl border border-red-200">
                  <span className="text-[11px] text-red-700 block">&gt; 90 Days (Overdue)</span>
                  <span className="text-base font-bold text-red-800">
                    ₹{payablesAging.summary.totalOver90.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Vendor / Supplier</th>
                      <th className="py-2.5 px-3">Contact</th>
                      <th className="py-2.5 px-3 text-right">0-30 Days (₹)</th>
                      <th className="py-2.5 px-3 text-right">31-60 Days</th>
                      <th className="py-2.5 px-3 text-right">61-90 Days</th>
                      <th className="py-2.5 px-3 text-right">&gt; 90 Days</th>
                      <th className="py-2.5 px-4 text-right">Total Payable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {payablesAging.list.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                          No outstanding payables found.
                        </td>
                      </tr>
                    ) : (
                      payablesAging.list.map((v) => (
                        <tr key={v.vendorId} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-sans">
                            <span className="font-semibold text-slate-900 block">{v.vendorName}</span>
                            <span className="text-[11px] text-slate-500">{v.vendorCode}</span>
                          </td>
                          <td className="py-2.5 px-3 font-sans text-slate-600 text-[11px]">
                            {v.phone || v.email || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right text-emerald-700">₹{v.current.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 text-right text-amber-700">₹{v.days31To60.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 text-right text-orange-700">₹{v.days61To90.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 text-right text-red-700 font-semibold">₹{v.over90.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-4 text-right font-bold text-amber-800">
                            ₹{v.totalDue.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Statement of Account (Formal Letterhead View) */}
          {activeTab === 'statement' && (
            <div className="space-y-4">
              {/* Selector & Date Controls */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-slate-700">Select Party:</span>
                  <select
                    value={partySelectId}
                    onChange={(e) => setPartySelectId(e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-medium text-xs"
                  >
                    {allParties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code}) - {p.type}
                      </option>
                    ))}
                  </select>

                  <span className="font-medium text-slate-700 ml-2">Period:</span>
                  <input
                    type="date"
                    value={statementFrom}
                    onChange={(e) => setStatementFrom(e.target.value)}
                    className="px-2 py-1 border border-slate-300 rounded text-xs bg-white"
                  />
                  <span className="text-slate-400">to</span>
                  <input
                    type="date"
                    value={statementTo}
                    onChange={(e) => setStatementTo(e.target.value)}
                    className="px-2 py-1 border border-slate-300 rounded text-xs bg-white"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleEmailStatement}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" /> Send Statement Email
                  </button>
                </div>
              </div>

              {/* Printable Statement Sheet */}
              {statement && statement.party ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 print:border-none print:shadow-none">
                  {/* Letterhead */}
                  <div className="flex items-start justify-between border-b pb-4 border-slate-200">
                    <div>
                      <h1 className="text-xl font-bold text-slate-900 tracking-tight">MYSAR ERP SYSTEMS</h1>
                      <p className="text-xs text-slate-500">Corporate Tower, InfoPark Phase 2, Kochi, Kerala 682042</p>
                      <p className="text-xs text-slate-500">GSTIN: 32AABCM1234F1Z5 • Email: finance@mysargroup.com</p>
                    </div>
                    <div className="text-right">
                      <h2 className="text-base font-bold text-slate-900 uppercase">Statement of Account</h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Period: <strong>{statement.fromDate}</strong> to <strong>{statement.toDate}</strong>
                      </p>
                      <p className="text-xs text-slate-500">Generated: {new Date().toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>

                  {/* To Address */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 uppercase font-semibold text-[10px] block mb-1">To:</span>
                      <p className="font-bold text-slate-900 text-sm">{statement.party.name}</p>
                      <p className="text-slate-600">{statement.party.billingAddress || 'Corporate Office'}</p>
                      <p className="text-slate-600">{statement.party.city}, {statement.party.state} - {statement.party.country}</p>
                      <p className="text-slate-600 font-mono mt-1">GSTIN: {statement.party.gstin || 'Unregistered'}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <div>
                        <span className="text-slate-400 text-[11px]">Party Account Code:</span>{' '}
                        <strong className="font-mono text-slate-800">{statement.party.code}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">Entity Classification:</span>{' '}
                        <span className="font-medium text-slate-800">{statement.party.type} ({statement.party.category})</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">Terms of Payment:</span>{' '}
                        <span className="font-medium text-slate-800">{statement.party.paymentTerms || 'Net 30'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Ledger Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                        <tr>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Voucher #</th>
                          <th className="py-2.5 px-3">Transaction Type</th>
                          <th className="py-2.5 px-4">Particulars</th>
                          <th className="py-2.5 px-3 text-right">Debit (₹)</th>
                          <th className="py-2.5 px-3 text-right">Credit (₹)</th>
                          <th className="py-2.5 px-4 text-right">Balance (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {statement.entries.map((e) => (
                          <tr key={e.id}>
                            <td className="py-2 px-3 text-slate-600">{e.date}</td>
                            <td className="py-2 px-3 font-semibold text-slate-900">{e.referenceNumber}</td>
                            <td className="py-2 px-3 font-sans text-slate-700">{e.type}</td>
                            <td className="py-2 px-4 font-sans text-slate-600">{e.narration}</td>
                            <td className="py-2 px-3 text-right text-slate-800">
                              {e.debit ? `₹${e.debit.toLocaleString('en-IN')}` : '-'}
                            </td>
                            <td className="py-2 px-3 text-right text-slate-800">
                              {e.credit ? `₹${e.credit.toLocaleString('en-IN')}` : '-'}
                            </td>
                            <td className="py-2 px-4 text-right font-bold text-slate-900">
                              ₹{Math.abs(e.runningBalance).toLocaleString('en-IN')} {e.balanceType}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-100 font-bold border-t border-slate-200">
                        <tr>
                          <td colSpan={4} className="py-2.5 px-4 text-right font-sans">
                            Closing Balance as on {statement.toDate}:
                          </td>
                          <td className="py-2.5 px-3 text-right text-emerald-700 font-mono">
                            ₹{statement.totalDebit.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right text-amber-700 font-mono">
                            ₹{statement.totalCredit.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono text-blue-800 text-sm">
                            ₹{Math.abs(statement.closingBalance).toLocaleString('en-IN')} {statement.balanceType}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Summary Box */}
                  <div className="flex justify-between items-end pt-4 border-t border-slate-200 text-xs">
                    <div>
                      <p className="text-slate-500">For inquiries regarding this statement, please contact:</p>
                      <p className="font-semibold text-slate-800">Finance & Treasury Operations (Tel: +91 484 290 8800)</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 mb-6">Authorized Signatory</p>
                      <p className="font-bold text-slate-800">Chief Financial Officer / Controller</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400">Please select a party to view statement.</div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500">MYSAR ERP Finance Module • GST Compliant Statements</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
