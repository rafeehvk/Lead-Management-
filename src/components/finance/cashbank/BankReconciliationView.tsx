import React, { useState, useMemo, useEffect } from 'react';
import {
  Landmark,
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRightLeft,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  FileText,
  Check,
  X,
  History,
  Info,
  Calendar,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
} from 'lucide-react';

import {
  BankAccountRecord,
  BankReconciliationRecord,
  BankStatementLine,
  SystemBankTransaction,
} from '../../../types/finance';

import { erpFinanceStorage } from '../../../services/finance/erpFinanceStorage';
import { BankStatementImportModal } from './BankStatementImportModal';
import { BankReconciliationManualReviewModal } from './BankReconciliationManualReviewModal';

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

// Sample realistic statement files for 1-click testing
const SAMPLE_CSV_CONTENT = `Date,Value Date,Description,Reference/Cheque,Withdrawal,Deposit,Balance
2026-09-08,2026-09-08,NEFT CR-ST. THOMAS COLLEGE-COLLEGE FEES,CMS-994102,0,185000,4835000
2026-09-09,2026-09-09,CHQ CLG-CHQ-104921-DELL INDIA IT LABS,CHQ-104921,420000,0,4415000
2026-09-10,2026-09-10,RTGS CR-COCHIN TECH UNIV-SEMESTER FEE,RTGS-882194,0,120000,4535000
2026-09-12,2026-09-12,NEFT DR-GODREJ INTERIO-CAMPUS CHAIRS,NEFT-49102,175000,0,4360000
2026-09-14,2026-09-14,TRF TO CASH-CONTRA PETTY CASH IMPREST,TRF-2026-0001,50000,0,4310000
2026-09-15,2026-09-15,CHQ DEP CLG-CHQ-772101-HOLY GRACE ACADEMY,CHQ-772101,0,95000,4405000`;

const SAMPLE_MT940_CONTENT = `:20:MT940-20260915-01
:25:12880200018942
:28C:00045/001
:60F:C260901INR4650000,00
:61:2609080908CR185000,00NTRFNONREF//CMS-994102
ST. THOMAS COLLEGE CMS RECEIPT
:61:2609090909DR420000,00NCHQNONREF//CHQ-104921
CHQ CLG DELL TECHNOLOGIES
:61:2609100910CR120000,00NTRFNONREF//RTGS-882194
COCHIN TECH UNIV LMS
:61:2609120912DR175000,00NTRFNONREF//NEFT-49102
GODREJ INTERIO INVOICE
:61:2609140914DR50000,00NTRFNONREF//TRF-2026-0001
CONTRA PETTY CASH WITHDRAWAL
:62F:C260915INR4405000,00
-}`;

const SAMPLE_CAMT_CONTENT = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.053.001.02">
  <BkToCstmrStmt>
    <Stmt>
      <Id>CAMT053-2026-09</Id>
      <Acct><Id><Othr><Id>12880200018942</Id></Othr></Id></Acct>
      <Bal>
        <Tp><CdOrPrtry><Cd>OPBD</Cd></CdOrPrtry></Tp>
        <Amt Ccy="INR">4650000.00</Amt>
      </Bal>
      <Ntry>
        <Amt Ccy="INR">185000.00</Amt>
        <CdtDbtInd>CRDT</CdtDbtInd>
        <BookgDt><Dt>2026-09-08</Dt></BookgDt>
        <NtryDtls><TxDtls><Refs><EndToEndId>CMS-994102</EndToEndId></Refs><RmtInf><Ustrd>St. Thomas College Fees</Ustrd></RmtInf></TxDtls></NtryDtls>
      </Ntry>
      <Ntry>
        <Amt Ccy="INR">420000.00</Amt>
        <CdtDbtInd>DBIT</CdtDbtInd>
        <BookgDt><Dt>2026-09-09</Dt></BookgDt>
        <NtryDtls><TxDtls><Refs><EndToEndId>CHQ-104921</EndToEndId></Refs><RmtInf><Ustrd>Dell India Clearing</Ustrd></RmtInf></TxDtls></NtryDtls>
      </Ntry>
      <Ntry>
        <Amt Ccy="INR">120000.00</Amt>
        <CdtDbtInd>CRDT</CdtDbtInd>
        <BookgDt><Dt>2026-09-10</Dt></BookgDt>
        <NtryDtls><TxDtls><Refs><EndToEndId>RTGS-882194</EndToEndId></Refs><RmtInf><Ustrd>Cochin Tech Univ Fees</Ustrd></RmtInf></TxDtls></NtryDtls>
      </Ntry>
      <Bal>
        <Tp><CdOrPrtry><Cd>CLBD</Cd></CdOrPrtry></Tp>
        <Amt Ccy="INR">4405000.00</Amt>
      </Bal>
    </Stmt>
  </BkToCstmrStmt>
