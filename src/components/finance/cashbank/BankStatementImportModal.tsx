import React, { useState, useMemo } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Search,
  Sparkles,
  X,
  Layers,
  ShieldCheck,
  Check,
  Info,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import {
  BankAccountRecord,
  BankStatementLine,
  SystemBankTransaction,
} from '../../../types/finance';

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

// Sample realistic statement files for 1-click testing
export const SAMPLE_CSV_CONTENT = `Date,Value Date,Description,Reference/Cheque,Withdrawal,Deposit,Balance
2026-09-08,2026-09-08,NEFT CR-ST. THOMAS COLLEGE-COLLEGE FEES,CMS-994102,0,185000,4835000
2026-09-09,2026-09-09,CHQ CLG-CHQ-104921-DELL INDIA IT LABS,CHQ-104921,420000,0,4415000
2026-09-10,2026-09-10,RTGS CR-COCHIN TECH UNIV-SEMESTER FEE,RTGS-882194,0,120000,4535000
2026-09-11,2026-09-11,BANK CHARGES-ANNUAL LEDGER FOLIO MAINTENANCE,CHG-2026-09,1750,0,4533250
2026-09-12,2026-09-12,NEFT DR-GODREJ INTERIO-CAMPUS CHAIRS,NEFT-49102,175000,0,4358250
2026-09-13,2026-09-13,DIRECT DEBIT-KSEB ELECTRICITY BILL SUBSTATION,EB-99214,38500,0,4319750
2026-09-14,2026-09-14,TRF TO CASH-CONTRA PETTY CASH IMPREST,TRF-2026-0001,50000,0,4269750
2026-09-15,2026-09-15,CHQ DEP CLG-CHQ-772101-HOLY GRACE ACADEMY,CHQ-772101,0,95000,4364750
2026-09-15,2026-09-15,INWARD UPI-UNKNOWN DIRECT DONATION ALUMNI,UPI-6612948,0,15000,4379750`;

export const SAMPLE_MT940_CONTENT = `:20:MT940-20260915-01
:25:12880200018942
:28C:00045/001
:60F:C260901INR4650000,00
:61:2609080908CR185000,00NTRFNONREF//CMS-994102
ST. THOMAS COLLEGE CMS RECEIPT
:61:2609090909DR420000,00NCHQNONREF//CHQ-104921
CHQ CLG DELL TECHNOLOGIES
:61:2609100910CR120000,00NTRFNONREF//RTGS-882194
COCHIN TECH UNIV LMS
:61:2609110911DR1750,00NCHGNONREF//CHG-2026-09
BANK FOLIO & SERVICE CHARGES
:61:2609120912DR175000,00NTRFNONREF//NEFT-49102
GODREJ INTERIO INVOICE
:61:2609130913DR38500,00NDRBNONREF//EB-99214
KSEB HT ELECTRICITY CHARGES
:61:2609140914DR50000,00NTRFNONREF//TRF-2026-0001
CONTRA PETTY CASH WITHDRAWAL
:61:2609150915CR95000,00NCHQNONREF//CHQ-772101
HOLY GRACE ACADEMY CLEARING
:61:2609150915CR15000,00NTRFNONREF//UPI-6612948
ALUMNI CHAPTER DIRECT UPI
:62F:C260915INR4379750,00
-}`;

export const SAMPLE_CAMT_CONTENT = `<?xml version="1.0" encoding="UTF-8"?>
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
      <Ntry>
        <Amt Ccy="INR">1750.00</Amt>
        <CdtDbtInd>DBIT</CdtDbtInd>
        <BookgDt><Dt>2026-09-11</Dt></BookgDt>
        <NtryDtls><TxDtls><Refs><EndToEndId>CHG-2026-09</EndToEndId></Refs><RmtInf><Ustrd>Bank Ledger Folio Maintenance</Ustrd></RmtInf></TxDtls></NtryDtls>
      </Ntry>
      <Bal>
        <Tp><CdOrPrtry><Cd>CLBD</Cd></CdOrPrtry></Tp>
        <Amt Ccy="INR">4379750.00</Amt>
      </Bal>
    </Stmt>
  </BkToCstmrStmt>
</Document>`;

