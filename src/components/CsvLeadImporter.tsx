import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Users,
  Building2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Eye,
  Settings2,
  FileText,
  Check,
  ChevronDown,
  Info,
} from 'lucide-react';
import { Lead, LeadPriority, LeadStatus, User } from '../types';

interface CsvLeadImporterProps {
  users: User[];
  currentUser: User;
  existingLeads?: Lead[];
  onBulkImport: (leadsData: Array<Partial<Lead>>) => { successCount: number; createdLeads: Lead[]; errors: string[] };
  onNavigateToLeads?: () => void;
}

interface ParsedRow {
  raw: Record<string, string>;
  mapped: Partial<Lead>;
  isValid: boolean;
  isDuplicate: boolean;
  validationError?: string;
}

// Standard expected CRM fields
const CRM_FIELDS: { key: keyof Lead; label: string; required: boolean; defaultVal?: string }[] = [
  { key: 'instituteName', label: 'Institute Name', required: true },
  { key: 'contactPerson', label: 'Contact Person', required: false },
  { key: 'mobile', label: 'Mobile / Phone', required: false },
  { key: 'email', label: 'Email', required: false },
  { key: 'address', label: 'Address / Location', required: false },
  { key: 'studentCount', label: 'Student Count', required: false },
  { key: 'leadSource', label: 'Lead Source', required: false },
  { key: 'assignedTo', label: 'Assigned To (Sales Rep)', required: false },
  { key: 'priority', label: 'Priority', required: false },
  { key: 'status', label: 'Status', required: false },
  { key: 'followUpDate', label: 'Follow-up Date', required: false },
  { key: 'remarks', label: 'Remarks / Notes', required: false },
];

