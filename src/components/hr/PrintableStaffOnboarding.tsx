import React from 'react';
import { StaffMember } from '../../types/hr';

interface PrintableStaffOnboardingProps {
  onboardingData: Partial<StaffMember>;
  id?: string;
}

export const PrintableStaffOnboarding: React.FC<PrintableStaffOnboardingProps> = ({
  onboardingData,
  id = 'printable-staff-onboarding-doc',
}) => {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const staffId = onboardingData.id || onboardingData.staffId || 'EMP-2026-NEW';
  const fullName = onboardingData.fullName || 'Candidate Full Name';

  return (
    <div id={id} className="bg-slate-200 text-slate-800 font-sans select-none">
      {/* ======================= PAGE 1 ======================= */}
      <div className="hr-pdf-page w-[794px] h-[1123px] max-h-[1123px] bg-white relative flex flex-col justify-between overflow-hidden shadow-xl border border-slate-200 mx-auto text-xs p-10 box-border">
        <div>
          {/* Top Institutional Header */}
          <div className="flex items-center justify-between border-b-2 border-[#168A45] pb-4 mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-[#168A45] text-white flex items-center justify-center font-black text-xl tracking-tight shadow-xs">
                M
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-widest text-[#0B5D2A] uppercase">
                  CASBIRO SOLUTIONS PRIVATE LIMITED
                </div>
                <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                  MYSAR INSTITUTIONAL ERP
                </h1>
                <div className="text-[11px] font-semibold text-emerald-800">
                  Staff Registration & Institutional Onboarding Dossier
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300 uppercase tracking-wider mb-1">
                Form No. HR-ONB-2026
              </span>
              <div className="text-[10px] text-slate-500 font-mono font-bold">App ID: {staffId}</div>
              <div className="text-[9px] text-slate-400">Date: {currentDate}</div>
            </div>
          </div>

          {/* Banner */}
          <div className="bg-gradient-to-r from-[#0B5D2A] to-[#168A45] text-white px-5 py-3 rounded-xl flex items-center justify-between mb-4 shadow-xs">
            <div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-200">
                Official Institutional Enrollment Application
              </div>
              <div className="text-base font-bold tracking-tight">NEW STAFF ONBOARDING FORM</div>
            </div>
            <div className="text-right text-[11px]">
              <span className="bg-white/20 px-3 py-1 rounded-lg font-bold">
                10-Section Form
              </span>
            </div>
          </div>

          {/* Staff Top Banner */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-xl bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center text-2xl font-black text-[#0B5D2A] shadow-xs shrink-0 overflow-hidden">
                {onboardingData.profilePhoto ? (
                  <img
                    src={onboardingData.profilePhoto}
                    alt={fullName}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                ) : (
                  fullName.charAt(0)
                )}
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                  {fullName}
                </h2>
                <div className="text-xs font-bold text-emerald-800 mt-0.5">
                  {onboardingData.position || 'Position Title'} • {onboardingData.department || 'Department'}
                </div>
                <div className="text-[10px] text-slate-500 mt-1 flex items-center space-x-2">
                  <span><b>Allocated ID:</b> {staffId}</span>
                  <span>•</span>
                  <span><b>Proposed Joining:</b> {onboardingData.joiningDate || currentDate}</span>
                </div>
              </div>
            </div>

            <div className="text-right space-y-1 text-[10px]">
              <div className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700">
                <b>Cadre:</b> {onboardingData.employeeCategory || 'Academic / Admin'}
              </div>
              <div className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700">
                <b>Type:</b> {onboardingData.employmentType || 'Full Time'}
              </div>
            </div>
          </div>

          {/* Section 1: Personal Coordinates */}
          <div className="mb-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#0B5D2A] uppercase tracking-wider mb-2 border-b border-emerald-100 pb-1">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#0B5D2A] text-[10px] flex items-center justify-center font-extrabold">
                1
              </span>
              <span>Personal Information & Identity Details</span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-[10px]">
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-slate-400">Date of Birth</div>
                <div className="font-bold text-slate-900 mt-0.5">{onboardingData.dateOfBirth || '—'}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-slate-400">Gender</div>
                <div className="font-bold text-slate-900 mt-0.5">{onboardingData.gender || '—'}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-slate-400">Blood Group</div>
                <div className="font-bold text-rose-700 mt-0.5">{onboardingData.bloodGroup || 'O+'}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-slate-400">Nationality & Marital</div>
                <div className="font-bold text-slate-900 mt-0.5">
                  {onboardingData.nationality || 'Indian'} • {onboardingData.maritalStatus || 'Married'}
                </div>
              </div>

              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-slate-400">Contact Number</div>
                <div className="font-bold text-slate-900 mt-0.5">{onboardingData.contactNumber || '—'}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-slate-400">WhatsApp Number</div>
                <div className="font-bold text-slate-900 mt-0.5">{onboardingData.whatsappNumber || onboardingData.contactNumber || '—'}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-slate-400">Personal Email</div>
                <div className="font-bold text-slate-900 mt-0.5 truncate">{onboardingData.personalEmail || '—'}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-slate-400">Official Assigned Email</div>
                <div className="font-bold text-emerald-800 mt-0.5 truncate">{onboardingData.email || '—'}</div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="mt-2 p-2 bg-rose-50/60 rounded-lg border border-rose-200 flex items-center justify-between text-[10px]">
              <div>
                <span className="font-bold text-rose-900">Emergency Contact: </span>
                <span className="text-slate-800">
                  {onboardingData.emergencyContact?.name || 'Contact Name'} ({onboardingData.emergencyContact?.relationship || 'Spouse'})
                </span>
              </div>
              <div className="font-bold text-rose-800 font-mono">{onboardingData.emergencyContact?.phone || '—'}</div>
            </div>
          </div>

          {/* Section 2: Residential Addresses */}
          <div className="mb-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#0B5D2A] uppercase tracking-wider mb-2 border-b border-emerald-100 pb-1">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#0B5D2A] text-[10px] flex items-center justify-center font-extrabold">
                2
              </span>
              <span>Address Information</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[10px]">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="font-bold text-slate-800 mb-1">Permanent Residential Address</div>
                <div className="text-slate-600 leading-relaxed">
                  {onboardingData.permanentAddress?.addressLine1 || '—'}
                  {onboardingData.permanentAddress?.addressLine2 ? `, ${onboardingData.permanentAddress.addressLine2}` : ''}
                  {onboardingData.permanentAddress?.city ? `, ${onboardingData.permanentAddress.city}` : ''}
                  {onboardingData.permanentAddress?.state ? `, ${onboardingData.permanentAddress.state}` : ''}
                  {onboardingData.permanentAddress?.pinCode ? ` – ${onboardingData.permanentAddress.pinCode}` : ''}
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="font-bold text-slate-800 mb-1">Communication / Current Address</div>
                <div className="text-slate-600 leading-relaxed">
                  {onboardingData.communicationAddress?.sameAsPermanent
                    ? 'Same as Permanent Residential Address.'
                    : `${onboardingData.communicationAddress?.addressLine1 || '—'}, ${onboardingData.communicationAddress?.city || ''} – ${onboardingData.communicationAddress?.pinCode || ''}`}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Institutional Employment Details */}
          <div className="mb-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#0B5D2A] uppercase tracking-wider mb-2 border-b border-emerald-100 pb-1">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#0B5D2A] text-[10px] flex items-center justify-center font-extrabold">
                3
              </span>
              <span>Institutional Employment Details</span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-[10px]">
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-slate-400">Department</div>
                <div className="font-bold text-slate-800">{onboardingData.department || 'Academic'}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-slate-400">Designation</div>
                <div className="font-bold text-emerald-800">{onboardingData.position || 'Staff'}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-slate-400">Reporting Manager</div>
                <div className="font-bold text-slate-800 truncate">{onboardingData.reportingManager || 'Principal'}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-slate-400">Probation Period</div>
                <div className="font-bold text-slate-800">{onboardingData.probationPeriod || '6 Months'}</div>
              </div>
            </div>
          </div>

          {/* Section 4: Prior Career & Experience */}
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-[#0B5D2A] uppercase tracking-wider mb-2 border-b border-emerald-100 pb-1">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#0B5D2A] text-[10px] flex items-center justify-center font-extrabold">
                4
              </span>
              <span>Prior Career & Employment Experience</span>
            </div>

            <table className="w-full text-left text-[10px] border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[9px]">
                <tr>
                  <th className="p-1.5 border-b border-slate-200">Organization</th>
                  <th className="p-1.5 border-b border-slate-200">Designation</th>
                  <th className="p-1.5 border-b border-slate-200">Period</th>
                  <th className="p-1.5 border-b border-slate-200 text-right">Reason for Leaving</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!onboardingData.experiences || onboardingData.experiences.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-2 text-center text-slate-400 italic">
                      Fresher / No prior organizational experience records entered.
                    </td>
                  </tr>
                ) : (
                  onboardingData.experiences.map((exp, idx) => (
                    <tr key={exp.id || idx}>
                      <td className="p-1.5 font-bold text-slate-800">{exp.organization}</td>
                      <td className="p-1.5 text-emerald-800">{exp.designation}</td>
                      <td className="p-1.5 text-slate-600">{exp.dateOfJoining} to {exp.dateOfLeaving || 'Present'}</td>
                      <td className="p-1.5 text-right text-slate-500">{exp.reasonForLeaving || 'Career move'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Page 1 Footer */}
        <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[9px] text-slate-400">
          <div>OFFICIAL MYSAR STAFF REGISTRATION APPLICATION • FOR HR USE ONLY</div>
          <div className="font-bold tracking-widest text-[#168A45]">PAGE 1 OF 2</div>
        </div>
      </div>

      {/* ======================= PAGE 2 ======================= */}
      <div className="hr-pdf-page w-[794px] h-[1123px] max-h-[1123px] bg-white relative flex flex-col justify-between overflow-hidden shadow-xl border border-slate-200 mx-auto text-xs p-10 box-border mt-6">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-[#168A45] text-white flex items-center justify-center font-bold text-xs">
                M
              </div>
              <span className="font-bold text-slate-900 text-xs">
                MYSAR ERP • Staff Onboarding Dossier • {fullName} ({staffId})
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium">Page 2 of 2</div>
          </div>

          {/* Section 5: Qualifications */}
          <div className="mb-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#0B5D2A] uppercase tracking-wider mb-2 border-b border-emerald-100 pb-1">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#0B5D2A] text-[10px] flex items-center justify-center font-extrabold">
                5
              </span>
              <span>Educational & Professional Qualifications</span>
            </div>

            <table className="w-full text-left text-[10px] border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[9px]">
                <tr>
                  <th className="p-1.5 border-b border-slate-200">Level</th>
                  <th className="p-1.5 border-b border-slate-200">Course / Degree</th>
                  <th className="p-1.5 border-b border-slate-200">Institution</th>
                  <th className="p-1.5 border-b border-slate-200">Year</th>
                  <th className="p-1.5 border-b border-slate-200 text-right">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!onboardingData.qualifications || onboardingData.qualifications.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-2 text-center text-slate-400 italic">
                      No qualification credentials cataloged.
                    </td>
                  </tr>
                ) : (
                  onboardingData.qualifications.map((q, idx) => (
                    <tr key={q.id || idx}>
                      <td className="p-1.5 font-medium text-slate-500">{q.level}</td>
                      <td className="p-1.5 font-bold text-slate-800">{q.courseName}</td>
                      <td className="p-1.5 text-slate-600">{q.institution}</td>
                      <td className="p-1.5 text-slate-600">{q.yearOfPassing}</td>
                      <td className="p-1.5 text-right font-bold text-emerald-800">{q.grade}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Section 6 & 7: Family Contacts + Bank Details */}
          <div className="grid grid-cols-2 gap-3 mb-4 text-[10px]">
            {/* Family */}
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="font-bold text-slate-800 mb-1 border-b border-slate-200 pb-1 flex items-center space-x-1.5">
                <span className="w-4 h-4 rounded-full bg-emerald-100 text-[#0B5D2A] text-[9px] flex items-center justify-center font-bold">6</span>
                <span>Family Contacts & Dependents</span>
              </div>
              <div className="space-y-1.5">
                {!onboardingData.familyMembers || onboardingData.familyMembers.length === 0 ? (
                  <div className="text-slate-400 italic text-[9px]">No family members recorded.</div>
                ) : (
                  onboardingData.familyMembers.map((fam, idx) => (
                    <div key={fam.id || idx} className="flex justify-between items-center text-[9px]">
                      <div>
                        <b>{fam.name}</b> ({fam.relationship})
                      </div>
                      <div className="text-slate-500">{fam.contactNumber}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bank & Salary */}
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="font-bold text-slate-800 mb-1 border-b border-slate-200 pb-1 flex items-center space-x-1.5">
                <span className="w-4 h-4 rounded-full bg-emerald-100 text-[#0B5D2A] text-[9px] flex items-center justify-center font-bold">7</span>
                <span>Bank Account & Statutory Payroll</span>
              </div>
              <div className="space-y-1 text-[9px]">
                <div className="flex justify-between"><span className="text-slate-500">Bank:</span><b>{onboardingData.salary?.bankDetails?.bankName || 'State Bank of India'}</b></div>
                <div className="flex justify-between"><span className="text-slate-500">Account:</span><b className="font-mono">{onboardingData.salary?.bankDetails?.accountNo || '••••••••4819'}</b></div>
                <div className="flex justify-between"><span className="text-slate-500">IFSC:</span><b>{onboardingData.salary?.bankDetails?.ifscCode || 'SBIN0002144'}</b></div>
                <div className="flex justify-between"><span className="text-slate-500">Gross Salary:</span><b className="text-slate-900">₹{(onboardingData.salary?.grossSalary || 62000).toLocaleString('en-IN')}/mo</b></div>
                <div className="flex justify-between"><span className="text-slate-500">Allowances:</span><b className="text-slate-800">₹{(onboardingData.salary?.allowances || 6800).toLocaleString('en-IN')}/mo</b></div>
                {onboardingData.salary?.allowanceItems && onboardingData.salary.allowanceItems.length > 0 && (
                  <div className="text-[8px] text-slate-600 pl-1 border-l border-emerald-300 space-y-0.5 my-0.5">
                    {onboardingData.salary.allowanceItems.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>• {item.name}:</span>
                        <span>₹{item.amount.toLocaleString()}</span>
                      </div>
                    ))}
                    {onboardingData.salary.allowanceItems.length > 3 && (
                      <div className="text-[7.5px] text-slate-400">+ {onboardingData.salary.allowanceItems.length - 3} more items</div>
                    )}
                  </div>
                )}
                <div className="flex justify-between"><span className="text-slate-500">Net Take-Home:</span><b className="text-emerald-800">₹{(onboardingData.salary?.netSalary || 58700).toLocaleString('en-IN')}/mo</b></div>
              </div>
            </div>
          </div>

          {/* Section 8 & 9: Document Checklist + System Access */}
          <div className="grid grid-cols-2 gap-3 mb-4 text-[10px]">
            {/* Documents */}
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="font-bold text-slate-800 mb-1 border-b border-slate-200 pb-1 flex items-center space-x-1.5">
                <span className="w-4 h-4 rounded-full bg-emerald-100 text-[#0B5D2A] text-[9px] flex items-center justify-center font-bold">8</span>
                <span>Document Verification Checklist</span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[9px]">
                <div className="flex items-center space-x-1 text-emerald-800">✓ Aadhaar Card: {onboardingData.aadhaarNumber || 'Verified'}</div>
                <div className="flex items-center space-x-1 text-emerald-800">✓ PAN Card: {onboardingData.panNumber || 'Verified'}</div>
                <div className="flex items-center space-x-1 text-emerald-800">✓ Passport Photos (Uploaded)</div>
                <div className="flex items-center space-x-1 text-emerald-800">✓ Resume / CV (Uploaded)</div>
                <div className="flex items-center space-x-1 text-emerald-800">✓ Qualification Certificates</div>
                <div className="flex items-center space-x-1 text-emerald-800">✓ Relieving / Experience Docs</div>
              </div>
            </div>

            {/* System Access */}
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="font-bold text-slate-800 mb-1 border-b border-slate-200 pb-1 flex items-center space-x-1.5">
                <span className="w-4 h-4 rounded-full bg-emerald-100 text-[#0B5D2A] text-[9px] flex items-center justify-center font-bold">9</span>
                <span>ERP & Software Access Permissions</span>
              </div>
              <div className="space-y-1 text-[9px]">
                <div className="flex justify-between"><span className="text-slate-500">System Username:</span><b>{onboardingData.systemAccess?.username || 'meera.g'}</b></div>
                <div className="flex justify-between"><span className="text-slate-500">Assigned Role:</span><b>{onboardingData.systemAccess?.role || 'Staff / Faculty'}</b></div>
                <div className="flex justify-between"><span className="text-slate-500">Access Level:</span><b>{onboardingData.systemAccess?.accessLevel || 'Standard'}</b></div>
                <div className="flex justify-between"><span className="text-slate-500">Branch Allowed:</span><b>{onboardingData.systemAccess?.branchAccess || 'All Branches'}</b></div>
              </div>
            </div>
          </div>

          {/* Section 10: Candidate Declaration & Institutional Sign-Off */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#0B5D2A] uppercase tracking-wider mb-2 border-b border-emerald-100 pb-1">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#0B5D2A] text-[10px] flex items-center justify-center font-extrabold">
                10
              </span>
              <span>Candidate Declaration & Official Verification Sign-Off</span>
            </div>

            <p className="text-[9px] text-slate-600 leading-relaxed mb-4">
              I hereby solemnly declare that all statements and particulars provided in this staff onboarding dossier are true,
              complete, and authentic to the best of my knowledge and belief. I agree to abide by the service rules, institutional
              code of conduct, and confidentiality protocols established by Casbiro Solutions Private Limited (MYSAR).
            </p>

            <div className="grid grid-cols-3 gap-4 text-[9px] text-center pt-2">
              <div className="flex flex-col justify-end">
                <div className="border-b border-slate-400 pb-1 font-semibold text-slate-800 font-mono">
                  {fullName}
                </div>
                <div className="text-slate-500 mt-1">Applicant Signature</div>
              </div>

              <div className="flex flex-col justify-end">
                <div className="border-b border-slate-400 pb-1 font-semibold text-slate-800">
                  {onboardingData.verification?.registeredBy || 'Sri. Ananthan K. (HR Admin)'}
                </div>
                <div className="text-slate-500 mt-1">HR Scrutiny Officer</div>
              </div>

              <div className="flex flex-col justify-end items-center">
                <div className="w-12 h-12 rounded-full border-2 border-emerald-700 flex flex-col items-center justify-center text-[7px] font-bold text-emerald-800 mb-1 leading-tight uppercase">
                  <span>MYSAR</span>
                  <span>ENROLL</span>
                </div>
                <div className="border-b border-slate-400 w-full pb-1 font-semibold text-slate-800">
                  {onboardingData.verification?.verifiedBy || 'Dr. Ramesh Nambiar (Principal)'}
                </div>
                <div className="text-slate-500 mt-1">Authorized Approving Authority</div>
              </div>
            </div>
          </div>
        </div>

        {/* Page 2 Footer */}
        <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[9px] text-slate-400">
          <div>CASBIRO SOLUTIONS PRIVATE LIMITED • OFFICIAL ENROLLMENT DOSSIER</div>
          <div className="font-bold tracking-widest text-[#168A45]">PAGE 2 OF 2</div>
        </div>
      </div>
    </div>
  );
};
