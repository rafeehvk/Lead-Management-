import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle2,
  FileText,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  Building,
  User,
  ExternalLink,
  ShieldAlert,
  Bell,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import {
  CustomDocumentType,
  ExpiryDashboardMetrics,
  ExpiryDocument,
  calculateDaysRemaining,
  getUrgencyLevel,
  getUrgencyBadge,
  UrgencyLevel,
} from '../../types/documentExpiry';

interface ExpiryDashboardTabProps {
  metrics: ExpiryDashboardMetrics;
  documents: ExpiryDocument[];
  documentTypes: CustomDocumentType[];
  onSelectDocument: (doc: ExpiryDocument) => void;
  onOpenRenew: (doc: ExpiryDocument) => void;
  onNavigateToDocuments: (filterUrgency?: string) => void;
  onOpenNewDocument: () => void;
}

export const ExpiryDashboardTab: React.FC<ExpiryDashboardTabProps> = ({
  metrics,
  documents,
  documentTypes,
  onSelectDocument,
  onOpenRenew,
  onNavigateToDocuments,
  onOpenNewDocument,
}) => {
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // Filter documents by department if selected
  const filteredDocs = departmentFilter === 'all'
    ? documents
    : documents.filter((d) => d.department === departmentFilter);

  // Critical urgent list (Expired, Expiring Today, or within 7 days)
  const urgentDocs = documents
    .filter((d) => {
      const urgency = getUrgencyLevel(d);
      return urgency === 'expired' || urgency === 'expiring_today' || urgency === 'expiring_7d';
    })
    .sort((a, b) => {
      const daysA = calculateDaysRemaining(a.expiryDate);
      const daysB = calculateDaysRemaining(b.expiryDate);
      return daysA - daysB;
    });

  // Urgency distribution data for Pie Chart
  const pieData = [
    { name: 'Expired', value: metrics.expiredCount, color: '#EF4444' },
    { name: 'Expiring Today', value: metrics.expiringTodayCount, color: '#F97316' },
    { name: 'Within 7 Days', value: metrics.expiring7dCount, color: '#F59E0B' },
    { name: 'Within 30 Days', value: metrics.expiring30dCount, color: '#EAB308' },
    { name: 'Within 90 Days', value: metrics.expiring90dCount, color: '#3B82F6' },
    { name: 'Renewed', value: metrics.renewedCount, color: '#10B981' },
    { name: 'Active (>90d)', value: metrics.activeCount, color: '#059669' },
  ].filter((item) => item.value > 0);

  // Department-wise distribution data for Bar Chart
  const departmentStatsMap: Record<string, { count: number; totalCost: number }> = {};
  documents.forEach((doc) => {
    const dept = doc.department || 'Admin';
    if (!departmentStatsMap[dept]) {
      departmentStatsMap[dept] = { count: 0, totalCost: 0 };
    }
    departmentStatsMap[dept].count++;
    departmentStatsMap[dept].totalCost += doc.amount || 0;
  });

  const deptBarData = Object.entries(departmentStatsMap).map(([dept, data]) => ({
    department: dept,
    documents: data.count,
    cost: Math.round(data.totalCost / 1000), // in thousands
  }));

  const departmentsList = Array.from(new Set(documents.map((d) => d.department))).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* 1. Critical Escalation Banner (If expired or expiring today) */}
      {(metrics.expiredCount > 0 || metrics.expiringTodayCount > 0) && (
        <div className="p-4 bg-gradient-to-r from-red-500/10 via-amber-500/10 to-transparent border border-red-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-red-100 text-red-700 rounded-xl shrink-0">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-red-950">
                Action Required: {metrics.expiredCount} Expired & {metrics.expiringTodayCount} Expiring Today
              </h3>
              <p className="text-xs text-red-800/80">
                Statutory clearances, licenses, or warranties require immediate renewal action to avoid penalties or coverage lapses.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => onNavigateToDocuments('expired')}
              className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              Review Expired ({metrics.expiredCount})
            </button>
            <button
              onClick={() => onNavigateToDocuments('expiring_today')}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              Review Today ({metrics.expiringTodayCount})
            </button>
          </div>
        </div>
      )}

      {/* 2. Top Metric Cards (Matches User Specification 1:1) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 🔴 Expired */}
        <button
          type="button"
          onClick={() => onNavigateToDocuments('expired')}
          className="p-3.5 rounded-2xl border bg-white border-red-200/80 hover:border-red-400 hover:shadow-md transition-all text-left group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
            <AlertOctagon className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-red-700 tracking-tight">{metrics.expiredCount}</div>
          <div className="text-xs font-bold text-red-950">🔴 Expired</div>
          <div className="text-[10px] text-red-600/80 mt-0.5">Immediate action</div>
        </button>

        {/* 🟠 Expiring Today */}
        <button
          type="button"
          onClick={() => onNavigateToDocuments('expiring_today')}
          className="p-3.5 rounded-2xl border bg-white border-amber-300 hover:border-amber-500 hover:shadow-md transition-all text-left group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <AlertTriangle className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-amber-700 tracking-tight">{metrics.expiringTodayCount}</div>
          <div className="text-xs font-bold text-amber-950">🟠 Expiring Today</div>
          <div className="text-[10px] text-amber-700/80 mt-0.5">Final reminder day</div>
        </button>

        {/* 🟡 Expiring within 7 Days */}
        <button
          type="button"
          onClick={() => onNavigateToDocuments('expiring_7d')}
          className="p-3.5 rounded-2xl border bg-white border-yellow-200/90 hover:border-yellow-400 hover:shadow-md transition-all text-left group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
            <Clock className="w-4 h-4 text-yellow-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-yellow-700 tracking-tight">{metrics.expiring7dCount}</div>
          <div className="text-xs font-bold text-yellow-950">🟡 Within 7 Days</div>
          <div className="text-[10px] text-yellow-700/80 mt-0.5">Urgent renewal queue</div>
        </button>

        {/* 🟡 Expiring within 30 Days */}
        <button
          type="button"
          onClick={() => onNavigateToDocuments('expiring_30d')}
          className="p-3.5 rounded-2xl border bg-white border-yellow-200/70 hover:border-yellow-400 hover:shadow-md transition-all text-left group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
            <Calendar className="w-4 h-4 text-yellow-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-yellow-800 tracking-tight">{metrics.expiring30dCount}</div>
          <div className="text-xs font-bold text-slate-800">🟡 Within 30 Days</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Renewal quotes ready</div>
        </button>

        {/* 🔵 Expiring within 90 Days */}
        <button
          type="button"
          onClick={() => onNavigateToDocuments('expiring_90d')}
          className="p-3.5 rounded-2xl border bg-white border-blue-200 hover:border-blue-400 hover:shadow-md transition-all text-left group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <Calendar className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-blue-700 tracking-tight">{metrics.expiring90dCount}</div>
          <div className="text-xs font-bold text-blue-950">🔵 Within 90 Days</div>
          <div className="text-[10px] text-blue-600/80 mt-0.5">Early notice phase</div>
        </button>

        {/* 🟢 Renewed */}
        <button
          type="button"
          onClick={() => onNavigateToDocuments('renewed')}
          className="p-3.5 rounded-2xl border bg-white border-emerald-200 hover:border-emerald-400 hover:shadow-md transition-all text-left group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#168A45]"></span>
            <CheckCircle2 className="w-4 h-4 text-[#168A45] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-[#0B5D2A] tracking-tight">{metrics.renewedCount}</div>
          <div className="text-xs font-bold text-emerald-950">🟢 Renewed</div>
          <div className="text-[10px] text-emerald-700/80 mt-0.5">Audited history</div>
        </button>
      </div>

      {/* 3. Summary Bar: Total Documents & Financial Renewal Exposure */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-medium block">Total Tracked Documents</span>
            <div className="text-2xl font-black text-slate-800 tracking-tight mt-0.5">
              {metrics.totalDocuments} Records
            </div>
            <span className="text-[11px] text-slate-500">
              Across 18 standard & {documentTypes.filter((t) => t.category === 'Custom').length} custom types
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-medium block">Renewal Financial Exposure</span>
            <div className="text-2xl font-black text-emerald-800 tracking-tight mt-0.5">
              ₹ {metrics.totalRenewalCostExposure.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500">
              Expected renewal commitment across all expiring records
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-medium block">Quick Filter by Department</span>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="mt-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-hidden w-full"
            >
              <option value="all">All Departments ({documents.length})</option>
              {departmentsList.map((dept) => (
                <option key={dept} value={dept}>
                  {dept} Department ({documents.filter((d) => d.department === dept).length})
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={onOpenNewDocument}
            className="px-3.5 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer shrink-0 ml-2"
          >
            + Register Doc
          </button>
        </div>
      </div>

      {/* 4. Urgent Attention Table: Items Expiring Soonest */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-slate-800 text-sm">
              Urgent Attention Queue (Expired & Expiring Within 7 Days)
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              {urgentDocs.length} Needs Action
            </span>
          </div>
          <button
            onClick={() => onNavigateToDocuments()}
            className="text-xs font-bold text-[#168A45] hover:text-[#0B5D2A] flex items-center space-x-1 cursor-pointer"
          >
            <span>View All Documents</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {urgentDocs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Document Title & Ref</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Expiry Date</th>
                  <th className="px-4 py-3">Urgency Status</th>
                  <th className="px-4 py-3">Responsible</th>
                  <th className="px-6 py-3 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {urgentDocs.map((doc) => {
                  const days = calculateDaysRemaining(doc.expiryDate);
                  const urgency = getUrgencyLevel(doc);
                  const badge = getUrgencyBadge(urgency, days);

                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => onSelectDocument(doc)}
                    >
                      <td className="px-6 py-3.5 max-w-xs">
                        <div className="font-bold text-slate-800 truncate group-hover:text-emerald-700">
                          {doc.documentName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Ref: #{doc.referenceNumber} | {doc.relatedParty}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                          {doc.documentTypeName}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-slate-700 font-semibold">{doc.department}</td>

                      <td className="px-4 py-3.5 font-mono font-bold text-slate-800">
                        {doc.expiryDate}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dotColor}`}></span>
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-slate-600">
                        <div className="flex items-center space-x-1.5">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{doc.responsiblePerson}</span>
                        </div>
                      </td>

                      <td className="px-6 py-3.5 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onOpenRenew(doc)}
                          className="px-3 py-1 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer inline-flex items-center space-x-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Renew</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-bold text-slate-700">No expired or immediate 7-day deadlines pending.</p>
            <p className="text-[11px] text-slate-400">All document registrations and warranties are up to date.</p>
          </div>
        )}
      </div>

      {/* 5. Charts & Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Urgency Status Distribution Donut */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="font-bold text-slate-800 text-xs flex items-center space-x-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
              <span>Expiry Status Distribution</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">All active documents</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => [`${value} Documents`, name]}
                  contentStyle={{ borderRadius: '0.75rem', fontSize: '11px' }}
                />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department-wise Expiry Count & Exposure */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="font-bold text-slate-800 text-xs flex items-center space-x-1.5">
              <Building className="w-4 h-4 text-emerald-700" />
              <span>Departmental Exposure (Doc Count & Cost in Thousands ₹)</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">By Responsible Unit</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptBarData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <XAxis dataKey="department" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(value: any, name: any) =>
                    name === 'cost' ? [`₹ ${Number(value) * 1000}`, 'Total Renewal Cost'] : [`${value} Docs`, 'Count']
                  }
                  contentStyle={{ borderRadius: '0.75rem', fontSize: '11px' }}
                />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '10px' }}
                />
                <Bar dataKey="documents" name="Documents" fill="#168A45" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cost" name="Cost (k ₹)" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