interface BankStatementImportModalProps {
  bankAccount: BankAccountRecord;
  systemTransactions: SystemBankTransaction[];
  onClose: () => void;
  onImportComplete: (result: {
    lines: BankStatementLine[];
    statementBalance?: number;
    statementDate?: string;
    matchedCount: number;
    unmatchedCount: number;
  }) => void;
}

export const BankStatementImportModal: React.FC<BankStatementImportModalProps> = ({
  bankAccount,
  systemTransactions,
  onClose,
  onImportComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'preview'>('upload');
  const [fileFormat, setFileFormat] = useState<'CSV' | 'MT940' | 'CAMT'>('CSV');
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [autoFlagUnmatched, setAutoFlagUnmatched] = useState<boolean>(true);
  const [enableSmartMatching, setEnableSmartMatching] = useState<boolean>(true);
  const [previewFilter, setPreviewFilter] = useState<'all' | 'matched' | 'unmatched'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Column mapping state for advanced CSV files
  const [showMapping, setShowMapping] = useState<boolean>(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMap, setColumnMap] = useState({
    dateCol: 0,
    descCol: 2,
    refCol: 3,
    drCol: 4,
    crCol: 5,
    balCol: 6,
  });

  // Parsed intermediate results
  const [parsedLines, setParsedLines] = useState<BankStatementLine[]>([]);
  const [detectedClosingBalance, setDetectedClosingBalance] = useState<number | undefined>(undefined);
  const [detectedStatementDate, setDetectedStatementDate] = useState<string | undefined>(undefined);
  const [parseError, setParseError] = useState<string | null>(null);

  // Helper: Detect reason for unmatched entries to flag for manual review
  const categorizeUnmatchedEntry = (line: {
    description: string;
    reference: string;
    withdrawal: number;
    deposit: number;
  }): {
    category: 'Unrecorded Charge' | 'Timing Difference' | 'Missing Deposit' | 'Disputed Entry' | 'Other';
    reason: string;
    suggestedAction: string;
  } => {
    const text = (line.description + ' ' + line.reference).toUpperCase();

    if (line.withdrawal > 0) {
      if (
        text.includes('CHARGE') ||
        text.includes('CHG') ||
        text.includes('FEE') ||
        text.includes('TAX') ||
        text.includes('GST') ||
        text.includes('SMS') ||
        text.includes('MAINT')
      ) {
        return {
          category: 'Unrecorded Charge',
          reason: 'Bank charge / debit fee levied by bank; not yet posted to ERP expense ledger',
          suggestedAction: 'Create quick Bank Expense voucher to match',
        };
      }
      if (text.includes('CHQ') || text.includes('CHEQUE')) {
        return {
          category: 'Timing Difference',
          reason: 'Cheque cleared in bank feed; missing matching issued cheque in system ledger',
          suggestedAction: 'Verify cheque register or issue date timing delay',
        };
      }
      if (text.includes('DIRECT') || text.includes('DEBIT') || text.includes('EB-') || text.includes('BILL')) {
        return {
          category: 'Unrecorded Charge',
          reason: 'Direct debit mandate executed by bank; pending ERP payment voucher',
          suggestedAction: 'Book vendor / utility payment to clear discrepancy',
        };
      }
      return {
        category: 'Disputed Entry',
        reason: 'Debit on bank statement with no corresponding system payment',
        suggestedAction: 'Verify counterparty or check for unauthorized deduction',
      };
    } else {
      if (text.includes('INTEREST') || text.includes('INT CR') || text.includes('SAVINGS')) {
        return {
          category: 'Unrecorded Charge',
          reason: 'Bank interest credited; not yet recognized in finance revenue ledger',
          suggestedAction: 'Post Bank Interest Received journal entry',
        };
      }
      if (text.includes('UPI') || text.includes('NEFT') || text.includes('RTGS') || text.includes('IMPS')) {
        return {
          category: 'Missing Deposit',
          reason: 'Inward electronic transfer received in bank with no customer receipt voucher',
          suggestedAction: 'Create receipt voucher against student/customer invoice',
        };
      }
      if (text.includes('CHQ') || text.includes('CHEQUE')) {
        return {
          category: 'Timing Difference',
          reason: 'Cheque deposit clearing; check pending receipt vouchers in deposit transit',
          suggestedAction: 'Check deposited cheque register for clearing confirmation',
        };
      }
      return {
        category: 'Other',
        reason: 'Credit entry not found in system receipts ledger',
        suggestedAction: 'Review transaction narration and credit to appropriate party',
      };
    }
  };

  // CSV Parser with header detection and RFC4180 quote awareness
  const parseCSVRows = (rawText: string) => {
    const lines = rawText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return { items: [], closingBal: undefined, latestDate: undefined };

    // Find header line
    let headerIdx = 0;
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      const lower = lines[i].toLowerCase();
      if (lower.includes('date') || lower.includes('withdrawal') || lower.includes('deposit') || lower.includes('balance') || lower.includes('narration')) {
        headerIdx = i;
        break;
      }
    }

    const headerParts = parseCSVLine(lines[headerIdx]);
    setCsvHeaders(headerParts);

    // Auto-identify column indices if standard
    let dCol = columnMap.dateCol;
    let descCol = columnMap.descCol;
    let refCol = columnMap.refCol;
    let drCol = columnMap.drCol;
    let crCol = columnMap.crCol;
    let balCol = columnMap.balCol;

    headerParts.forEach((h, idx) => {
      const hl = h.toLowerCase();
      if (hl.includes('value date') && dCol === 0) dCol = idx;
      else if (hl.includes('date') && !hl.includes('value')) dCol = idx;
      else if (hl.includes('desc') || hl.includes('narration') || hl.includes('particulars')) descCol = idx;
      else if (hl.includes('ref') || hl.includes('cheque') || hl.includes('chq') || hl.includes('utr')) refCol = idx;
      else if (hl.includes('withdraw') || hl.includes('debit') || hl.includes('dr')) drCol = idx;
      else if (hl.includes('deposit') || hl.includes('credit') || hl.includes('cr')) crCol = idx;
      else if (hl.includes('bal')) balCol = idx;
    });

    setColumnMap({ dateCol: dCol, descCol, refCol, drCol, crCol, balCol });

    const results: BankStatementLine[] = [];
    let closingBal: number | undefined = undefined;
    let latestDate: string | undefined = undefined;

    for (let i = headerIdx + 1; i < lines.length; i++) {
      const parts = parseCSVLine(lines[i]);
      if (parts.length < 2) continue;

      const dateStr = parts[dCol]?.trim() || '';
      if (!dateStr || dateStr.toLowerCase().includes('total')) continue;

      const desc = parts[descCol]?.trim() || 'Bank Transaction';
      const ref = parts[refCol]?.trim() || '';
      const dr = cleanNumber(parts[drCol]);
      const cr = cleanNumber(parts[crCol]);
      const bal = cleanNumber(parts[balCol]);

      if (bal > 0) closingBal = bal;
      if (dateStr) latestDate = dateStr;

      results.push({
        id: `csv-line-${Date.now()}-${i}`,
        date: normalizeDate(dateStr),
        description: desc,
        reference: ref,
        withdrawal: dr,
        deposit: cr,
        balance: bal > 0 ? bal : undefined,
        matchStatus: 'Unmatched',
      });
    }

    return { items: results, closingBal, latestDate };
  };

  // Helper: parse single CSV line handling quotes
  const parseCSVLine = (text: string): string[] => {
    const tokens: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        if (inQuotes && text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        tokens.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    tokens.push(cur.trim());
    return tokens;
  };

  const cleanNumber = (val?: string): number => {
    if (!val) return 0;
    const cleaned = val.replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const normalizeDate = (d: string): string => {
    if (!d) return new Date().toISOString().split('T')[0];
    if (d.includes('-') && d.length === 10) return d;
    // Handle DD/MM/YYYY or DD-MM-YYYY
    const parts = d.split(/[/-]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      } else if (parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    return d;
  };

  // MT940 (.sta) SWIFT Parser
  const parseMT940Data = (rawText: string) => {
    const results: BankStatementLine[] = [];
    const lines = rawText.split(/\r?\n/);
    let closingBal: number | undefined = undefined;
    let latestDate: string | undefined = undefined;
    let lineIdx = 0;

    for (let i = 0; i < lines.length; i++) {
      const l = lines[i].trim();

      // Tag 61: Statement line
      if (l.startsWith(':61:')) {
        const content = l.slice(4);
        // Format: YYMMDD[MMDD](C|D|RC|RD)Amount[N]TransactionType[Reference]//AccountOwnerRef
        const dateRaw = content.slice(0, 6);
        const year = `20${dateRaw.slice(0, 2)}`;
        const month = dateRaw.slice(2, 4);
        const day = dateRaw.slice(4, 6);
        const formattedDate = `${year}-${month}-${day}`;
        latestDate = formattedDate;

        const isCredit = content.includes('CR') || (content.includes('C') && !content.includes('DR') && !content.includes('D'));
        const isDebit = content.includes('DR') || content.includes('D');

        const amountMatch = content.match(/(?:CR|DR|C|D)([0-9]+[.,][0-9]{2})/);
        const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : 0;

        const refMatch = content.match(/\/\/([A-Za-z0-9-_]+)/);
        const ref = refMatch ? refMatch[1] : `SWIFT-${lineIdx + 1}`;

        // Look ahead for :86: or subsequent narration lines
        let narration = '';
        if (lines[i + 1] && lines[i + 1].startsWith(':86:')) {
          narration = lines[i + 1].slice(4).trim();
        } else if (lines[i + 1] && !lines[i + 1].startsWith(':')) {
          narration = lines[i + 1].trim();
        }

        results.push({
          id: `mt940-line-${lineIdx++}`,
          date: formattedDate,
          description: narration || 'SWIFT Electronic Settlement',
          reference: ref,
          withdrawal: isDebit ? amount : 0,
          deposit: isCredit ? amount : 0,
          matchStatus: 'Unmatched',
        });
      } else if (l.startsWith(':62F:') || l.startsWith(':62M:')) {
        // Closing Balance: :62F:C260915INR4379750,00
        const match = l.match(/[A-Z]{3}([0-9]+[.,][0-9]{2})/);
        if (match) {
          closingBal = parseFloat(match[1].replace(',', '.'));
        }
      }
    }

    return { items: results, closingBal, latestDate };
  };

  // CAMT.053 XML Parser
  const parseCAMTData = (rawText: string) => {
    const results: BankStatementLine[] = [];
    let closingBal: number | undefined = undefined;
    let latestDate: string | undefined = undefined;

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(rawText, 'text/xml');
      const entries = xmlDoc.getElementsByTagName('Ntry');

      for (let i = 0; i < entries.length; i++) {
        const ntry = entries[i];
        const amt = parseFloat(ntry.getElementsByTagName('Amt')[0]?.textContent || '0');
        const indicator = ntry.getElementsByTagName('CdtDbtInd')[0]?.textContent;
        const date = ntry.getElementsByTagName('Dt')[0]?.textContent || new Date().toISOString().split('T')[0];
        const ref = ntry.getElementsByTagName('EndToEndId')[0]?.textContent || `ISO-${i + 1}`;
        const ustrd = ntry.getElementsByTagName('Ustrd')[0]?.textContent || 'CAMT Statement Entry';

        latestDate = date;

        results.push({
          id: `camt-line-${i}`,
          date,
          description: ustrd,
          reference: ref,
          withdrawal: indicator === 'DBIT' ? amt : 0,
          deposit: indicator === 'CRDT' ? amt : 0,
          matchStatus: 'Unmatched',
        });
      }

      const bals = xmlDoc.getElementsByTagName('Bal');
      for (let j = 0; j < bals.length; j++) {
        const code = bals[j].getElementsByTagName('Cd')[0]?.textContent;
        if (code === 'CLBD') {
          const amt = parseFloat(bals[j].getElementsByTagName('Amt')[0]?.textContent || '0');
          if (amt > 0) closingBal = amt;
        }
      }
    } catch (e) {
      console.error('CAMT XML Parse error', e);
    }

    return { items: results, closingBal, latestDate };
  };

  // Execute parsing and match ledger
  const handleParseAndSimulate = () => {
    if (!fileContent.trim()) {
      setParseError('Please upload a statement file or paste file text to proceed.');
      return;
    }

    setParseError(null);
    let parsedResult: { items: BankStatementLine[]; closingBal?: number; latestDate?: string };

    try {
      if (fileFormat === 'CSV') {
        parsedResult = parseCSVRows(fileContent);
      } else if (fileFormat === 'MT940') {
        parsedResult = parseMT940Data(fileContent);
      } else {
        parsedResult = parseCAMTData(fileContent);
      }

      if (parsedResult.items.length === 0) {
        setParseError('Could not find any statement transaction rows. Please verify your file format.');
        return;
      }

      // Ledger Matching Simulation
      const availableSystemTxs = [...systemTransactions];
      const processedLines: BankStatementLine[] = parsedResult.items.map((line) => {
        const targetAmount = line.withdrawal > 0 ? line.withdrawal : line.deposit;
        const isDeposit = line.deposit > 0;

        if (enableSmartMatching) {
          // Find matching system transaction
          const candidateIdx = availableSystemTxs.findIndex((sys) => {
            if (sys.status === 'Matched' || sys.status === 'Reconciled') return false;
            const sysIsDeposit = (sys.deposit || 0) > 0;
            if (sysIsDeposit !== isDeposit) return false;

            const sysAmt = sys.withdrawal || sys.deposit || 0;
            const amountMatches = Math.abs(sysAmt - targetAmount) < 0.01;

            // Check reference match
            const refMatches =
              line.reference &&
              sys.referenceNumber &&
              (line.reference.toLowerCase().includes(sys.referenceNumber.toLowerCase()) ||
                sys.referenceNumber.toLowerCase().includes(line.reference.toLowerCase()));

            return amountMatches && (refMatches || true);
          });

          if (candidateIdx !== -1) {
            const matchedSys = availableSystemTxs[candidateIdx];
            // Remove candidate so it isn't matched twice
            availableSystemTxs.splice(candidateIdx, 1);

            return {
              ...line,
              matchStatus: 'Matched',
              matchedTransactionId: matchedSys.id,
              matchedTransactionRef: matchedSys.referenceNumber,
              flaggedForReview: false,
            };
          }
        }

        // Entry is unmatched -> Flag for manual review if enabled
        const review = categorizeUnmatchedEntry(line);
        return {
          ...line,
          matchStatus: 'Unmatched',
          flaggedForReview: autoFlagUnmatched,
          reviewCategory: review.category,
          reviewReason: review.reason,
          suggestedAction: review.suggestedAction,
        };
      });

      setParsedLines(processedLines);
      setDetectedClosingBalance(parsedResult.closingBal);
      setDetectedStatementDate(parsedResult.latestDate);
      setActiveTab('preview');
    } catch (err: any) {
      setParseError(`Parsing error: ${err.message || 'Malformed file structure'}`);
    }
  };

  // Quick Load Sample Handler
  const handleLoadSample = (type: 'CSV' | 'MT940' | 'CAMT') => {
    setFileFormat(type);
    if (type === 'CSV') {
      setFileContent(SAMPLE_CSV_CONTENT);
      setFileName('FederalBank_CurrentAc_Sept2026.csv');
    } else if (type === 'MT940') {
      setFileContent(SAMPLE_MT940_CONTENT);
      setFileName('Swift_MT940_Stmt_20260915.sta');
    } else {
      setFileContent(SAMPLE_CAMT_CONTENT);
      setFileName('CAMT053_ISO20022_BankFeed.xml');
    }
    setParseError(null);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processSelectedFile(files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    setFileName(file.name);
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'sta' || ext === 'mt940') {
      setFileFormat('MT940');
    } else if (ext === 'xml') {
      setFileFormat('CAMT');
    } else {
      setFileFormat('CSV');
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (text) {
        setFileContent(text);
        setParseError(null);
      }
    };
    reader.readAsText(file);
  };

  // Summary Metrics of Parsed Lines
  const metrics = useMemo(() => {
    const totalLines = parsedLines.length;
    const matched = parsedLines.filter((l) => l.matchStatus === 'Matched');
    const unmatched = parsedLines.filter((l) => l.matchStatus === 'Unmatched');
    const flagged = parsedLines.filter((l) => l.flaggedForReview);

    const totalWithdrawals = parsedLines.reduce((sum, l) => sum + (l.withdrawal || 0), 0);
    const totalDeposits = parsedLines.reduce((sum, l) => sum + (l.deposit || 0), 0);
    const matchedWithdrawals = matched.reduce((sum, l) => sum + (l.withdrawal || 0), 0);
    const matchedDeposits = matched.reduce((sum, l) => sum + (l.deposit || 0), 0);

    return {
      totalLines,
      matchedCount: matched.length,
      unmatchedCount: unmatched.length,
      flaggedCount: flagged.length,
      totalWithdrawals,
      totalDeposits,
      matchedWithdrawals,
      matchedDeposits,
    };
  }, [parsedLines]);

  // Filtered Preview Lines
  const filteredPreview = useMemo(() => {
    return parsedLines.filter((l) => {
      if (previewFilter === 'matched' && l.matchStatus !== 'Matched') return false;
      if (previewFilter === 'unmatched' && l.matchStatus !== 'Unmatched') return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          l.description.toLowerCase().includes(q) ||
          l.reference.toLowerCase().includes(q) ||
          (l.reviewReason && l.reviewReason.toLowerCase().includes(q)) ||
          String(l.withdrawal || l.deposit).includes(q)
        );
      }
      return true;
    });
  }, [parsedLines, previewFilter, searchTerm]);

  // Final confirmation
  const handleConfirmImport = () => {
    onImportComplete({
      lines: parsedLines,
      statementBalance: detectedClosingBalance,
      statementDate: detectedStatementDate,
      matchedCount: metrics.matchedCount,
      unmatchedCount: metrics.unmatchedCount,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Bank Statement Data Import</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                  CSV / MT940 / CAMT.053
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Target Bank: <span className="font-semibold text-slate-800">{bankAccount.name}</span> ({bankAccount.accountNumber}) · Ledger GL {bankAccount.glAccountCode}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Stepper Navigation */}
        <div className="flex items-center border-b border-slate-200 bg-white px-6 shrink-0">
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'upload'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] flex items-center justify-center font-bold">
              1
            </span>
            <span>Source File & Parsing Settings</span>
          </button>

          <button
            onClick={() => {
              if (parsedLines.length > 0) setActiveTab('preview');
            }}
            disabled={parsedLines.length === 0}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              activeTab === 'preview'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] flex items-center justify-center font-bold">
              2
            </span>
            <span>Ledger Match Analysis & Review Queue ({parsedLines.length})</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {parseError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">File Parsing Notice:</span> {parseError}
              </div>
            </div>
          )}

          {activeTab === 'upload' ? (
            <div className="space-y-5">
              {/* Format Switcher */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Select Bank Feed Specification
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'CSV',
                      title: 'CSV Spreadsheet (.csv)',
                      desc: 'Universal bank statement with date, narration, debit, credit & balance',
                      icon: FileSpreadsheet,
                    },
                    {
                      id: 'MT940',
                      title: 'MT940 SWIFT (.sta)',
                      desc: 'Standard SWIFT electronic customer bank statement format',
                      icon: FileCode,
                    },
                    {
                      id: 'CAMT',
                      title: 'CAMT.053 XML',
                      desc: 'ISO 20022 electronic XML statement standard',
                      icon: Layers,
                    },
                  ].map((fmt) => {
                    const Icon = fmt.icon;
                    return (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => {
                          setFileFormat(fmt.id as any);
                          setParseError(null);
                        }}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          fileFormat === fmt.id
                            ? 'border-indigo-600 bg-indigo-50/50 shadow-2xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={`w-4 h-4 ${fileFormat === fmt.id ? 'text-indigo-600' : 'text-slate-500'}`} />
                          <span className="text-xs font-bold text-slate-900">{fmt.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">{fmt.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sample Feeds Bar */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <div>
                      <span className="text-xs font-bold text-slate-800">Quick Test Datasets</span>
                      <span className="text-[11px] text-slate-500 ml-1.5">(Pre-loaded live samples for immediate testing)</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleLoadSample('CSV')}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 shadow-2xs cursor-pointer"
                    >
                      Load Bank CSV Sample
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadSample('MT940')}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 shadow-2xs cursor-pointer"
                    >
                      Load SWIFT MT940 (.sta) Sample
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadSample('CAMT')}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 shadow-2xs cursor-pointer"
                    >
                      Load CAMT.053 XML Sample
                    </button>
                  </div>
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                  isDragging
                    ? 'border-indigo-600 bg-indigo-50/70'
                    : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <div className="w-12 h-12 mx-auto rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  Drag and drop bank statement file here
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-3">
                  Upload downloaded statement files from your corporate internet banking portal (.csv, .sta, .txt, .xml)
                </p>
                <label className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs cursor-pointer transition-colors">
                  <span>Browse Local File</span>
                  <input
                    type="file"
                    accept=".csv,.txt,.sta,.xml"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        processSelectedFile(e.target.files[0]);
                      }
                    }}
                  />
                </label>
                {fileName && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-mono">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>{fileName}</span>
                    <button
                      onClick={() => {
                        setFileName('');
                        setFileContent('');
                      }}
                      className="hover:text-rose-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Direct Paste or Edit Text Area */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Raw File Contents / Text Preview
                  </label>
                  {fileFormat === 'CSV' && (
                    <button
                      type="button"
                      onClick={() => setShowMapping(!showMapping)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>{showMapping ? 'Hide Column Mapping' : 'Custom Column Mapping'}</span>
                    </button>
                  )}
                </div>
                <textarea
                  rows={6}
                  value={fileContent}
                  onChange={(e) => {
                    setFileContent(e.target.value);
                    setParseError(null);
                  }}
                  placeholder="Paste CSV rows, MT940 text, or CAMT.053 XML here..."
                  className="w-full px-3.5 py-2.5 text-xs font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white text-slate-800 shadow-2xs leading-relaxed"
                />
              </div>

              {/* Column Mapping if requested for CSV */}
              {showMapping && fileFormat === 'CSV' && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Custom CSV Column Index Mapping</span>
                    </div>
                    <span className="text-[11px] text-slate-500">0-indexed column position</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Date Column</label>
                      <input
                        type="number"
                        value={columnMap.dateCol}
                        onChange={(e) => setColumnMap({ ...columnMap, dateCol: parseInt(e.target.value) || 0 })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Description / Narration</label>
                      <input
                        type="number"
                        value={columnMap.descCol}
                        onChange={(e) => setColumnMap({ ...columnMap, descCol: parseInt(e.target.value) || 0 })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Reference / Cheque #</label>
                      <input
                        type="number"
                        value={columnMap.refCol}
                        onChange={(e) => setColumnMap({ ...columnMap, refCol: parseInt(e.target.value) || 0 })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Withdrawal (Debit)</label>
                      <input
                        type="number"
                        value={columnMap.drCol}
                        onChange={(e) => setColumnMap({ ...columnMap, drCol: parseInt(e.target.value) || 0 })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Deposit (Credit)</label>
                      <input
                        type="number"
                        value={columnMap.crCol}
                        onChange={(e) => setColumnMap({ ...columnMap, crCol: parseInt(e.target.value) || 0 })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Closing Balance</label>
                      <input
                        type="number"
                        value={columnMap.balCol}
                        onChange={(e) => setColumnMap({ ...columnMap, balCol: parseInt(e.target.value) || 0 })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Import Execution Options */}
              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3">
                <span className="text-xs font-bold text-indigo-950 block">Reconciliation Matching Options</span>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableSmartMatching}
                      onChange={(e) => setEnableSmartMatching(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 w-4 h-4"
                    />
                    <span>Run Smart Ledger Auto-Matcher against ERP Bank transactions</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoFlagUnmatched}
                      onChange={(e) => setAutoFlagUnmatched(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 w-4 h-4"
                    />
                    <span>Flag all unmatched entries for Manual Review Queue</span>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            /* Step 2: Match Analysis & Review Queue */
            <div className="space-y-5">
              {/* Analysis Header Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[11px] font-semibold text-slate-500">Total Statement Lines</div>
                  <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">{metrics.totalLines}</div>
                  <div className="text-[10px] text-slate-400">Successfully parsed</div>
                </div>

                <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200">
                  <div className="text-[11px] font-semibold text-emerald-800 flex items-center justify-between">
                    <span>Matched to Ledger</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="text-lg font-bold font-mono text-emerald-700 mt-0.5">{metrics.matchedCount}</div>
                  <div className="text-[10px] text-emerald-600">Exact amount & reference</div>
                </div>

                <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200">
                  <div className="text-[11px] font-semibold text-amber-800 flex items-center justify-between">
                    <span>Flagged for Review</span>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <div className="text-lg font-bold font-mono text-amber-700 mt-0.5">{metrics.flaggedCount}</div>
                  <div className="text-[10px] text-amber-600">Unmatched / bank charges</div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[11px] font-semibold text-slate-500">Detected Balance</div>
                  <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                    {detectedClosingBalance ? formatINR(detectedClosingBalance) : '—'}
                  </div>
                  <div className="text-[10px] text-slate-400">Statement closing feed</div>
                </div>
              </div>

              {/* Review Guidance Banner */}
              {metrics.flaggedCount > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">{metrics.flaggedCount} entries flagged for manual review:</span> These
                    include bank charges, timing differences, or unbooked collections. Once imported, they are highlighted
                    in your reconciliation workbench with recommended resolutions.
                  </div>
                </div>
              )}

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 ml-1" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search narration, ref, amount..."
                    className="w-full text-xs bg-transparent focus:outline-none placeholder:text-slate-400"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPreviewFilter('all')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      previewFilter === 'all'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    All ({parsedLines.length})
                  </button>
                  <button
                    onClick={() => setPreviewFilter('matched')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      previewFilter === 'matched'
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Matched ({metrics.matchedCount})
                  </button>
                  <button
                    onClick={() => setPreviewFilter('unmatched')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      previewFilter === 'unmatched'
                        ? 'bg-amber-700 text-white border-amber-700'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Flagged for Review ({metrics.flaggedCount})
                  </button>
                </div>
              </div>

              {/* Transactions Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs z-10">
                      <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Narration / Description</th>
                        <th className="py-2.5 px-3">Reference #</th>
                        <th className="py-2.5 px-3 text-right">Debit (Withdrawal)</th>
                        <th className="py-2.5 px-3 text-right">Credit (Deposit)</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3">Ledger Match / Review Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPreview.map((line) => {
                        const isMatched = line.matchStatus === 'Matched';
                        return (
                          <tr
                            key={line.id}
                            className={`transition-colors ${
                              isMatched ? 'bg-emerald-50/20 hover:bg-emerald-50/40' : 'bg-amber-50/20 hover:bg-amber-50/40'
                            }`}
                          >
                            <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">{line.date}</td>
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-slate-900 max-w-xs truncate">{line.description}</div>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                              {line.reference ? (
                                <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[11px] text-slate-700">
                                  {line.reference}
                                </span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-medium text-rose-600 whitespace-nowrap">
                              {line.withdrawal > 0 ? formatINR(line.withdrawal) : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">
                              {line.deposit > 0 ? formatINR(line.deposit) : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {isMatched ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Matched</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                  <span>Review Flag</span>
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              {isMatched ? (
                                <div className="text-xs text-emerald-800 font-medium flex items-center gap-1">
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Paired with GL Ref: {line.matchedTransactionRef}</span>
                                </div>
                              ) : (
                                <div className="text-[11px] text-amber-800">
                                  <div className="font-bold text-amber-900 flex items-center gap-1">
                                    <span>{line.reviewCategory || 'Discrepancy'}:</span>
                                  </div>
                                  <div className="text-slate-600 truncate max-w-xs">{line.reviewReason}</div>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            {activeTab === 'upload' ? (
              <span>Ready to parse statement and analyze against system ledger</span>
            ) : (
              <span>
                {metrics.matchedCount} matched automatically · {metrics.flaggedCount} flagged for review
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {activeTab === 'upload' ? (
              <button
                type="button"
                onClick={handleParseAndSimulate}
                disabled={!fileContent.trim()}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Parse & Match Against Ledger</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Back to File
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Import & Populate Reconciliation Feed</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
