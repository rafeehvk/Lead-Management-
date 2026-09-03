import React, { useState } from 'react';
import {
  Award,
  Plus,
  Search,
  CheckCircle,
  Star,
  Sliders,
  TrendingUp,
  FileText,
  UserCheck,
  Building,
  AlertCircle,
  Calendar,
  Briefcase,
} from 'lucide-react';
import {
  Position,
  PositionKpiConfig,
  KpiMetricItem,
  StaffMember,
  StaffPerformanceEvaluation,
} from '../../types/hr';

interface KpiManagementViewProps {
  positions: Position[];
  staff: StaffMember[];
  positionKpis: PositionKpiConfig[];
  performanceRecords: StaffPerformanceEvaluation[];
  onSavePositionKpi: (config: PositionKpiConfig) => void;
  onSavePerformance: (perf: Partial<StaffPerformanceEvaluation>) => void;
}

export const KpiManagementView: React.FC<KpiManagementViewProps> = ({
  positions = [],
  staff = [],
  positionKpis = [],
  performanceRecords = [],
  onSavePositionKpi,
  onSavePerformance,
}) => {
  const [activeTab, setActiveTab] = useState<'kpi-setup' | 'staff-evaluations'>('staff-evaluations');

  // Selected position for KPI configuration
  const [selectedPosId, setSelectedPosId] = useState<string>(positions[0]?.id || '');
  const activeKpiConfig =
    positionKpis.find((k) => k.positionId === selectedPosId) ||
    ({
      positionId: selectedPosId,
      positionName: positions.find((p) => p.id === selectedPosId)?.name || 'Position',
      department: positions.find((p) => p.id === selectedPosId)?.department || 'Academic',
      metrics: [
        {
          id: 'KPI-1',
          name: 'Core Curriculum & Syllabus Completion',
          weightage: 30,
          targetMetric: '100% on schedule',
          description: 'Timely coverage of syllabus and lesson plan adherence.',
        },
        {
          id: 'KPI-2',
          name: 'Student Analysis Record (MYSAR) Logging',
          weightage: 25,
          targetMetric: '≥95% on-time entry',
          description: 'Daily test, homework, and attendance synchronization in MYSAR.',
        },
        {
          id: 'KPI-3',
          name: 'Parent Communication & Satisfaction',
          weightage: 25,
          targetMetric: '≥4.5 / 5 Rating',
          description: 'PTA meeting attendance and proactive parent feedback resolution.',
        },
        {
          id: 'KPI-4',
          name: 'Punctuality & Institutional Attendance',
          weightage: 20,
          targetMetric: '≥96% attendance',
          description: 'Biometric on-time punches and adherence to institution timetable.',
        },
      ],
      totalWeightage: 100,
      reviewFrequency: 'Quarterly',
    } as PositionKpiConfig);

  const [kpiMetrics, setKpiMetrics] = useState<KpiMetricItem[]>(
    activeKpiConfig.metrics ||
      (activeKpiConfig.kpis
        ? activeKpiConfig.kpis.map((k) => ({
            id: k.id,
            name: k.name,
            weightage: k.weightage,
            targetMetric: k.target || 'Met standard',
            description: k.description,
          }))
        : [])
  );

  // New Evaluation Modal
  const [isNewEvalOpen, setIsNewEvalOpen] = useState(false);
  const [evalForm, setEvalForm] = useState<Partial<StaffPerformanceEvaluation>>({
    staffId: staff[0]?.id || '',
    period: 'Q3 2026',
    overallScore: 92,
    rating: 'Outstanding',
    attendanceScore: 96,
    leaveScore: 92,
    kpiScores: {},
    managerReview: 'Exemplary teaching dedication and diligent student record maintenance.',
    evaluatedBy: 'Dr. Ramesh Nambiar',
  });

  const totalWeightage = kpiMetrics.reduce((acc, m) => acc + (m.weightage || 0), 0);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Navigation Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setActiveTab('staff-evaluations')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'staff-evaluations'
                ? 'bg-[#EAF7EF] text-[#0B5D2A] border border-[#D9E5DD] shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Award className="w-4 h-4 text-[#168A45]" />
            <span>Staff Evaluations ({performanceRecords.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('kpi-setup')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'kpi-setup'
                ? 'bg-[#EAF7EF] text-[#0B5D2A] border border-[#D9E5DD] shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Sliders className="w-4 h-4 text-[#168A45]" />
            <span>Position KPI Metrics Setup</span>
          </button>
        </div>

        {activeTab === 'staff-evaluations' && (
          <button
            onClick={() => setIsNewEvalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Conduct Staff Evaluation</span>
          </button>
        )}
      </div>

      {/* SUB-TAB 1: STAFF EVALUATIONS */}
      {activeTab === 'staff-evaluations' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-medium">Evaluations Completed</span>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">{performanceRecords.length}</div>
              <span className="text-[10px] text-slate-400">Quarterly Institutional Cycle</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] text-emerald-700 font-medium">Average Performance Score</span>
              <div className="text-2xl font-bold text-emerald-800 mt-0.5">
                {performanceRecords.length > 0
                  ? Math.round(
                      performanceRecords.reduce((acc, p) => acc + p.overallScore, 0) / performanceRecords.length
                    )
                  : 91}
                %
              </div>
              <span className="text-[10px] text-emerald-600 font-medium">Benchmark exceeded</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-medium">Top Tier Faculty</span>
              <div className="text-2xl font-bold text-indigo-700 mt-0.5">
                {performanceRecords.filter((p) => p.overallScore >= 90).length} Outstanding
              </div>
              <span className="text-[10px] text-indigo-600 font-medium">Eligible for annual bonus</span>
            </div>
          </div>

          {/* Evaluations Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Staff Member & ID</th>
                    <th className="px-4 py-3">Department & Role</th>
                    <th className="px-4 py-3">Evaluation Cycle</th>
                    <th className="px-4 py-3 text-center">Attendance %</th>
                    <th className="px-4 py-3 text-center">Leave Disc.</th>
                    <th className="px-4 py-3 text-center">Overall Score</th>
                    <th className="px-4 py-3">Rating Tier</th>
                    <th className="px-4 py-3">Evaluator Review Notes</th>
                    <th className="px-4 py-3">Actioned By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {performanceRecords.map((perf) => (
                    <tr key={perf.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{perf.staffName}</div>
                        <div className="text-[10px] text-slate-400">{perf.staffId}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{perf.position}</div>
                        <div className="text-[10px] text-slate-400">{perf.department}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{perf.period}</td>
                      <td className="px-4 py-3 text-center font-bold text-emerald-700">{perf.attendanceScore}%</td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-700">{perf.leaveScore}%</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                          {perf.overallScore}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            perf.rating === 'Outstanding'
                              ? 'bg-emerald-100 text-emerald-800'
                              : perf.rating === 'Excellent'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {perf.rating}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-[240px] truncate">{perf.managerReview}</td>
                      <td className="px-4 py-3 text-slate-500 text-[11px]">
                        <div>{perf.evaluatedBy}</div>
                        <div className="text-[10px] text-slate-400">{perf.evaluatedDate}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: POSITION KPI SETUP */}
      {activeTab === 'kpi-setup' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Define Position-Specific Performance KPIs</h3>
                <p className="text-xs text-slate-500">
                  Configure weighted evaluation criteria for specific positions across departments.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-500 font-semibold">Position:</span>
                <select
                  value={selectedPosId}
                  onChange={(e) => {
                    const newPos = e.target.value;
                    setSelectedPosId(newPos);
                    const found = positionKpis.find((k) => k.positionId === newPos);
                    if (found) {
                      setKpiMetrics(found.metrics);
                    }
                  }}
                  className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 font-semibold bg-white"
                >
                  {positions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.department})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Metrics List */}
            <div className="space-y-3 mb-6">
              {kpiMetrics.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-xs"
                >
                  <div className="md:col-span-4">
                    <label className="text-[10px] text-slate-400 font-semibold uppercase">KPI Parameter</label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => {
                        const updated = [...kpiMetrics];
                        updated[idx].name = e.target.value;
                        setKpiMetrics(updated);
                      }}
                      className="w-full mt-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 bg-white font-medium"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[10px] text-slate-400 font-semibold uppercase">Weightage (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={item.weightage}
                      onChange={(e) => {
                        const updated = [...kpiMetrics];
                        updated[idx].weightage = parseInt(e.target.value) || 0;
                        setKpiMetrics(updated);
                      }}
                      className="w-full mt-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 bg-white font-bold text-center"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="text-[10px] text-slate-400 font-semibold uppercase">Target Metric</label>
                    <input
                      type="text"
                      value={item.targetMetric}
                      onChange={(e) => {
                        const updated = [...kpiMetrics];
                        updated[idx].targetMetric = e.target.value;
                        setKpiMetrics(updated);
                      }}
                      className="w-full mt-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 bg-white"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="text-[10px] text-slate-400 font-semibold uppercase">Description / Rubric</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => {
                        const updated = [...kpiMetrics];
                        updated[idx].description = e.target.value;
                        setKpiMetrics(updated);
                      }}
                      className="w-full mt-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Total Weightage Status & Save */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-600 font-semibold">Total Configured Weightage:</span>
                <span
                  className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${
                    totalWeightage === 100
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {totalWeightage}% / 100%
                </span>
                {totalWeightage !== 100 && (
                  <span className="text-[11px] text-amber-600">Must equal exactly 100%</span>
                )}
              </div>

              <button
                onClick={() => {
                  const targetPos = positions.find((p) => p.id === selectedPosId);
                  onSavePositionKpi({
                    positionId: selectedPosId,
                    positionName: targetPos?.name || 'Position',
                    department: targetPos?.department || 'Academic',
                    metrics: kpiMetrics,
                    totalWeightage,
                    reviewFrequency: 'Quarterly',
                  });
                }}
                className="px-4 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Save KPI Parameters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONDUCT STAFF EVALUATION */}
      {isNewEvalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-2xl p-6 shadow-xl border border-slate-200 text-xs">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Conduct Staff Performance Evaluation</h2>
            <p className="text-slate-500 mb-4">Record formal appraisal based on institutional KPI benchmarks.</p>

            <div className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700">Staff Member</label>
                <select
                  value={evalForm.staffId}
                  onChange={(e) => {
                    const st = staff.find((s) => s.id === e.target.value);
                    setEvalForm({
                      ...evalForm,
                      staffId: e.target.value,
                      staffName: st?.fullName,
                      department: st?.department,
                      position: st?.position,
                    });
                  }}
                  className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                >
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.position} - {s.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Evaluation Cycle</label>
                  <input
                    type="text"
                    value={evalForm.period}
                    onChange={(e) => setEvalForm({ ...evalForm, period: e.target.value })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Overall Score (0 - 100%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={evalForm.overallScore}
                    onChange={(e) => {
                      const score = parseInt(e.target.value) || 0;
                      let rating: StaffPerformanceEvaluation['rating'] = 'Good';
                      if (score >= 90) rating = 'Outstanding';
                      else if (score >= 80) rating = 'Excellent';
                      else if (score < 70) rating = 'Needs Improvement';

                      setEvalForm({
                        ...evalForm,
                        overallScore: score,
                        rating,
                      });
                    }}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold text-emerald-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Attendance Punctuality Score (%)</label>
                  <input
                    type="number"
                    value={evalForm.attendanceScore}
                    onChange={(e) => setEvalForm({ ...evalForm, attendanceScore: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Leave Discipline Score (%)</label>
                  <input
                    type="number"
                    value={evalForm.leaveScore}
                    onChange={(e) => setEvalForm({ ...evalForm, leaveScore: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Manager / Evaluator Review Remarks</label>
                <textarea
                  rows={3}
                  value={evalForm.managerReview}
                  onChange={(e) => setEvalForm({ ...evalForm, managerReview: e.target.value })}
                  placeholder="Appraisal observations on teaching methodologies, student rapport, and record adherence..."
                  className="w-full mt-1 border border-slate-200 rounded-xl p-3 text-slate-900"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end space-x-2">
              <button
                onClick={() => setIsNewEvalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const targetStaff = staff.find((s) => s.id === evalForm.staffId) || staff[0];
                  onSavePerformance({
                    ...evalForm,
                    staffId: targetStaff.id,
                    staffName: targetStaff.fullName,
                    department: targetStaff.department,
                    position: targetStaff.position,
                  });
                  setIsNewEvalOpen(false);
                }}
                className="px-4 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl font-bold cursor-pointer shadow-xs"
              >
                Save Appraisal Evaluation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
