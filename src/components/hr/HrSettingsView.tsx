import React, { useState } from 'react';
import {
  Settings,
  Clock,
  CalendarX,
  CreditCard,
  Shield,
  Save,
  RotateCcw,
  CheckCircle,
  Info,
  MapPin,
  Plus,
  X,
} from 'lucide-react';
import { HrSettingsConfig } from '../../types/hr';

interface HrSettingsViewProps {
  settings: HrSettingsConfig;
  onSaveSettings: (settings: HrSettingsConfig) => void;
  onResetData: () => void;
}

export const HrSettingsView: React.FC<HrSettingsViewProps> = ({
  settings,
  onSaveSettings,
  onResetData,
}) => {
  const [formState, setFormState] = useState<HrSettingsConfig>(settings);
  const [activeSection, setActiveSection] = useState<'attendance' | 'leave' | 'payroll' | 'roles'>('attendance');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newLocation, setNewLocation] = useState('');

  const handleSave = () => {
    onSaveSettings(formState);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const addLocation = () => {
    const loc = newLocation.trim();
    if (!loc) return;
    const currentLocs = formState.workingHours?.attendanceLocations || ['Kochi Main Campus'];
    if (currentLocs.includes(loc)) return;
    setFormState({
      ...formState,
      workingHours: {
        ...(formState.workingHours || {
          officeStartTime: '08:30 AM',
          officeEndTime: '04:30 PM',
          gracePeriodMinutes: 15,
          minimumWorkingHours: 8,
          halfDayHours: 4,
          attendanceLocations: ['Kochi Main Campus'],
        }),
        attendanceLocations: [...currentLocs, loc],
      },
    });
    setNewLocation('');
  };

  const removeLocation = (locToRemove: string) => {
    const currentLocs = formState.workingHours?.attendanceLocations || ['Kochi Main Campus'];
    setFormState({
      ...formState,
      workingHours: {
        ...(formState.workingHours || {
          officeStartTime: '08:30 AM',
          officeEndTime: '04:30 PM',
          gracePeriodMinutes: 15,
          minimumWorkingHours: 8,
          halfDayHours: 4,
          attendanceLocations: ['Kochi Main Campus'],
        }),
        attendanceLocations: currentLocs.filter((l) => l !== locToRemove),
      },
    });
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Settings className="w-5 h-5 text-[#168A45]" />
            <span>HR System Configuration & Policies</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure institutional attendance rules, leave quotas, payroll cycles, and access permissions.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {saveSuccess && (
            <span className="flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 animate-in fade-in">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Saved Successfully</span>
            </span>
          )}
          <button
            onClick={handleSave}
            className="flex items-center space-x-1.5 px-4 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {/* Navigation Sidebar */}
        <div className="space-y-1.5 bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs h-fit text-xs font-semibold">
          <button
            onClick={() => setActiveSection('attendance')}
            className={`w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
              activeSection === 'attendance'
                ? 'bg-[#EAF7EF] text-[#0B5D2A]'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Clock className="w-4 h-4 text-[#168A45]" />
            <span>Attendance & Shift Hours</span>
          </button>

          <button
            onClick={() => setActiveSection('leave')}
            className={`w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
              activeSection === 'leave'
                ? 'bg-[#EAF7EF] text-[#0B5D2A]'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <CalendarX className="w-4 h-4 text-[#168A45]" />
            <span>Leave Policy & Quotas</span>
          </button>

          <button
            onClick={() => setActiveSection('payroll')}
            className={`w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
              activeSection === 'payroll'
                ? 'bg-[#EAF7EF] text-[#0B5D2A]'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <CreditCard className="w-4 h-4 text-[#168A45]" />
            <span>Payroll Cycles & Slabs</span>
          </button>

          <button
            onClick={() => setActiveSection('roles')}
            className={`w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
              activeSection === 'roles'
                ? 'bg-[#EAF7EF] text-[#0B5D2A]'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Shield className="w-4 h-4 text-[#168A45]" />
            <span>Roles & Access Matrix</span>
          </button>
        </div>

        {/* Configuration Body */}
        <div className="md:col-span-3 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs text-xs space-y-6">
          {/* 1. Attendance & Shift Hours */}
          {activeSection === 'attendance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                  Shift Timing & Punctuality Rules
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Define daily operational office hours, grace allowance, and attendance calculation rules.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-semibold text-slate-700">Official Shift Start</label>
                  <input
                    type="text"
                    value={formState.workingHours?.officeStartTime || '08:30 AM'}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        workingHours: {
                          ...(formState.workingHours || {
                            officeStartTime: '08:30 AM',
                            officeEndTime: '04:30 PM',
                            gracePeriodMinutes: 15,
                            minimumWorkingHours: 8,
                            halfDayHours: 4,
                            attendanceLocations: ['Kochi Main Campus'],
                          }),
                          officeStartTime: e.target.value,
                        },
                      })
                    }
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-[#168A45]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Official Shift End</label>
                  <input
                    type="text"
                    value={formState.workingHours?.officeEndTime || '04:30 PM'}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        workingHours: {
                          ...(formState.workingHours || {
                            officeStartTime: '08:30 AM',
                            officeEndTime: '04:30 PM',
                            gracePeriodMinutes: 15,
                            minimumWorkingHours: 8,
                            halfDayHours: 4,
                            attendanceLocations: ['Kochi Main Campus'],
                          }),
                          officeEndTime: e.target.value,
                        },
                      })
                    }
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-[#168A45]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Grace Minutes Allowed</label>
                  <input
                    type="number"
                    value={formState.workingHours?.gracePeriodMinutes ?? 15}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        workingHours: {
                          ...(formState.workingHours || {
                            officeStartTime: '08:30 AM',
                            officeEndTime: '04:30 PM',
                            gracePeriodMinutes: 15,
                            minimumWorkingHours: 8,
                            halfDayHours: 4,
                            attendanceLocations: ['Kochi Main Campus'],
                          }),
                          gracePeriodMinutes: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-[#168A45]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="font-semibold text-slate-700">Minimum Hours for Full Day</label>
                  <input
                    type="number"
                    value={formState.workingHours?.minimumWorkingHours ?? 8}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        workingHours: {
                          ...(formState.workingHours || {
                            officeStartTime: '08:30 AM',
                            officeEndTime: '04:30 PM',
                            gracePeriodMinutes: 15,
                            minimumWorkingHours: 8,
                            halfDayHours: 4,
                            attendanceLocations: ['Kochi Main Campus'],
                          }),
                          minimumWorkingHours: parseInt(e.target.value) || 8,
                        },
                      })
                    }
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-[#168A45]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Half Day Minimum Hours</label>
                  <input
                    type="number"
                    value={formState.workingHours?.halfDayHours ?? 4}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        workingHours: {
                          ...(formState.workingHours || {
                            officeStartTime: '08:30 AM',
                            officeEndTime: '04:30 PM',
                            gracePeriodMinutes: 15,
                            minimumWorkingHours: 8,
                            halfDayHours: 4,
                            attendanceLocations: ['Kochi Main Campus'],
                          }),
                          halfDayHours: parseInt(e.target.value) || 4,
                        },
                      })
                    }
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-[#168A45]"
                  />
                </div>
              </div>

              {/* Weekly Off Days */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="font-semibold text-slate-700">Primary Weekly Off</label>
                  <select
                    value={formState.weeklyOff?.primaryDay || 'Sunday'}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        weeklyOff: {
                          ...(formState.weeklyOff || {
                            primaryDay: 'Sunday',
                            alternateDay: 'Second Saturday',
                            customOffType: 'Standard',
                          }),
                          primaryDay: e.target.value,
                        },
                      })
                    }
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white focus:outline-none focus:border-[#168A45]"
                  >
                    <option value="Sunday">Sunday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Alternate Weekly Off</label>
                  <input
                    type="text"
                    value={formState.weeklyOff?.alternateDay || 'Second Saturday'}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        weeklyOff: {
                          ...(formState.weeklyOff || {
                            primaryDay: 'Sunday',
                            alternateDay: 'Second Saturday',
                            customOffType: 'Standard',
                          }),
                          alternateDay: e.target.value,
                        },
                      })
                    }
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-[#168A45]"
                  />
                </div>
              </div>

              {/* Attendance Locations */}
              <div className="pt-4 border-t border-slate-100">
                <label className="font-semibold text-slate-700 flex items-center space-x-1.5 mb-2">
                  <MapPin className="w-3.5 h-3.5 text-[#168A45]" />
                  <span>Approved Attendance Geofence Locations</span>
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {(formState.workingHours?.attendanceLocations || ['Kochi Main Campus']).map((loc) => (
                    <span
                      key={loc}
                      className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/60 rounded-xl text-xs font-semibold"
                    >
                      <span>{loc}</span>
                      <button
                        onClick={() => removeLocation(loc)}
                        className="text-emerald-500 hover:text-rose-600 cursor-pointer"
                        title="Remove location"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex items-center space-x-2 max-w-sm">
                  <input
                    type="text"
                    placeholder="Add approved attendance location..."
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addLocation();
                      }
                    }}
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-900 focus:outline-none focus:border-[#168A45]"
                  />
                  <button
                    onClick={addLocation}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl font-bold cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. Leave Policy */}
          {activeSection === 'leave' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                  Annual Leave Types & Quotas
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Configure default entitlement days per year for full-time institutional staff and carry-forward caps.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="font-semibold text-slate-700">Casual Leave (CL)</label>
                  <p className="text-[11px] text-slate-400 mb-1">Single-day urgent leaves</p>
                  <input
                    type="number"
                    value={formState.annualLeaveQuotas?.casualLeave ?? 12}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        annualLeaveQuotas: {
                          ...(formState.annualLeaveQuotas || {
                            casualLeave: 12,
                            sickLeave: 10,
                            annualLeave: 15,
                            emergencyLeave: 5,
                            maternityLeaveDays: 180,
                            maxCarryForward: 10,
                          }),
                          casualLeave: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold bg-white focus:outline-none focus:border-[#168A45]"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="font-semibold text-slate-700">Sick Leave (SL)</label>
                  <p className="text-[11px] text-slate-400 mb-1">Medical & recovery leave</p>
                  <input
                    type="number"
                    value={formState.annualLeaveQuotas?.sickLeave ?? 10}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        annualLeaveQuotas: {
                          ...(formState.annualLeaveQuotas || {
                            casualLeave: 12,
                            sickLeave: 10,
                            annualLeave: 15,
                            emergencyLeave: 5,
                            maternityLeaveDays: 180,
                            maxCarryForward: 10,
                          }),
                          sickLeave: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold bg-white focus:outline-none focus:border-[#168A45]"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="font-semibold text-slate-700">Annual Earned Leave (AL)</label>
                  <p className="text-[11px] text-slate-400 mb-1">Accrued vacation time</p>
                  <input
                    type="number"
                    value={formState.annualLeaveQuotas?.annualLeave ?? 15}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        annualLeaveQuotas: {
                          ...(formState.annualLeaveQuotas || {
                            casualLeave: 12,
                            sickLeave: 10,
                            annualLeave: 15,
                            emergencyLeave: 5,
                            maternityLeaveDays: 180,
                            maxCarryForward: 10,
                          }),
                          annualLeave: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold bg-white focus:outline-none focus:border-[#168A45]"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="font-semibold text-slate-700">Emergency Leave (EL)</label>
                  <p className="text-[11px] text-slate-400 mb-1">Compassionate / bereavement</p>
                  <input
                    type="number"
                    value={formState.annualLeaveQuotas?.emergencyLeave ?? 5}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        annualLeaveQuotas: {
                          ...(formState.annualLeaveQuotas || {
                            casualLeave: 12,
                            sickLeave: 10,
                            annualLeave: 15,
                            emergencyLeave: 5,
                            maternityLeaveDays: 180,
                            maxCarryForward: 10,
                          }),
                          emergencyLeave: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold bg-white focus:outline-none focus:border-[#168A45]"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="font-semibold text-slate-700">Maternity Leave (Days)</label>
                  <p className="text-[11px] text-slate-400 mb-1">Statutory entitlement</p>
                  <input
                    type="number"
                    value={formState.annualLeaveQuotas?.maternityLeaveDays ?? 180}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        annualLeaveQuotas: {
                          ...(formState.annualLeaveQuotas || {
                            casualLeave: 12,
                            sickLeave: 10,
                            annualLeave: 15,
                            emergencyLeave: 5,
                            maternityLeaveDays: 180,
                            maxCarryForward: 10,
                          }),
                          maternityLeaveDays: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold bg-white focus:outline-none focus:border-[#168A45]"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="font-semibold text-slate-700">Max Carry Forward (Days)</label>
                  <p className="text-[11px] text-slate-400 mb-1">Rollover to next calendar year</p>
                  <input
                    type="number"
                    value={formState.annualLeaveQuotas?.maxCarryForward ?? 10}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        annualLeaveQuotas: {
                          ...(formState.annualLeaveQuotas || {
                            casualLeave: 12,
                            sickLeave: 10,
                            annualLeave: 15,
                            emergencyLeave: 5,
                            maternityLeaveDays: 180,
                            maxCarryForward: 10,
                          }),
                          maxCarryForward: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold bg-white focus:outline-none focus:border-[#168A45]"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/70 rounded-xl flex items-start space-x-2.5 text-xs text-emerald-900">
                <Info className="w-4 h-4 text-[#168A45] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Leave Approval SLA & Routing</div>
                  <div className="text-emerald-800 text-[11px] mt-0.5 leading-relaxed">
                    Leave requests under 3 days require Department Head approval. Leaves beyond 3 consecutive days or
                    medical leaves requiring certificate submission are automatically routed to the Principal / Academic Head.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. Payroll Settings */}
          {activeSection === 'payroll' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                  Payroll Cycles & Statutory Deductions
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Configure monthly payroll calculation dates and statutory employee deduction slabs.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700">Monthly Pay Run Day (1-31)</label>
                  <p className="text-[11px] text-slate-400 mb-1">Cut-off date for monthly salary disbursement</p>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={formState.payrollSettings?.payrollCycleDay ?? 30}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        payrollSettings: {
                          ...(formState.payrollSettings || {
                            payrollCycleDay: 30,
                            pfRatePercent: 12,
                            esiRatePercent: 0.75,
                            standardHraPercent: 40,
                          }),
                          payrollCycleDay: parseInt(e.target.value) || 1,
                        },
                      })
                    }
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-[#168A45]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Employee EPF Deduction (%)</label>
                  <p className="text-[11px] text-slate-400 mb-1">Standard Provident Fund deduction from Basic</p>
                  <input
                    type="number"
                    value={formState.payrollSettings?.pfRatePercent ?? 12}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        payrollSettings: {
                          ...(formState.payrollSettings || {
                            payrollCycleDay: 30,
                            pfRatePercent: 12,
                            esiRatePercent: 0.75,
                            standardHraPercent: 40,
                          }),
                          pfRatePercent: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-[#168A45]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">ESI Contribution Rate (%)</label>
                  <p className="text-[11px] text-slate-400 mb-1">Employee State Insurance deduction</p>
                  <input
                    type="number"
                    step="0.05"
                    value={formState.payrollSettings?.esiRatePercent ?? 0.75}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        payrollSettings: {
                          ...(formState.payrollSettings || {
                            payrollCycleDay: 30,
                            pfRatePercent: 12,
                            esiRatePercent: 0.75,
                            standardHraPercent: 40,
                          }),
                          esiRatePercent: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-[#168A45]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Standard HRA (%)</label>
                  <p className="text-[11px] text-slate-400 mb-1">House Rent Allowance percentage of Basic</p>
                  <input
                    type="number"
                    value={formState.payrollSettings?.standardHraPercent ?? 40}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        payrollSettings: {
                          ...(formState.payrollSettings || {
                            payrollCycleDay: 30,
                            pfRatePercent: 12,
                            esiRatePercent: 0.75,
                            standardHraPercent: 40,
                          }),
                          standardHraPercent: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-[#168A45]"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-slate-600">
                <div className="font-bold text-slate-900">Salary Calculation Basis</div>
                <div className="text-[11px] leading-relaxed">
                  Gross Pay = Basic Pay + HRA + Special / Academic Allowances. Net Disbursement = Gross Pay - (EPF + ESI + Professional Tax + Loss of Pay Days). Payslips are issued automatically upon payroll approval.
                </div>
              </div>
            </div>
          )}

          {/* 4. Role Matrix & Reset */}
          {activeSection === 'roles' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                  MYSAR Role Permissions Matrix
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Access control boundaries for institutional governance, recruitment, and payroll processing.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 text-slate-700">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <strong className="text-slate-900 font-semibold">Super Admin / Director:</strong>
                  <span className="text-slate-600">Full access to Recruitment, Salaries, Approvals & System Settings</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <strong className="text-slate-900 font-semibold">HR Admin:</strong>
                  <span className="text-slate-600">Manage Applicants, Offer/Appt Letters, Attendance & Onboarding</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <strong className="text-slate-900 font-semibold">Principal / Academic Head:</strong>
                  <span className="text-slate-600">Interview evaluations, leave approvals, and KPI performance reviews</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <strong className="text-slate-900 font-semibold">Finance Officer:</strong>
                  <span className="text-slate-600">Run monthly payroll, download statutory reports, disburse payslips</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Reset Demo Data</div>
                  <div className="text-slate-500 text-[11px]">
                    Revert all HR records back to default sample state.
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (window.confirm('Reset all HR data to demo defaults?')) {
                      onResetData();
                      window.location.reload();
                    }
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl font-bold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Demo Data</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
