import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  CheckCircle2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Lead } from '../../types';
import { StaffMember, DailyAttendanceRecord, LeaveRequest } from '../../types/hr';
import { ExpiryDocument } from '../../types/documentExpiry';
import { printHtmlDocument } from '../../utils/documentExpiryPrint';

interface QuickReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
  staff: StaffMember[];
  attendance: DailyAttendanceRecord[];
  leaveRequests: LeaveRequest[];
  documents: ExpiryDocument[];
}

export const QuickReportModal: React.FC<QuickReportModalProps> = ({
  isOpen,
  onClose,
  leads,
  staff,
  attendance,
  leaveRequests,
  documents,
}) => {
  const [reportType, setReportType] = useState<'combined' | 'leads' | 'hr' | 'documents'>('combined');
  const [reportPeriod, setReportPeriod] = useState<string>('Current Month');

  if (!isOpen) return null;

  const handleExportCsv = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (reportType === 'leads') {
      csvContent += 'Lead ID,Institute/Client,Contact Person,Phone,Status,Owner,Pipeline Value\n';
      leads.forEach((l) => {
        csvContent += `"${l.id}","${l.instituteName || ''}","${l.contactName || ''}","${l.contactPhone || ''}","${l.status}","${l.assignedTo || ''}","${l.expectedRevenue || 0}"\n`;
      });
    } else if (reportType === 'hr') {
      csvContent += 'Staff ID,Full Name,Department,Role,Status,Joining Date\n';
      staff.forEach((s) => {
        csvContent += `"${s.id}","${s.fullName}","${s.department}","${s.position}","${s.status}","${s.joiningDate || ''}"\n`;
      });
    } else if (reportType === 'documents') {
      csvContent += 'Doc ID,Document Name,Entity,Department,Expiry Date,Status,Days Remaining\n';
      documents.forEach((d) => {
        csvContent += `"${d.id}","${d.documentName}","${d.relatedParty}","${d.department}","${d.expiryDate}","${d.status}","${d.daysRemaining}"\n`;
      });
    } else {
      csvContent += 'Module,Key Metric,Value,Target/Status\n';
      csvContent += `"Lead Management","Total Leads","${leads.length}","Active"\n`;
      csvContent += `"Lead Management","Won Deals","${leads.filter((l) => l.status === 'Won').length}","Converted"\n`;
      csvContent += `"HR Management","Total Headcount","${staff.length}","Active Employees"\n`;
      csvContent += `"HR Management","Pending Leave Requests","${leaveRequests.filter((l) => l.status === 'Pending').length}","Action Required"\n`;
      csvContent += `"Document Expiry","Total Tracked Documents","${documents.length}","Registry"\n`;
      csvContent += `"Document Expiry","Expired Documents","${documents.filter((d) => d.daysRemaining < 0).length}","Critical Risk"\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Casbiro_ERP_${reportType.toUpperCase()}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const printDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const wonLeads = leads.filter((l) => l.status === 'Won').length;
    const expiredDocs = documents.filter((d) => d.daysRemaining < 0).length;
    const exp7dDocs = documents.filter((d) => d.daysRemaining >= 0 && d.daysRemaining <= 7).length;
    const pendingLeaves = leaveRequests.filter((l) => l.status === 'Pending').length;

    const html = `
      <div class="print-container" style="font-family: Arial, sans-serif; padding: 24px;">
        <div style="border-bottom: 2px solid #168A45; padding-bottom: 16px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h1 style="font-size: 20pt; font-weight: bold; color: #0F172A; margin: 0;">Casbiro Solutions Enterprise</h1>
              <h2 style="font-size: 14pt; color: #168A45; margin: 4px 0 0 0;">Executive Management Briefing & Operational Audit</h2>
            </div>
            <div style="text-align: right; font-size: 9pt; color: #64748B;">
              <div>Generated: ${printDate}</div>
              <div>Reporting Period: <strong>${reportPeriod}</strong></div>
              <div>Scope: <strong>${reportType.toUpperCase()}</strong></div>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 12pt; border-bottom: 1px solid #CBD5E1; padding-bottom: 4px; color: #1E293B;">1. Executive Summary & KPIs</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10pt;">
            <thead>
              <tr style="background-color: #F8FAFC; text-align: left;">
                <th style="padding: 8px; border: 1px solid #E2E8F0;">Operational Domain</th>
                <th style="padding: 8px; border: 1px solid #E2E8F0;">Primary Metric</th>
                <th style="padding: 8px; border: 1px solid #E2E8F0;">Current Value</th>
                <th style="padding: 8px; border: 1px solid #E2E8F0;">Compliance / Target Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 8px; border: 1px solid #E2E8F0; font-weight: bold;">Lead Management</td>
                <td style="padding: 8px; border: 1px solid #E2E8F0;">Total Active Pipeline</td>
                <td style="padding: 8px; border: 1px solid #E2E8F0;">${leads.length} Leads</td>
                <td style="padding: 8px; border: 1px solid #E2E8F0; color: #168A45;">${wonLeads} Converted Deals</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #E2E8F0; font-weight: bold;">HR & Workforce</td>
                <td style="padding: 8px; border: 1px solid #E2E8F0;">Total Staff Headcount</td>
                <td style="padding: 8px; border: 1px solid #E2E8F0;">${staff.length} Employees</td>
                <td style="padding: 8px; border: 1px solid #E2E8F0; color: ${pendingLeaves > 0 ? '#D97706' : '#168A45'};">
                  ${pendingLeaves} Leaves Awaiting Sign-off
                </td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #E2E8F0; font-weight: bold;">Document Compliance</td>
                <td style="padding: 8px; border: 1px solid #E2E8F0;">Tracked Legal Registry</td>
                <td style="padding: 8px; border: 1px solid #E2E8F0;">${documents.length} Documents</td>
                <td style="padding: 8px; border: 1px solid #E2E8F0; color: ${expiredDocs > 0 ? '#DC2626' : '#168A45'}; font-weight: bold;">
                  ${expiredDocs} Expired | ${exp7dDocs} ≤7 Days
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #E2E8F0; font-size: 8pt; color: #64748B; text-align: center;">
          Confidential Executive Report • Authorized for Board & Senior Management Use Only • Casbiro ERP System
        </div>
      </div>
    `;

    printHtmlDocument(html, 'Casbiro ERP Executive Report');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-slate-800 text-white">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Executive Reports & Analytics Generator
              </h3>
              <p className="text-xs text-slate-500">
                Produce executive briefings, compliance audits, or export data sets.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="py-4 space-y-4">
          {/* Select Report Scope */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Report Scope
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => setReportType('combined')}
                className={`p-2.5 rounded-xl border text-xs font-bold text-center cursor-pointer transition-all ${
                  reportType === 'combined'
                    ? 'border-[#168A45] bg-[#EAF7EF] text-[#0B5D2A]'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Combined Executive
              </button>
              <button
                onClick={() => setReportType('leads')}
                className={`p-2.5 rounded-xl border text-xs font-bold text-center cursor-pointer transition-all ${
                  reportType === 'leads'
                    ? 'border-blue-600 bg-blue-50 text-blue-800'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Lead Analytics
              </button>
              <button
                onClick={() => setReportType('hr')}
                className={`p-2.5 rounded-xl border text-xs font-bold text-center cursor-pointer transition-all ${
                  reportType === 'hr'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                HR Roster & Leaves
              </button>
              <button
                onClick={() => setReportType('documents')}
                className={`p-2.5 rounded-xl border text-xs font-bold text-center cursor-pointer transition-all ${
                  reportType === 'documents'
                    ? 'border-amber-600 bg-amber-50 text-amber-900'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Document Expiry
              </button>
            </div>
          </div>

          {/* Reporting Period */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Reporting Period
            </label>
            <select
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none"
            >
              <option value="Current Month">Current Month (September 2026)</option>
              <option value="Current Quarter">Current Financial Quarter (Q3)</option>
              <option value="Financial Year 2026-27">Financial Year 2026-27</option>
              <option value="All Time Complete Record">All Time Complete Record</option>
            </select>
          </div>

          {/* Summary Preview Box */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
            <div className="font-bold text-slate-900">Included in this export:</div>
            <div className="flex items-center space-x-2 text-slate-600">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {leads.length} Leads • {staff.length} Staff • {documents.length} Documents
              </span>
            </div>
            <div className="flex items-center space-x-2 text-slate-600">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Full compliance audit breakdown & risk exposures</span>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-end space-x-2.5 pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-[#168A45] hover:bg-[#0B5D2A] text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-2xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report (PDF)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