export const CsvLeadImporter: React.FC<CsvLeadImporterProps> = ({
  users,
  currentUser,
  existingLeads = [],
  onBulkImport,
  onNavigateToLeads,
}) => {
  const [csvText, setCsvText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<{
    successCount: number;
    createdLeads: Lead[];
    errors: string[];
  } | null>(null);

  // Defaults for unmapped fields
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const [defaultAssignedTo, setDefaultAssignedTo] = useState<string>(
    currentUser.name || 'Anand Kumar'
  );
  const [defaultStatus, setDefaultStatus] = useState<LeadStatus>('New');
  const [defaultPriority, setDefaultPriority] = useState<LeadPriority>('Medium');
  const [defaultSource, setDefaultSource] = useState<string>('CSV Bulk Import');
  const [defaultFollowUpDate, setDefaultFollowUpDate] = useState<string>(nextWeek);
  const [skipDuplicates, setSkipDuplicates] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Standard CSV Parser supporting quotes, commas in quotes, escaped quotes
  const parseCsvString = (text: string): { headers: string[]; rows: Record<string, string>[] } => {
    const lines = text.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let insideQuote = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
          if (insideQuote && nextChar === '"') {
            current += '"';
            i++; // skip escaped quote
          } else {
            insideQuote = !insideQuote;
          }
        } else if (char === ',' && !insideQuote) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headerCols = parseLine(lines[0]);
    const cleanHeaders = headerCols.map((h) => h.replace(/^["']|["']$/g, '').trim());

    const rows: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const lineVals = parseLine(lines[i]);
      if (lineVals.length === 0 || (lineVals.length === 1 && lineVals[0] === '')) continue;

      const rowObj: Record<string, string> = {};
      cleanHeaders.forEach((h, idx) => {
        rowObj[h] = lineVals[idx] !== undefined ? lineVals[idx].replace(/^["']|["']$/g, '').trim() : '';
      });
      rows.push(rowObj);
    }

    return { headers: cleanHeaders, rows };
  };

  // Smart Auto-Mapper for common column naming conventions
  const autoDetectMapping = (csvHeaders: string[]): Record<string, string> => {
    const mapping: Record<string, string> = {};

    const findMatch = (fieldKey: string, patterns: string[]): string | undefined => {
      return csvHeaders.find((h) => {
        const clean = h.toLowerCase().replace(/[^a-z0-9]/g, '');
        return patterns.some((p) => clean.includes(p) || p.includes(clean));
      });
    };

    const patternsMap: Record<string, string[]> = {
      instituteName: ['institute', 'school', 'collegename', 'organization', 'institution', 'clientname', 'account'],
      contactPerson: ['contactperson', 'contactname', 'principal', 'headmaster', 'person', 'contact', 'name'],
      mobile: ['mobile', 'phone', 'contactnumber', 'cell', 'tel', 'whatsapp'],
      email: ['email', 'mail', 'emailaddress'],
      address: ['address', 'city', 'location', 'place', 'state', 'district'],
      studentCount: ['studentcount', 'students', 'strength', 'enrolled', 'batchsize', 'count'],
      leadSource: ['source', 'leadsource', 'origin', 'channel', 'campaign'],
      assignedTo: ['assignedto', 'assigned', 'salesrep', 'owner', 'representative', 'agent'],
      priority: ['priority', 'urgency', 'level'],
      status: ['status', 'stage', 'leadstatus', 'pipeline'],
      followUpDate: ['followupdate', 'nextfollowup', 'followup', 'targetdate', 'nextdate'],
      remarks: ['remarks', 'notes', 'comment', 'description', 'detail'],
    };

    CRM_FIELDS.forEach((f) => {
      const matchedHeader = findMatch(f.key, patternsMap[f.key] || [f.key.toLowerCase()]);
      if (matchedHeader) {
        mapping[f.key] = matchedHeader;
      }
    });

    return mapping;
  };

  // Process and re-map CSV data
  const processData = (
    csvContent: string,
    customMapping?: Record<string, string>
  ) => {
    const { headers: parsedHeaders, rows: parsedRawRows } = parseCsvString(csvContent);
    setHeaders(parsedHeaders);

    const mapping = customMapping || autoDetectMapping(parsedHeaders);
    setColumnMapping(mapping);

    const existingNamesSet = new Set(
      existingLeads.map((l) => l.instituteName.trim().toLowerCase())
    );

    const rows: ParsedRow[] = parsedRawRows.map((raw) => {
      const getVal = (fieldKey: string): string => {
        const colName = mapping[fieldKey];
        if (colName && raw[colName] !== undefined) {
          return raw[colName];
        }
        return '';
      };

      const rawInstName = getVal('instituteName');
      const isValid = Boolean(rawInstName && rawInstName.trim().length > 0);
      const isDuplicate = Boolean(
        rawInstName && existingNamesSet.has(rawInstName.trim().toLowerCase())
      );

      let validationError: string | undefined;
      if (!isValid) {
        validationError = 'Missing Institute Name (Required)';
      }

      // Parse student count
      const rawCount = getVal('studentCount');
      const studentCount = parseInt(rawCount.replace(/[^0-9]/g, ''), 10) || 0;

      // Parse Priority
      const rawPriority = getVal('priority');
      let priority: LeadPriority = defaultPriority;
      if (/high/i.test(rawPriority)) priority = 'High';
      else if (/low/i.test(rawPriority)) priority = 'Low';
      else if (/medium/i.test(rawPriority)) priority = 'Medium';

      // Parse Status
      const rawStatus = getVal('status');
      let status: LeadStatus = defaultStatus;
      const validStatuses: LeadStatus[] = [
        'New',
        'Contacted',
        'Follow-up',
        'Qualified',
        'Demo Scheduled',
        'Demo Completed',
        'Send Proposal',
        'Proposal Sent',
        'Negotiation',
        'Won',
        'Lost',
        'On Hold',
      ];
      const matchedStatus = validStatuses.find(
        (s) => s.toLowerCase() === rawStatus.trim().toLowerCase()
      );
      if (matchedStatus) status = matchedStatus;

      // Follow-up Date parsing or fallback
      let fupDate = getVal('followUpDate').trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fupDate)) {
        fupDate = defaultFollowUpDate;
      }

      const mapped: Partial<Lead> = {
        instituteName: rawInstName.trim(),
        contactPerson: getVal('contactPerson').trim() || 'Principal / Administrator',
        mobile: getVal('mobile').trim(),
        email: getVal('email').trim(),
        address: getVal('address').trim(),
        studentCount,
        leadSource: getVal('leadSource').trim() || defaultSource,
        assignedTo: getVal('assignedTo').trim() || defaultAssignedTo,
        priority,
        status,
        followUpDate: fupDate,
        remarks: getVal('remarks').trim() || 'Imported via CSV bulk tool',
      };

      return {
        raw,
        mapped,
        isValid,
        isDuplicate,
        validationError,
      };
    });

    setParsedRows(rows);
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;
    setFileName(file.name);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setCsvText(content);
        processData(content);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleMappingChange = (fieldKey: string, selectedHeader: string) => {
    const updated = { ...columnMapping, [fieldKey]: selectedHeader };
    setColumnMapping(updated);
    if (csvText) {
      processData(csvText, updated);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      'Institute Name',
      'Contact Person',
      'Mobile',
      'Email',
      'Address',
      'Student Count',
      'Lead Source',
      'Assigned To',
      'Priority',
      'Status',
      'Follow-up Date',
      'Remarks',
    ];

    const sampleRows = [
      [
        'St. Xavier Public School',
        'Dr. Rajesh Nair (Principal)',
        '+91 98470 12345',
        'info@stxavierps.edu.in',
        'Kochi, Ernakulam, Kerala',
        '1250',
        'Exhibition',
        currentUser.name || 'Anand Kumar',
        'High',
        'Qualified',
        nextWeek,
        'Expressed keen interest in Smart Attendance and Parent Communication app',
      ],
      [
        'Delhi International Academy',
        'Mrs. Meenakshi Sundaram',
        '+91 94460 54321',
        'admin@delhiacademy.org',
        'Coimbatore, Tamil Nadu',
        '850',
        'Website Inquiry',
        'Fathima Beevi',
        'Medium',
        'New',
        today,
        'Inquired for fee management & report card generator',
      ],
      [
        'Bhavans Vidya Mandir Higher Secondary',
        'Mr. George Kurian',
        '+91 97450 88990',
        'principal@bhavansvm.ac.in',
        'Thrissur, Kerala',
        '2100',
        'Referral',
        'Rahul Menon',
        'High',
        'Send Proposal',
        nextWeek,
        'Ready for School Premium Plan proposal. Decision maker meeting next Monday.',
      ],
    ];

    const csvRows = [headers.join(',')];
    sampleRows.forEach((row) => {
      const quotedRow = row.map((cell) => `"${cell.replace(/"/g, '""')}"`);
      csvRows.push(quotedRow.join(','));
    });

    const csvBlob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(csvBlob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'MYSAR_Leads_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExecuteImport = () => {
    const toImport = parsedRows
      .filter((r) => r.isValid)
      .filter((r) => (skipDuplicates ? !r.isDuplicate : true))
      .map((r) => r.mapped);

    if (toImport.length === 0) {
      alert('No valid lead records found to import. Please check your data file.');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      const result = onBulkImport(toImport);
      setImportResult(result);
      setIsProcessing(false);
    }, 400);
  };

  const handleReset = () => {
    setCsvText('');
    setFileName('');
    setHeaders([]);
    setParsedRows([]);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Metrics
  const validCount = parsedRows.filter((r) => r.isValid).length;
  const duplicateCount = parsedRows.filter((r) => r.isValid && r.isDuplicate).length;
  const errorCount = parsedRows.filter((r) => !r.isValid).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Template Download Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAF7EF] text-[#168A45] flex items-center justify-center shadow-2xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Bulk Lead Import from CSV
              </h2>
              <p className="text-xs text-slate-500">
                Quickly upload lists of schools, colleges, and educational institutes directly into MYSAR CRM
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="bg-[#F7FAF8] hover:bg-[#EAF7EF] text-[#0B5D2A] border border-[#D9E5DD] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shadow-2xs"
            >
              <Download className="w-4 h-4" />
              <span>Download CSV Template</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs text-slate-600">
          <div className="bg-[#F7FAF8] p-3.5 rounded-xl border border-gray-200/80 flex items-start space-x-2.5">
            <span className="w-5 h-5 rounded-full bg-[#168A45] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
              1
            </span>
            <div>
              <strong className="text-slate-800 block mb-0.5">Prepare Spreadsheet</strong>
              <span>Fill school details using our sample template or export from Google Sheets / Excel.</span>
            </div>
          </div>

          <div className="bg-[#F7FAF8] p-3.5 rounded-xl border border-gray-200/80 flex items-start space-x-2.5">
            <span className="w-5 h-5 rounded-full bg-[#168A45] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
              2
            </span>
            <div>
              <strong className="text-slate-800 block mb-0.5">Upload & Map Columns</strong>
              <span>Drag & drop your CSV file. Automatic matching links your headers to CRM fields.</span>
            </div>
          </div>

          <div className="bg-[#F7FAF8] p-3.5 rounded-xl border border-gray-200/80 flex items-start space-x-2.5">
            <span className="w-5 h-5 rounded-full bg-[#168A45] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
              3
            </span>
            <div>
              <strong className="text-slate-800 block mb-0.5">Review & Bulk Create</strong>
              <span>Preview records, verify duplicates, and instantly generate Lead IDs with audit trails.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {importResult && (
        <div className="bg-[#EAF7EF] border-2 border-[#168A45] rounded-2xl p-6 shadow-sm animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-full bg-[#168A45] text-white flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0B5D2A]">
                  Successfully Imported {importResult.successCount} Leads into CRM!
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  All new leads have been assigned sequential Lead IDs (
                  <span className="font-semibold text-slate-800">
                    {importResult.createdLeads[0]?.id} ...{' '}
                    {importResult.createdLeads[importResult.createdLeads.length - 1]?.id}
                  </span>
                  ) and initial activity logs were recorded.
                </p>
                {importResult.errors.length > 0 && (
                  <p className="text-xs text-amber-700 font-semibold mt-2">
                    Note: {importResult.errors.length} rows were skipped due to missing institute names.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              <button
                type="button"
                onClick={handleReset}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-gray-200 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs"
              >
                Import Another File
              </button>
              {onNavigateToLeads && (
                <button
                  type="button"
                  onClick={onNavigateToLeads}
                  className="bg-[#168A45] hover:bg-[#0B5D2A] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs"
                >
                  <span>Go to Leads Pipeline</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Dropzone Section */}
      {!importResult && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-[#168A45] bg-[#EAF7EF]'
                : 'border-gray-300 hover:border-[#168A45] bg-[#F7FAF8] hover:bg-white'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv,application/vnd.ms-excel"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
            <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 text-[#168A45] flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <Upload className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">
              {fileName ? `Selected: ${fileName}` : 'Click to upload or drag & drop CSV file'}
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Supports standard comma-separated (.csv) files exported from Excel, Google Sheets, or any school directory.
            </p>
          </div>

          {/* Or Paste Raw CSV Accordion */}
          <details className="text-xs group">
            <summary className="font-bold text-slate-700 cursor-pointer flex items-center space-x-1.5 hover:text-[#168A45]">
              <FileText className="w-3.5 h-3.5 text-[#168A45]" />
              <span>Or paste raw CSV text directly</span>
              <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="mt-3 space-y-2">
              <textarea
                value={csvText}
                onChange={(e) => {
                  setCsvText(e.target.value);
                  if (e.target.value.trim()) {
                    setFileName('Pasted_Data.csv');
                    processData(e.target.value);
                  } else {
                    setParsedRows([]);
                    setHeaders([]);
                  }
                }}
                rows={4}
                placeholder={`Institute Name,Contact Person,Mobile,Student Count,City\n"St. Joseph School","Fr. Mathew","9876543210","1200","Ernakulam"`}
                className="w-full font-mono text-xs bg-[#F7FAF8] border border-gray-200 rounded-xl p-3 text-slate-800 focus:bg-white focus:outline-none focus:border-[#168A45]"
              />
            </div>
          </details>

          {/* If Data is loaded, Show Configuration & Preview */}
          {parsedRows.length > 0 && (
            <div className="space-y-6 pt-4 border-t border-gray-100">
              {/* Default Fallback Settings Card */}
              <div className="bg-[#F7FAF8] border border-gray-200 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Settings2 className="w-4 h-4 text-[#168A45]" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Default Values for Missing / Unmapped Columns
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Default Assigned Sales Rep
                    </label>
                    <select
                      value={defaultAssignedTo}
                      onChange={(e) => {
                        setDefaultAssignedTo(e.target.value);
                        processData(csvText);
                      }}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-[#168A45]"
                    >
                      {users.map((u) => (
                        <option key={u.id} value={u.name}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Default Initial Status
                    </label>
                    <select
                      value={defaultStatus}
                      onChange={(e) => {
                        setDefaultStatus(e.target.value as LeadStatus);
                        processData(csvText);
                      }}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-[#168A45]"
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Follow-up">Follow-up</option>
                      <option value="Qualified">Qualified</option>
                      <option value="Send Proposal">Send Proposal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Default Priority
                    </label>
                    <select
                      value={defaultPriority}
                      onChange={(e) => {
                        setDefaultPriority(e.target.value as LeadPriority);
                        processData(csvText);
                      }}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-[#168A45]"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Default Lead Source
                    </label>
                    <input
                      type="text"
                      value={defaultSource}
                      onChange={(e) => {
                        setDefaultSource(e.target.value);
                        processData(csvText);
                      }}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-[#168A45]"
                      placeholder="e.g. CSV Bulk Import"
                    />
                  </div>
                </div>
              </div>

              {/* Column Mapping Review */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-[#168A45]" />
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Column Mapping Confirmation
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Auto-detected {Object.keys(columnMapping).length} of {CRM_FIELDS.length} fields
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
                  {CRM_FIELDS.map((field) => (
                    <div key={field.key} className="bg-[#F7FAF8] p-2.5 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-700 truncate">
                          {field.label}
                        </span>
                        {field.required && (
                          <span className="text-[10px] text-rose-600 font-bold">*Req</span>
                        )}
                      </div>
                      <select
                        value={columnMapping[field.key] || ''}
                        onChange={(e) => handleMappingChange(field.key, e.target.value)}
                        className={`w-full text-xs rounded border px-1.5 py-1 focus:outline-none ${
                          columnMapping[field.key]
                            ? 'border-[#168A45] bg-[#EAF7EF] text-[#0B5D2A] font-semibold'
                            : 'border-gray-200 bg-white text-slate-500'
                        }`}
                      >
                        <option value="">-- Not in CSV --</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Validation Summary Strip */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 text-xs">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-slate-700 font-bold">
                      {validCount} Ready to Import
                    </span>
                  </div>

                  {duplicateCount > 0 && (
                    <div className="flex items-center space-x-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-amber-700 font-bold">
                        {duplicateCount} Existing Institute Names
                      </span>
                    </div>
                  )}

                  {errorCount > 0 && (
                    <div className="flex items-center space-x-1.5">
                      <XCircle className="w-3.5 h-3.5 text-rose-500" />
                      <span className="text-rose-700 font-bold">
                        {errorCount} Invalid (Missing Name)
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <label className="flex items-center space-x-2 text-slate-700 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={skipDuplicates}
                      onChange={(e) => setSkipDuplicates(e.target.checked)}
                      className="rounded border-gray-300 text-[#168A45] focus:ring-[#168A45]"
                    />
                    <span>Skip institutes that already exist in CRM</span>
                  </label>
                </div>
              </div>

              {/* Data Preview Table (First 10 rows) */}
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="bg-[#F7FAF8] px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-[#168A45]" />
                    Data Preview ({Math.min(parsedRows.length, 10)} of {parsedRows.length} rows)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Scroll horizontally to inspect mapped fields
                  </span>
                </div>

                <div className="overflow-x-auto max-h-[300px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-gray-200 sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Institute Name</th>
                        <th className="py-2.5 px-3">Contact Person</th>
                        <th className="py-2.5 px-3">Mobile</th>
                        <th className="py-2.5 px-3">Students</th>
                        <th className="py-2.5 px-3">Location</th>
                        <th className="py-2.5 px-3">Assigned To</th>
                        <th className="py-2.5 px-3">Stage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {parsedRows.slice(0, 10).map((row, idx) => (
                        <tr
                          key={idx}
                          className={!row.isValid ? 'bg-rose-50/50' : row.isDuplicate ? 'bg-amber-50/40' : 'hover:bg-slate-50'}
                        >
                          <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3">
                            {!row.isValid ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                                Invalid
                              </span>
                            ) : row.isDuplicate ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                Existing
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Valid
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-800">
                            {row.mapped.instituteName || <span className="text-rose-500 italic">Empty</span>}
                          </td>
                          <td className="py-2 px-3 text-slate-600">
                            {row.mapped.contactPerson}
                          </td>
                          <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">
                            {row.mapped.mobile || '-'}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-700">
                            {row.mapped.studentCount || 0}
                          </td>
                          <td className="py-2 px-3 text-slate-600 truncate max-w-[120px]">
                            {row.mapped.address || '-'}
                          </td>
                          <td className="py-2 px-3 text-slate-700 font-medium">
                            {row.mapped.assignedTo}
                          </td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EAF7EF] text-[#0B5D2A] border border-[#D9E5DD]">
                              {row.mapped.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="bg-white hover:bg-slate-50 text-slate-600 border border-gray-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-2xs"
                >
                  Clear & Re-upload
                </button>

                <button
                  type="button"
                  disabled={validCount === 0 || isProcessing}
                  onClick={handleExecuteImport}
                  className="bg-[#168A45] hover:bg-[#0B5D2A] disabled:bg-gray-300 text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-xs transition-all active:scale-98"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Creating Lead Records...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>
                        Import{' '}
                        {skipDuplicates
                          ? parsedRows.filter((r) => r.isValid && !r.isDuplicate).length
                          : validCount}{' '}
                        Leads into CRM
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
