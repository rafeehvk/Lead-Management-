import React, { useState } from 'react';
import {
  CreditCard,
  DollarSign,
  Search,
  Filter,
  CheckCircle,
  Eye,
  Printer,
  Download,
  Building,
  TrendingUp,
  AlertCircle,
  Calendar,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { MonthlyPayrollRecord, PayrollStatus, StaffMember } from '../../types/hr';

interface PayrollManagementViewProps {
  payrollRecords: MonthlyPayrollRecord[];
  staff: StaffMember[];
  onGeneratePayroll: (month: string, year: number) => void;
  onUpdatePayrollStatus: (id: string, status: PayrollStatus) => void;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const PayrollManagementView: React.FC<PayrollManagementViewProps> = ({
  payrollRecords = [],
  staff = [],
  onGeneratePayroll,
  onUpdatePayrollStatus,
}) => {
  const [selectedMonth, setSelectedMonth] = useState('August');
  const [selectedYear, setSelectedYear] = useState(2026);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [selectedPayslip, setSelectedPayslip] = useState<MonthlyPayrollRecord | null>(null);

  // Filter records for selected month & year
  const recordsForMonth = payrollRecords.filter(
    (p) => p.month === selectedMonth && p.year === selectedYear
  );

  const filteredPayroll = recordsForMonth.filter((p) => {
    const matchSearch =
      p.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.staffId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.payslipNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDept = deptFilter === 'All' || p.department === deptFilter;
    return matchSearch && matchDept;
  });

  // Aggregates
  const totalGross = recordsForMonth.reduce((acc, p) => acc + p.grossSalary, 0);
  const totalDeductions = recordsForMonth.reduce((acc, p) => acc + p.totalDeductions, 0);
  const totalNet = recordsForMonth.reduce((acc, p) => acc + p.netSalary, 0);
  const totalEmployees = recordsForMonth.length;
  const paidCount = recordsForMonth.filter((p) => p.status === 'Paid').length;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Banner & Processing Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-[#168A45]" />
            <span>Monthly Payroll & Payslip Processing</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Compliant statutory deductions (Provident Fund & TDS), allowances, and digital disbursement logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Month Selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 text-slate-900 bg-white font-semibold"
          >
            {MONTHS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* Year Selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 text-slate-900 bg-white font-semibold"
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>

          {/* Run Payroll Button */}
          <button
            onClick={() => onGeneratePayroll(selectedMonth, selectedYear)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Calculate & Run {selectedMonth} Payroll</span>
          </button>
        </div>
      </div>

      {/* Aggregate Financial Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">Processed Staff</span>
          <div className="text-2xl font-bold text-slate-900 mt-0.5">{totalEmployees}</div>
          <span className="text-[10px] text-slate-400">Total faculty & admin</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">Total Gross Compensation</span>
          <div className="text-2xl font-bold text-slate-900 mt-0.5">₹{totalGross.toLocaleString('en-IN')}</div>
          <span className="text-[10px] text-emerald-600 font-medium">Base + HRA + Special</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] text-rose-600 font-medium">Statutory Deductions (PF/Tax)</span>
          <div className="text-2xl font-bold text-rose-700 mt-0.5">
            ₹{totalDeductions.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-slate-400">EPF, Professional Tax, TDS</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] text-emerald-700 font-medium">Net Disbursed Amount</span>
          <div className="text-2xl font-bold text-emerald-800 mt-0.5">₹{totalNet.toLocaleString('en-IN')}</div>
          <span className="text-[10px] text-emerald-600 font-semibold">
            {paidCount} of {totalEmployees} Paid
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80">
        <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by staff name, ID, or payslip number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs text-slate-800 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 font-medium">Department:</span>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 bg-white"
          >
            <option value="All">All Departments</option>
            <option value="Academic">Academic</option>
            <option value="Administration">Administration</option>
            <option value="Finance">Finance</option>
            <option value="HR">HR</option>
            <option value="IT">IT</option>
          </select>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Payslip No. & Staff</th>
                <th className="px-4 py-3">Department & Position</th>
                <th className="px-4 py-3 text-right">Basic (₹)</th>
                <th className="px-4 py-3 text-right">HRA & Allowances (₹)</th>
                <th className="px-4 py-3 text-right">Gross (₹)</th>
                <th className="px-4 py-3 text-right">Deductions (₹)</th>
                <th className="px-4 py-3 text-right font-bold text-slate-900">Net Salary (₹)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayroll.map((pay) => (
                <tr key={pay.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{pay.staffName}</div>
                    <div className="text-[10px] text-slate-400">
                      {pay.payslipNumber} • {pay.staffId}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800">{pay.position}</div>
                    <div className="text-[10px] text-slate-400">{pay.department}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-700">
                    {pay.basicSalary.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">
                    {(pay.hra + pay.allowances).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                    {pay.grossSalary.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-rose-600 font-medium">
                    {pay.totalDeductions.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-700 text-sm">
                    ₹{pay.netSalary.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        pay.status === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : pay.status === 'Approved'
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {pay.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => setSelectedPayslip(pay)}
                        title="View & Print Payslip"
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {pay.status !== 'Paid' && (
                        <button
                          onClick={() => onUpdatePayrollStatus(pay.id, 'Paid')}
                          className="px-2.5 py-1 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-lg text-[10px] font-bold transition-all shadow-xs cursor-pointer"
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: OFFICIAL PAYSLIP VIEW (PRINT READY) */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto text-xs">
            {/* Header */}
            <div className="border-b-2 border-[#168A45] pb-4 mb-6 flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold text-[#0B5D2A]">MYSAR – My Student Analysis Record</h1>
                <p className="text-xs font-semibold text-slate-700">Casbiro Solutions Private Limited</p>
                <p className="text-[10px] text-slate-400">Valamkattil Tower, Judgemukku, Kakkanad, Kochi – 682021</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold bg-emerald-50 text-[#0B5D2A] px-2.5 py-1 rounded-full border border-emerald-200">
                  SALARY PAYSLIP
                </span>
                <p className="text-[10px] text-slate-500 mt-1 font-bold">
                  {selectedPayslip.month} {selectedPayslip.year}
                </p>
                <p className="text-[10px] text-slate-400">Ref: {selectedPayslip.payslipNumber}</p>
              </div>
            </div>

            {/* Employee Metadata */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 mb-6 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400">Employee Name: </span>
                <strong className="text-slate-900">{selectedPayslip.staffName}</strong>
              </div>
              <div>
                <span className="text-slate-400">Employee ID: </span>
                <strong className="text-slate-900">{selectedPayslip.staffId}</strong>
              </div>
              <div>
                <span className="text-slate-400">Designation: </span>
                <span className="text-slate-800 font-medium">{selectedPayslip.position}</span>
              </div>
              <div>
                <span className="text-slate-400">Department: </span>
                <span className="text-slate-800 font-medium">{selectedPayslip.department}</span>
              </div>
              <div>
                <span className="text-slate-400">Bank Account: </span>
                <span className="text-slate-800 font-mono">{selectedPayslip.bankAccountMasked}</span>
              </div>
              <div>
                <span className="text-slate-400">Disbursement Status: </span>
                <strong className="text-emerald-700">{selectedPayslip.status}</strong>
              </div>
            </div>

            {/* Earnings & Deductions Tables */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Earnings */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-emerald-50/60 font-bold px-3 py-2 text-emerald-900 border-b border-slate-200">
                  Earnings (₹)
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Basic Pay:</span>
                    <span className="font-semibold">{selectedPayslip.basicSalary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">House Rent Allowance (HRA):</span>
                    <span className="font-semibold">{selectedPayslip.hra.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Special & Other Allowances:</span>
                    <span className="font-semibold">{selectedPayslip.allowances.toLocaleString()}</span>
                  </div>
                  {selectedPayslip.overtime > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Overtime / Academic Honorarium:</span>
                      <span className="font-semibold">{selectedPayslip.overtime.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
                    <span>Total Gross Earnings:</span>
                    <span>₹{selectedPayslip.grossSalary.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-rose-50/60 font-bold px-3 py-2 text-rose-900 border-b border-slate-200">
                  Deductions (₹)
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Provident Fund (EPF):</span>
                    <span className="font-semibold">{selectedPayslip.pfDeduction.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Income Tax (TDS):</span>
                    <span className="font-semibold">{selectedPayslip.taxDeduction.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Unpaid Leaves:</span>
                    <span className="font-semibold">{selectedPayslip.leaveDeductions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-rose-700">
                    <span>Total Deductions:</span>
                    <span>₹{selectedPayslip.totalDeductions.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Salary Box */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between mb-6">
              <div>
                <span className="text-slate-500 text-[11px] font-semibold">NET SALARY PAYABLE:</span>
                <div className="text-2xl font-extrabold text-[#0B5D2A] mt-0.5">
                  ₹{selectedPayslip.netSalary.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="text-right text-[11px] text-slate-500">
                Processed via {selectedPayslip.paymentMethod}
              </div>
            </div>

            {/* Signatures */}
            <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-800">Finance & Accounts Officer</div>
                <div className="text-[10px] text-slate-400">Casbiro Solutions Private Limited</div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Payslip</span>
                </button>
                <button
                  onClick={() => setSelectedPayslip(null)}
                  className="px-4 py-1.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl font-bold cursor-pointer"
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