</Document>`;

interface BankReconciliationViewProps {
  bankAccounts: BankAccountRecord[];
  onReconciliationSaved?: () => void;
}

export const BankReconciliationView: React.FC<BankReconciliationViewProps> = ({
  bankAccounts,
  onReconciliationSaved,
}) => {
  const [selectedBankId, setSelectedBankId] = useState<string>(
    bankAccounts[0]?.id || ''
  );
  const [statementDate, setStatementDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [statementBalanceInput, setStatementBalanceInput] = useState<string>('4405000');
  const [importedLines, setImportedLines] = useState<BankStatementLine[]>([]);
  const [systemTransactions, setSystemTransactions] = useState<SystemBankTransaction[]>([]);
  const [reconciliationHistory, setReconciliationHistory] = useState<BankReconciliationRecord[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'reconcile' | 'history'>('reconcile');
  const [importFormat, setImportFormat] = useState<'CSV' | 'MT940' | 'CAMT'>('CSV');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [manualFileText, setManualFileText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Matched' | 'Unmatched' | 'Pending' | 'Reconciled'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');

  const selectedBank = useMemo(() => {
    return bankAccounts.find((b) => b.id === selectedBankId) || bankAccounts[0];
  }, [bankAccounts, selectedBankId]);

  // Load system transactions and past reconciliations for selected bank
  const loadData = () => {
    if (!selectedBank) return;
    const txs = erpFinanceStorage.getBankTransactions(selectedBank.id);
    setSystemTransactions(txs);
    const history = erpFinanceStorage.getBankReconciliations(selectedBank.id);
    setReconciliationHistory(history);
  };

  useEffect(() => {
    loadData();
  }, [selectedBankId]);

  // If no lines imported yet, auto-load standard realistic demo lines for the selected bank
  useEffect(() => {
    if (importedLines.length === 0) {
      parseCSV(SAMPLE_CSV_CONTENT);
    }
  }, []);

  // Parser: CSV
  const parseCSV = (csvText: string) => {
    const lines = csvText.trim().split('\n');
    const result: BankStatementLine[] = [];
    let closingBal = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(',');
      if (parts.length >= 6) {
        const date = parts[0]?.trim() || '';
        const valueDate = parts[1]?.trim() || date;
        const description = parts[2]?.trim() || '';
        const reference = parts[3]?.trim() || '';
        const withdrawal = parseFloat(parts[4]?.trim()) || 0;
        const deposit = parseFloat(parts[5]?.trim()) || 0;
        const balance = parseFloat(parts[6]?.trim()) || 0;
        if (balance) closingBal = balance;

        result.push({
          id: `stmt-line-${Date.now()}-${i}`,
          date,
          valueDate,
          description,
          reference,
          withdrawal,
          deposit,
          balance,
          matchStatus: 'Unmatched',
        });
      }
    }

    setImportedLines(result);
    if (closingBal > 0) {
      setStatementBalanceInput(String(closingBal));
    }
  };

  // Parser: MT940 (.sta)
  const parseMT940 = (mt940Text: string) => {
    const result: BankStatementLine[] = [];
    const lines = mt940Text.split('\n');
    let lineIdx = 0;
    let closingBal = 0;

    for (let i = 0; i < lines.length; i++) {
      const l = lines[i].trim();
      if (l.startsWith(':61:')) {
        // Tag 61: Statement line e.g. :61:2609080908CR185000,00NTRFNONREF//CMS-994102
        const content = l.slice(4);
        const dateStr = `20${content.slice(0, 2)}-${content.slice(2, 4)}-${content.slice(4, 6)}`;
        const isCredit = content.includes('CR');
        const isDebit = content.includes('DR');
        const amountMatch = content.match(/(CR|DR)(\d+[,.]\d{2})/);
        const amount = amountMatch ? parseFloat(amountMatch[2].replace(',', '.')) : 0;
        const refMatch = content.match(/\/\/([A-Za-z0-9-_]+)/);
        const ref = refMatch ? refMatch[1] : `TX-${lineIdx + 1}`;
        const nextLine = lines[i + 1] && !lines[i + 1].startsWith(':') ? lines[i + 1].trim() : '';

        result.push({
          id: `stmt-mt940-${lineIdx++}`,
          date: dateStr,
          description: nextLine || 'MT940 Swift Movement',
          reference: ref,
          withdrawal: isDebit ? amount : 0,
          deposit: isCredit ? amount : 0,
          matchStatus: 'Unmatched',
        });
      } else if (l.startsWith(':62F:')) {
        // Closing Balance: e.g. :62F:C260915INR4405000,00
        const match = l.match(/INR(\d+[,.]\d{2})/);
        if (match) {
          closingBal = parseFloat(match[1].replace(',', '.'));
        }
      }
    }

    if (result.length > 0) {
      setImportedLines(result);
      if (closingBal > 0) setStatementBalanceInput(String(closingBal));
    }
  };

  // Parser: CAMT.053 (XML)
  const parseCAMT = (camtText: string) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(camtText, 'text/xml');
      const entries = xmlDoc.getElementsByTagName('Ntry');
      const result: BankStatementLine[] = [];

      for (let i = 0; i < entries.length; i++) {
        const ntry = entries[i];
        const amt = parseFloat(ntry.getElementsByTagName('Amt')[0]?.textContent || '0');
        const indicator = ntry.getElementsByTagName('CdtDbtInd')[0]?.textContent;
        const date = ntry.getElementsByTagName('Dt')[0]?.textContent || statementDate;
        const ref = ntry.getElementsByTagName('EndToEndId')[0]?.textContent || `CAMT-${i + 1}`;
        const ustrd = ntry.getElementsByTagName('Ustrd')[0]?.textContent || 'CAMT Statement Entry';

        result.push({
          id: `stmt-camt-${i}`,
          date,
          description: ustrd,
          reference: ref,
          withdrawal: indicator === 'DBIT' ? amt : 0,
          deposit: indicator === 'CRDT' ? amt : 0,
          matchStatus: 'Unmatched',
        });
      }

      // Closing balance
      const bals = xmlDoc.getElementsByTagName('Bal');
      for (let j = 0; j < bals.length; j++) {
        const code = bals[j].getElementsByTagName('Cd')[0]?.textContent;
        if (code === 'CLBD') {
          const amt = parseFloat(bals[j].getElementsByTagName('Amt')[0]?.textContent || '0');
          if (amt > 0) setStatementBalanceInput(String(amt));
        }
      }

      if (result.length > 0) {
        setImportedLines(result);
      }
    } catch (e) {
      console.error('Error parsing CAMT', e);
    }
  };

  // Execute Auto-Matching Engine
  const runAutoMatch = () => {
    const updatedStatement = [...importedLines];
    const updatedSystem = [...systemTransactions];

    let matchCount = 0;

    updatedStatement.forEach((stmtLine) => {
      // Find eligible unmatched system transactions
      const targetAmount = stmtLine.withdrawal > 0 ? stmtLine.withdrawal : stmtLine.deposit;
      const isDeposit = stmtLine.deposit > 0;

      const candidateIdx = updatedSystem.findIndex((sys) => {
        if (sys.status === 'Matched' || sys.status === 'Reconciled') return false;

        // Check direction
        const sysIsDeposit = (sys.deposit || 0) > 0;
        if (sysIsDeposit !== isDeposit) return false;

        const sysAmt = sys.withdrawal || sys.deposit || 0;
        const amountMatch = Math.abs(sysAmt - targetAmount) < 0.01;

        // Reference match (exact or substring)
        const refMatch =
          stmtLine.reference &&
          sys.referenceNumber &&
          (stmtLine.reference.toLowerCase().includes(sys.referenceNumber.toLowerCase()) ||
            sys.referenceNumber.toLowerCase().includes(stmtLine.reference.toLowerCase()));

        return amountMatch && (refMatch || true); // Match by exact amount and direction
      });

      if (candidateIdx !== -1) {
        stmtLine.matchStatus = 'Matched';
        stmtLine.matchedTransactionId = updatedSystem[candidateIdx].id;
        stmtLine.matchedTransactionRef = updatedSystem[candidateIdx].referenceNumber;

        updatedSystem[candidateIdx] = {
          ...updatedSystem[candidateIdx],
          status: 'Matched',
          clearedDate: stmtLine.date,
        };
        matchCount++;
      }
    });

    setImportedLines(updatedStatement);
    setSystemTransactions(updatedSystem);
    setSaveSuccessMessage(`Smart Match Engine successfully paired ${matchCount} transactions with bank statement.`);
    setTimeout(() => setSaveSuccessMessage(''), 4000);
  };

  // Toggle individual match
  const handleToggleMatch = (lineId: string) => {
    const line = importedLines.find((l) => l.id === lineId);
    if (!line) return;

    if (line.matchStatus === 'Matched' || line.matchStatus === 'Reconciled') {
      // Unmatch
      setImportedLines((prev) =>
        prev.map((l) => (l.id === lineId ? { ...l, matchStatus: 'Unmatched', matchedTransactionId: undefined } : l))
      );
      if (line.matchedTransactionId) {
        setSystemTransactions((prev) =>
          prev.map((s) => (s.id === line.matchedTransactionId ? { ...s, status: 'Unmatched' } : s))
        );
      }
    } else {
      // Try to match with first available unmatched transaction
      const targetAmount = line.withdrawal > 0 ? line.withdrawal : line.deposit;
      const isDeposit = line.deposit > 0;
      const matchSys = systemTransactions.find(
        (s) =>
          s.status === 'Unmatched' &&
          ((line.deposit > 0 && (s.deposit || 0) > 0) || (line.withdrawal > 0 && (s.withdrawal || 0) > 0)) &&
          Math.abs((s.withdrawal || s.deposit || 0) - targetAmount) < 0.01
      );

      if (matchSys) {
        setImportedLines((prev) =>
          prev.map((l) =>
            l.id === lineId
              ? { ...l, matchStatus: 'Matched', matchedTransactionId: matchSys.id, matchedTransactionRef: matchSys.referenceNumber }
              : l
          )
        );
        setSystemTransactions((prev) =>
          prev.map((s) => (s.id === matchSys.id ? { ...s, status: 'Matched', clearedDate: line.date } : s))
        );
      } else {
        // Mark as manual reconciled
        setImportedLines((prev) =>
          prev.map((l) => (l.id === lineId ? { ...l, matchStatus: 'Matched' } : l))
        );
      }
    }
  };

  // Mark all matched as reconciled
  const handleReconcileAllMatched = () => {
    setImportedLines((prev) =>
      prev.map((l) => (l.matchStatus === 'Matched' ? { ...l, matchStatus: 'Reconciled' } : l))
    );
    setSystemTransactions((prev) =>
      prev.map((s) => (s.status === 'Matched' ? { ...s, status: 'Reconciled' } : s))
    );
    setSaveSuccessMessage('All matched items marked as Reconciled!');
    setTimeout(() => setSaveSuccessMessage(''), 4000);
  };

  // Reconcile calculations
  const statementBalance = parseFloat(statementBalanceInput) || 0;
  const systemBookBalance = selectedBank?.currentBalance || 0;

  // Total deposits in transit (in system but not in statement)
  const depositsInTransit = systemTransactions
    .filter((s) => s.status === 'Unmatched' && (s.deposit || 0) > 0)
    .reduce((sum, s) => sum + (s.deposit || 0), 0);

  // Outstanding cheques (issued in system but not cleared in statement)
  const outstandingCheques = systemTransactions
    .filter((s) => s.status === 'Unmatched' && (s.withdrawal || 0) > 0)
    .reduce((sum, s) => sum + (s.withdrawal || 0), 0);

  // Computed adjusted balance
  const systemAdjustedBalance = systemBookBalance - outstandingCheques + depositsInTransit;
  const difference = statementBalance - systemBookBalance;

  // Counts
  const counts = useMemo(() => {
    const matched = importedLines.filter((l) => l.matchStatus === 'Matched').length;
    const reconciled = importedLines.filter((l) => l.matchStatus === 'Reconciled').length;
    const unmatched = importedLines.filter((l) => l.matchStatus === 'Unmatched').length;
    const pending = importedLines.filter((l) => l.matchStatus === 'Pending').length;
    return { matched, reconciled, unmatched, pending, total: importedLines.length };
  }, [importedLines]);

  // Save Reconciliation Session to Storage
  const handleSaveReconciliation = () => {
    if (!selectedBank) return;

    const record: BankReconciliationRecord = {
      id: `REC-${Date.now()}`,
      reconciliationNumber: `BR-${Date.now().toString().slice(-6)}`,
      bankAccountId: selectedBank.id,
      bankAccountName: selectedBank.name,
      statementDate,
      statementBalance,
      systemBalance: systemBookBalance,
      difference,
      status: Math.abs(difference) < 1 ? 'Reconciled' : 'Draft',
      matchedCount: counts.matched + counts.reconciled,
      unmatchedCount: counts.unmatched,
      matchedLinesCount: counts.matched + counts.reconciled,
      unmatchedLinesCount: counts.unmatched,
      reconciledLinesCount: counts.reconciled,
      reconciledBy: 'Treasury Admin',
      statementLines: importedLines,
      lines: importedLines,
      notes: `Reconciliation as of ${statementDate}. Statement balance: ${formatINR(statementBalance)}, Difference: ${formatINR(difference)}`,
      createdAt: new Date().toISOString(),
    };

    erpFinanceStorage.saveBankReconciliation(record);
    loadData();
    setSaveSuccessMessage('Bank Reconciliation record finalized and safely archived.');
    setTimeout(() => setSaveSuccessMessage(''), 4000);
    if (onReconciliationSaved) onReconciliationSaved();
  };

  // Filtered Statement Lines
  const filteredStatementLines = useMemo(() => {
    return importedLines.filter((line) => {
      const matchesStatus =
        statusFilter === 'All' || line.matchStatus === statusFilter;
      const matchesSearch =
        searchQuery === '' ||
        line.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        line.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(line.withdrawal || line.deposit).includes(searchQuery);
      return matchesStatus && matchesSearch;
    });
  }, [importedLines, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Controls & Bank Account Selection */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Bank Reconciliation</h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Semi-Automated Statement Engine
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Cross-check bank feed against General Ledger and resolve clearing discrepancies
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Bank Select */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Bank A/c:</label>
              <select
                value={selectedBankId}
                onChange={(e) => setSelectedBankId(e.target.value)}
                className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 min-w-[220px]"
              >
                {bankAccounts.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.name} ({bank.accountNumber.slice(-4)})
                  </option>
                ))}
              </select>
            </div>

            {/* Statement Date */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Statement Date:</label>
              <input
                type="date"
                value={statementDate}
                onChange={(e) => setStatementDate(e.target.value)}
                className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            {/* Import Statement Button */}
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <UploadCloud className="w-4 h-4 text-indigo-600" />
              <span>Import Bank Statement</span>
            </button>
          </div>
        </div>

        {/* Success Banner */}
        {saveSuccessMessage && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-800 text-xs font-medium animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{saveSuccessMessage}</span>
            </div>
            <button onClick={() => setSaveSuccessMessage('')} className="text-emerald-500 hover:text-emerald-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 4 Main Reconciliation KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5 pt-5 border-t border-slate-100">
          {/* Statement Balance */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
              <span>Statement Balance</span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Bank Feed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-mono font-bold text-sm">₹</span>
              <input
                type="number"
                value={statementBalanceInput}
                onChange={(e) => setStatementBalanceInput(e.target.value)}
                className="text-lg font-bold font-mono text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:outline-none focus:border-indigo-600 w-full py-0.5"
              />
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Direct from imported bank statement</div>
          </div>

          {/* System Cleared / Book Balance */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
              <span>System Ledger Balance</span>
              <span className="text-[10px] uppercase font-bold text-slate-400">GL Code {selectedBank?.glAccountCode}</span>
            </div>
            <div className="text-lg font-bold font-mono text-slate-900">
              {formatINR(systemBookBalance)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Active ledger balance in system
            </div>
          </div>

          {/* Difference */}
          <div
            className={`p-4 rounded-xl border ${
              Math.abs(difference) < 1
                ? 'bg-emerald-50/50 border-emerald-200'
                : 'bg-amber-50/50 border-amber-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold mb-1">
              <span className={Math.abs(difference) < 1 ? 'text-emerald-900' : 'text-amber-900'}>
                Reconciliation Difference
              </span>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  Math.abs(difference) < 1
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {Math.abs(difference) < 1 ? 'Reconciled' : 'Unmatched'}
              </span>
            </div>
            <div
              className={`text-lg font-bold font-mono ${
                Math.abs(difference) < 1 ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {formatINR(difference)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {Math.abs(difference) < 1
                ? 'Statement matches General Ledger exactly'
                : `Variance requires matching or timing adjustment`}
            </div>
          </div>

          {/* Matching Status Metrics */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div className="text-xs text-slate-500 font-medium mb-1">Matching Pipeline</div>
            <div className="grid grid-cols-3 gap-1 text-center">
              <div className="p-1.5 bg-white rounded-lg border border-slate-100">
                <div className="text-xs font-bold text-emerald-600">{counts.matched + counts.reconciled}</div>
                <div className="text-[9px] text-slate-400 uppercase font-semibold">Matched</div>
              </div>
              <div className="p-1.5 bg-white rounded-lg border border-slate-100">
                <div className="text-xs font-bold text-amber-600">{counts.unmatched}</div>
                <div className="text-[9px] text-slate-400 uppercase font-semibold">Unmatched</div>
              </div>
              <div className="p-1.5 bg-white rounded-lg border border-slate-100">
                <div className="text-xs font-bold text-indigo-600">{counts.total}</div>
                <div className="text-[9px] text-slate-400 uppercase font-semibold">Total</div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={runAutoMatch}
                className="w-full py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Auto-Match</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Tabs: Reconcile Workbench vs Audit History */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveSubTab('reconcile')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'reconcile'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Reconciliation Workbench ({importedLines.length} Feed Lines)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'history'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Archived Reconciliations ({reconciliationHistory.length})</span>
          </button>
        </div>

        {activeSubTab === 'reconcile' && (
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={handleReconcileAllMatched}
              disabled={counts.matched === 0}
              className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mark All Matched as Reconciled</span>
            </button>
            <button
              onClick={handleSaveReconciliation}
              className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Finalize & Save Reconciliation</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Reconciliation Content */}
      {activeSubTab === 'reconcile' ? (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search description, reference, or amount..."
                className="w-full text-xs bg-transparent focus:outline-none placeholder:text-slate-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {(['All', 'Matched', 'Unmatched', 'Reconciled', 'Pending'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === filter
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Statement Feed Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-bold text-slate-900">
                  Bank Statement Feed ({filteredStatementLines.length} Entries)
                </span>
              </div>
              <div className="text-xs text-slate-500">
                Showing entries for statement as of <span className="font-semibold text-slate-800">{statementDate}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Reference / Cheque</th>
                    <th className="py-3 px-4 text-right">Withdrawal (Dr)</th>
                    <th className="py-3 px-4 text-right">Deposit (Cr)</th>
                    <th className="py-3 px-4 text-center">Match Status</th>
                    <th className="py-3 px-4">Matched GL Instrument</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStatementLines.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="text-xs font-medium">No statement lines found matching current filter.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredStatementLines.map((line) => {
                      const isDeposit = line.deposit > 0;
                      return (
                        <tr key={line.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">{line.date}</td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{line.description}</div>
                            {line.valueDate && line.valueDate !== line.date && (
                              <div className="text-[10px] text-slate-400">Val: {line.valueDate}</div>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">
                            {line.reference ? (
                              <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700">
                                {line.reference}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-medium text-rose-600 whitespace-nowrap">
                            {line.withdrawal > 0 ? formatINR(line.withdrawal) : '—'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">
                            {line.deposit > 0 ? formatINR(line.deposit) : '—'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                line.matchStatus === 'Reconciled'
                                  ? 'bg-purple-100 text-purple-800'
                                  : line.matchStatus === 'Matched'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : line.matchStatus === 'Pending'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {line.matchStatus === 'Matched' && <Check className="w-3 h-3 text-emerald-600" />}
                              {line.matchStatus === 'Reconciled' && <CheckCircle2 className="w-3 h-3 text-purple-600" />}
                              {line.matchStatus === 'Unmatched' && <AlertCircle className="w-3 h-3 text-amber-600" />}
                              <span>{line.matchStatus}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs font-mono text-slate-600">
                            {line.matchedTransactionRef ? (
                              <div className="flex items-center gap-1 text-slate-800 font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                {line.matchedTransactionRef}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Unlinked</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => handleToggleMatch(line.id)}
                              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                                line.matchStatus === 'Matched' || line.matchStatus === 'Reconciled'
                                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                              }`}
                            >
                              {line.matchStatus === 'Matched' || line.matchStatus === 'Reconciled'
                                ? 'Unlink'
                                : 'Match Line'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* System Bank Ledger Comparison Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-bold text-slate-900">
                  System ERP Bank Transactions ({systemTransactions.length} Records)
                </span>
              </div>
              <span className="text-xs text-slate-500 font-mono">Account: {selectedBank?.accountNumber}</span>
            </div>

            <div className="overflow-x-auto max-h-80">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-slate-100/90 backdrop-blur-xs z-10">
                  <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Party / Reference</th>
                    <th className="py-2.5 px-4">Description</th>
                    <th className="py-2.5 px-4 text-right">Debit (Withdrawal)</th>
                    <th className="py-2.5 px-4 text-right">Credit (Deposit)</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {systemTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-4 font-mono text-slate-600">{tx.date}</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">
                        {tx.partyName || tx.referenceNumber}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 truncate max-w-xs">{tx.description}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-medium text-rose-600">
                        {tx.withdrawal ? formatINR(tx.withdrawal) : '—'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-600">
                        {tx.deposit ? formatINR(tx.deposit) : '—'}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            tx.status === 'Reconciled'
                              ? 'bg-purple-100 text-purple-800'
                              : tx.status === 'Matched'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Reconciliations Archive History */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Reconciliation Audit Trail</h3>
              <p className="text-xs text-slate-500">Historical closed reconciliation sessions and audit proofs</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Session Date</th>
                  <th className="py-3 px-4">Bank Account</th>
                  <th className="py-3 px-4 text-right">Statement Balance</th>
                  <th className="py-3 px-4 text-right">System Balance</th>
                  <th className="py-3 px-4 text-right">Variance</th>
                  <th className="py-3 px-4 text-center">Result</th>
                  <th className="py-3 px-4">Reconciled By</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reconciliationHistory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">
                      <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-xs font-medium">No past reconciliation sessions recorded for this bank account.</p>
                    </td>
                  </tr>
                ) : (
                  reconciliationHistory.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{rec.statementDate}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{rec.bankAccountName}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatINR(rec.statementBalance)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        {formatINR(rec.systemBalance)}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono font-bold ${
                          Math.abs(rec.difference) < 1 ? 'text-emerald-600' : 'text-amber-600'
                        }`}
                      >
                        {formatINR(rec.difference)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            rec.status === 'Balanced'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{rec.reconciledBy}</td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{rec.notes}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bank Statement Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Import Bank Statement</h3>
                  <p className="text-xs text-slate-500">Supports standard CSV, MT940 Swift, and CAMT.053 ISO XML</p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Format selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Statement Format</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'CSV', label: 'CSV Spreadsheet', desc: 'Standard Bank CSV statement' },
                    { id: 'MT940', label: 'MT940 Swift (.sta)', desc: 'Standard Swift electronic statement' },
                    { id: 'CAMT', label: 'CAMT.053 XML', desc: 'ISO 20022 electronic XML statement' },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setImportFormat(fmt.id as any)}
                      className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                        importFormat === fmt.id
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-2xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-bold text-xs text-slate-900">{fmt.label}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{fmt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Instant Load Sample Buttons */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Instant Sample Bank Feeds (One-Click Testing)</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setImportFormat('CSV');
                      setManualFileText(SAMPLE_CSV_CONTENT);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                  >
                    Load Federal Bank CSV Sample
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImportFormat('MT940');
                      setManualFileText(SAMPLE_MT940_CONTENT);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                  >
                    Load Swift MT940 (.sta) Sample
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImportFormat('CAMT');
                      setManualFileText(SAMPLE_CAMT_CONTENT);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                  >
                    Load CAMT.053 XML Sample
                  </button>
                </div>
              </div>

              {/* Paste or Upload Area */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Statement Content / Paste Text
                </label>
                <textarea
                  rows={7}
                  value={manualFileText}
                  onChange={(e) => setManualFileText(e.target.value)}
                  placeholder="Paste CSV rows, MT940 text, or CAMT.053 XML here..."
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
                />
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <label className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer">
                  <input
                    type="file"
                    accept=".csv,.txt,.sta,.xml"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const text = ev.target?.result as string;
                          if (text) setManualFileText(text);
                        };
                        reader.readAsText(file);
                      }
                    }}
                  />
                  Browse local file (.csv, .sta, .xml)...
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!manualFileText.trim()) return;
                      if (importFormat === 'CSV') parseCSV(manualFileText);
                      else if (importFormat === 'MT940') parseMT940(manualFileText);
                      else if (importFormat === 'CAMT') parseCAMT(manualFileText);
                      setIsImportModalOpen(false);
                      setSaveSuccessMessage('Statement imported successfully! You can now run the Smart Match Engine.');
                    }}
                    className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Process & Load Statement
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
