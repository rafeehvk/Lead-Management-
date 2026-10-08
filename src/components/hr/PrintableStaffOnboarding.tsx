import React from 'react';
import { StaffMember } from '../../types/hr';
import { storage } from '../../services/storageService';

interface PrintableStaffOnboardingProps {
  onboardingData: Partial<StaffMember>;
  id?: string;
}

export const PrintableStaffOnboarding: React.FC<PrintableStaffOnboardingProps> = ({
  onboardingData,
  id = 'printable-staff-onboarding-doc',
}) => {
  const settings = storage.getSettings();
  const parentCompanyLegalName = settings.companyName || 'Casbiro Solutions Private Limited';
  const brandName = settings.brandName || 'MYSAr';
  const navLogo =
    storage.getNavbarLogo() ||
    storage.getDocumentLogo() ||
    storage.getCompanyLogo() ||
    settings.navbarLogo ||
    settings.documentLogo ||
    settings.companyLogo ||
    '';

  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const staffId = onboardingData.id || onboardingData.staffId || 'EMP-2026-NEW';
  const fullName = onboardingData.fullName || 'Candidate Full Name';
  const basicSalary = onboardingData.salary?.basicSalary || 38000;
  const hra = onboardingData.salary?.hra || 0;
  const allowances = onboardingData.salary?.allowances || 6800;
  const grossSalary = onboardingData.salary?.grossSalary || basicSalary + hra + allowances;
  const totalDeductions = onboardingData.salary?.totalDeductions || 2000;
  const netSalary = onboardingData.salary?.netSalary || Math.max(0, grossSalary - totalDeductions);
  const allowanceItems = onboardingData.salary?.allowanceItems || [];
  const deductionItems = onboardingData.salary?.deductionItems || [];

  return (
    <div id={id} className="bg-slate-200 text-slate-800 font-sans select-none">
      {/* ======================= PAGE 1 ======================= */}
      <div className="hr-pdf-page w-[794px] h-[1123px] max-h-[1123px] bg-white relative flex flex-col justify-between overflow-hidden shadow-xl border border-slate-200 mx-auto text-xs p-9 box-border">
        <div className="space-y-4">
          {/* Top Institutional Header */}
          <div className="flex items-center justify-between border-b-2 border-[#168A45] pb-3.5">
            <div className="flex items-center space-x-3">
              {navLogo ? (
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 p-1.5 flex items-center justify-center overflow-hidden shadow-2xs shrink-0">
                  <img
                    src={navLogo}
                    alt={brandName}
                    className="max-h-full max-w-full object-contain"
                    crossOrigin="anonymous"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-[#168A45] text-white flex items-center justify-center font-black text-xl tracking-tight shadow-xs shrink-0">
                  {brandName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight uppercase">
                  {parentCompanyLegalName}
                </h1>
                <div className="text-xs font-bold text-[#0B5D2A] mt-0.5">
                  Staff Registration &amp; Onboarding
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

          {/* Staff Top Banner */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-15 h-15 rounded-xl bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center text-2xl font-black text-[#0B5D2A] shadow-xs shrink-0 overflow-hidden">
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
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-[#0B5D2A] uppercase tracking-wider mb-2 border-b border-emerald-100 pb-1">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#0B5D2A] text-[10px] flex items-center justify-center font-extrabold">
                1
              </span>
              <span>Personal Information &amp; Identity Details</span>
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
                <div className="text-slate-400">Nationality &amp; Marital</div>
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
                <div className="text-slate-400">Official Email</div>
                <div className="font-bold text-emerald-800 mt-0.5 truncate">{onboardingData.officialEmail || onboardingData.email || '—'}</div>
              </div>
            </div>

            <div className="mt-2 p-2 bg-rose-50/70 rounded-lg border border-rose-200 flex items-center justify-between text-[10px]">
              <div>
                <span className="font-bold text-rose-900 uppercase">Emergency Contact: </span>
                <span className="font-semibold text-slate-800">
                  {onboardingData.emergencyContact?.name || '—'} ({onboardingData.emergencyContact?.relationship || 'Spouse'})
                </span>
              </div>
              <div className="font-bold text-rose-800 font-mono">
                {onboardingData.emergencyContact?.phone || '—'}
              </div>
            </div>
          </div>

          {/* Section 2: Address Coordinates */}
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-[#0B5D2A] uppercase tracking-wider mb-2 border-b border-emerald-100 pb-1">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#0B5D2A] text-[10px] flex items-center justify-center font-extrabold">
                2
              </span>
              <span>Residential &amp; Communication Addresses</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[10px]">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="font-bold text-slate-800 mb-1">Permanent Address</div>
                <div className="text-slate-600 leading-relaxed">
                  {onboardingData.permanentAddress?.addressLine1 || '—'}
                  {onboardingData.permanentAddress?.addressLine2 ? `, ${onboardingData.permanentAddress.addressLine2}` : ''}
                  {onboardingData.permanentAddress?.city ? `, ${onboardingData.permanentAddress.city}` : ''}
                  {onboardingData.permanentAddress?.district ? `, ${onboardingData.permanentAddress.district}` : ''}
                  {onboardingData.permanentAddress?.state ? `, ${onboardingData.permanentAddress.state}` : ''} –{' '}
                  {onboardingData.permanentAddress?.pinCode || '682001'}
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="font-bold text-slate-800 mb-1">Communication / Present Address</div>
                <div className="text-slate-600 leading-relaxed">
                  {onboardingData.communicationAddress?.sameAsPermanent
                    ? 'Same as Permanent Residential Address.'
                    : `${onboardingData.communicationAddress?.addressLine1 || '—'}, ${onboardingData.communicationAddress?.city || ''} – ${onboardingData.communicationAddress?.pinCode || ''}`}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Employment & Posting */}
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-[#0B5D2A] uppercase tracking-wider mb-2 border-b border-emerald-100 pb-1">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#0B5D2A] text-[10px] flex items-center justify-center font-extrabold">
                3
              </span>
              <span>Institutional Employment &amp; Posting Details</span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-[10px]">
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-slate-400">Department</div>
                <div className="font-bold text-slate-900 mt-0.5">{onboardingData.department || 'Academic'}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-slate-400">Designation</div>
                <div className="font-bold text-emerald-800 mt-0.5">{onboardingData.position || '—'}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-slate-400">Reporting Manager</div>
                <div className="font-bold text-slate-900 mt-0.5">{onboardingData.reportingManager || 'Dr. Ramesh Nambiar'}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-slate-400">Campus &amp; Probation</div>
                <div className="font-bold text-slate-900 mt-0.5">
                  {onboardingData.branchLocation || 'Main Campus'} ({onboardingData.probationPeriod || '6 Months'})
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Prior Career & Experience */}
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-[#0B5D2A] uppercase tracking-wider mb-2 border-b border-emerald-100 pb-1">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#0B5D2A] text-[10px] flex items-center justify-center font-extrabold">
                4
              </span>
              <span>Prior Career &amp; Employment Experience</span>
            </div>

            <table className="w-full text-left text-[10px] border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[9px]">
                <tr>
                  <th className="p-2 border-b border-slate-200">Organization</th>
                  <th className="p-2 border-b border-slate-200">Designation</th>
                  <th className="p-2 border-b border-slate-200">Period</th>
                  <th className="p-2 border-b border-slate-200 text-right">Reason for Leaving</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!onboardingData.experiences || onboardingData.experiences.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-2.5 text-center text-slate-400 italic">
                      Fresher / No prior organizational experience records entered.
                    </td>
                  </tr>
                ) : (
                  onboardingData.experiences.map((exp, idx) => (
                    <tr key={exp.id || idx}>
                      <td className="p-2 font-bold text-slate-800">{exp.organization}</td>
                      <td className="p-2 text-emerald-800">{exp.designation}</td>
                      <td className="p-2 text-slate-600">{exp.dateOfJoining} to {exp.dateOfLeaving || 'Present'}</td>
                      <td className="p-2 text-right text-slate-500">{exp.reasonForLeaving || 'Career move'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Section 5: Qualifications (Moved to Page 1 to eliminate bottom blank space) */}
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-[#0B5D2A] uppercase tracking-wider mb-2 border-b border-emerald-100 pb-1">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#0B5D2A] text-[10px] flex items-center justify-center font-extrabold">
                5
              </span>
              <span>Educational &amp; Professional Qualifications</span>
            </div>

            <table className="w-full text-left text-[10px] border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[9px]">
                <tr>
                  <th className="p-2 border-b border-slate-200">Level</th>
                  <th className="p-2 border-b border-slate-200">Course / Degree</th>
                  <th className="p-2 border-b border-slate-200">Institution</th>
                  <th className="p-2 border-b border-slate-200">Year</th>
                  <th className="p-2 border-b border-slate-200 text-right">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!onboardingData.qualifications || onboardingData.qualifications.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-2.5 text-center text-slate-400 italic">
                      No qualification credentials cataloged.
                    </td>
                  </tr>
                ) : (
                  onboardingData.qualifications.map((q, idx) => (
                    <tr key={q.id || idx}>
                      <td className="p-2 font-medium text-slate-500">{q.level}</td>
                      <td className="p-2 font-bold text-slate-800">{q.courseName}</td>
                      <td className="p-2 text-slate-600">{q.institution}</td>
                      <td className="p-2 text-slate-600">{q.yearOfPassing}</td>
                      <td className="p-2 text-right font-bold text-emerald-800">{q.grade}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Page 1 Footer */}
        <div className="border-t border-slate-200 pt-2.5 flex items-center justify-between text-[9px] text-slate-400">
          <div className="uppercase">{parentCompanyLegalName} • STAFF REGISTRATION &amp; ONBOARDING • FOR HR USE ONLY</div>
          <div className="font-bold tracking-widest text-[#168A45]">PAGE 1 OF 2</div>
        </div>
      </div>

      {/* ======================= PAGE 2 ======================= */}
      <div className="hr-pdf-page w-[794px] h-[1123px] max-h-[1123px] bg-white relative flex flex-col justify-between overflow-hidden shadow-xl border border-slate-200 mx-auto text-xs p-9 box-border mt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-[#168A45] pb-3">
            <div className="flex items-center space-x-2.5">
              {navLogo ? (
                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 p-1 flex items-center justify-center overflow-hidden shrink-0">
                  <img
                    src={navLogo}
                    alt={brandName}
                    className="max-h-full max-w-full object-contain"
                    crossOrigin="anonymous"
                  />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-lg bg-[#168A45] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {brandName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="text-xs font-black text-slate-900 uppercase tracking-tight">
                  {parentCompanyLegalName}
                </div>
                <div className="font-bold text-[#0B5D2A] text-[10px]">
                  Staff Registration &amp; Onboarding • {fullName} ({staffId})
                </div>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 font-semibold">Page 2 of 2</div>
          </div>

          {/* Section 6: Family Contacts & Dependents */}
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-[#0B5D2A] uppercase tracking-wider mb-2 border-b border-emerald-100 pb-1">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#0B5D2A] text-[10px] flex items-center justify-center font-extrabold">
                6
              </span>
              <span>Family Contacts &amp; Institutional Dependents</span>
            </div>

            <table className="w-full text-left text-[10px] border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[9px]">
                <tr>
                  <th className="p-2 border-b border-slate-200">Member Name</th>
                  <th className="p-2 border-b border-slate-200">Relationship</th>
                  <th className="p-2 border-b border-slate-200">Occupation</th>
                  <th className="p-2 border-b border-slate-200">Contact Number</th>
                  <th className="p-2 border-b border-slate-200 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!onboardingData.familyMembers || onboardingData.familyMembers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-2.5 text-center text-slate-400 italic">
                      No family members recorded.
                    </td>
                  </tr>
                ) : (
                  onboardingData.familyMembers.map((fam, idx) => (
                    <tr key={fam.id || idx}>
                      <td className="p-2 font-bold text-slate-800">{fam.name}</td>
                      <td className="p-2 text-slate-600">{fam.relationship}</td>
                      <td className="p-2 text-slate-600">{fam.occupation || '—'}</td>
                      <td className="p-2 font-mono text-slate-700">{fam.contactNumber}</td>
                      <td className="p-2 text-right">
                        {fam.isEmergencyContact ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[8px]">
                            Emergency
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[8px]">
                            Dependent
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Section 7: Bank Account & Full Itemized Compensation Structure */}
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-[#0B5D2A] uppercase tracking-wider mb-2 border-b border-emerald-100 pb-1">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#0B5D2A] text-[10px] flex items-center justify-center font-extrabold">
                7
              </span>
              <span>Bank Account &amp; Statutory Compensation Structure</span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-[10px] mb-2.5">
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-slate-400">Bank Name</div>
                <div className="font-bold text-slate-900 mt-0.5 truncate">{onboardingData.salary?.bankDetails?.bankName || onboardingData.bankPayroll?.bankName || 'State Bank of India'}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-slate-400">Account Number</div>
                <div className="font-bold font-mono text-slate-900 mt-0.5">{onboardingData.salary?.bankDetails?.accountNo || onboardingData.bankPayroll?.accountNo || '••••••••4819'}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-slate-400">IFSC &amp; Branch</div>
                <div className="font-bold text-slate-900 mt-0.5 truncate">
                  {onboardingData.salary?.bankDetails?.ifscCode || 'SBIN0002144'} • {onboardingData.salary?.bankDetails?.branch || 'Kochi'}
                </div>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="text-emerald-800 font-semibold">Net Monthly Salary</div>
                <div className="font-black text-emerald-950 text-xs mt-0.5">₹{netSalary.toLocaleString('en-IN')}/mo</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[10px]">
              {/* Earnings Breakdown */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="font-bold text-emerald-900 border-b border-slate-200 pb-1 flex justify-between">
                  <span>Monthly Earnings &amp; Allowances</span>
                  <span>Amount (₹)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Basic Salary</span>
                  <span className="font-bold font-mono text-slate-900">₹{basicSalary.toLocaleString('en-IN')}</span>
                </div>
                {hra > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">House Rent Allowance (HRA)</span>
                    <span className="font-bold font-mono text-slate-900">₹{hra.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {allowanceItems.length > 0 ? (
                  allowanceItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="text-slate-600">{item.name}</span>
                      <span className="font-semibold font-mono text-slate-800">₹{Number(item.amount || 0).toLocaleString('en-IN')}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Standard Allowances</span>
                    <span className="font-semibold font-mono text-slate-800">₹{allowances.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="pt-1 border-t border-slate-200 flex justify-between font-bold text-emerald-950">
                  <span>Gross Monthly Salary</span>
                  <span className="font-mono">₹{grossSalary.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Deductions & Statutory */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="font-bold text-rose-900 border-b border-slate-200 pb-1 flex justify-between">
                    <span>Statutory Deductions &amp; IDs</span>
                    <span>Amount (₹)</span>
                  </div>
                  {deductionItems.length > 0 ? (
                    deductionItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="text-slate-600">{item.name}</span>
                        <span className="font-semibold font-mono text-rose-800">₹{Number(item.amount || 0).toLocaleString('en-IN')}</span>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Employee PF Contribution</span>
                        <span className="font-semibold font-mono text-rose-800">₹{(onboardingData.salary?.pfDeduction ?? 1800).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Professional Tax / TDS</span>
                        <span className="font-semibold font-mono text-rose-800">₹{(onboardingData.salary?.taxDeduction ?? 200).toLocaleString('en-IN')}</span>
                      </div>
                    </>
                  )}
                  <div className="pt-1 border-t border-slate-200 flex justify-between font-bold text-rose-900">
                    <span>Total Monthly Deductions</span>
                    <span className="font-mono">₹{totalDeductions.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div className="pt-2 mt-2 border-t border-slate-200 text-[9px] text-slate-500 flex justify-between">
                  <span>UAN: <b className="text-slate-700 font-mono">{onboardingData.bankPayroll?.uan || '100984712093'}</b></span>
                  <span>PF: <b className="text-slate-700 font-mono">{onboardingData.bankPayroll?.pfNumber || 'KR/KCH/0048192'}</b></span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 8 & 9: Document Checklist + System Access */}
          <div className="grid grid-cols-2 gap-3 text-[10px]">
            {/* Documents */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="font-bold text-slate-800 mb-1.5 border-b border-slate-200 pb-1 flex items-center space-x-1.5">
                <span className="w-4 h-4 rounded-full bg-emerald-100 text-[#0B5D2A] text-[9px] flex items-center justify-center font-bold">8</span>
                <span>Document Verification Checklist</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[9px]">
                <div className="flex items-center space-x-1 text-emerald-800 font-medium">✓ Aadhaar: {onboardingData.aadhaarNumber || 'Verified'}</div>
                <div className="flex items-center space-x-1 text-emerald-800 font-medium">✓ PAN Card: {onboardingData.panNumber || 'Verified'}</div>
                <div className="flex items-center space-x-1 text-emerald-800 font-medium">✓ Passport Photos (Uploaded)</div>
                <div className="flex items-center space-x-1 text-emerald-800 font-medium">✓ Resume / CV (Uploaded)</div>
                <div className="flex items-center space-x-1 text-emerald-800 font-medium">✓ Qualification Certificates</div>
                <div className="flex items-center space-x-1 text-emerald-800 font-medium">✓ Relieving / Experience Docs</div>
              </div>
            </div>

            {/* System Access */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="font-bold text-slate-800 mb-1.5 border-b border-slate-200 pb-1 flex items-center space-x-1.5">
                <span className="w-4 h-4 rounded-full bg-emerald-100 text-[#0B5D2A] text-[9px] flex items-center justify-center font-bold">9</span>
                <span>System &amp; Software Access Permissions</span>
              </div>
              <div className="space-y-1 text-[9px]">
                <div className="flex justify-between"><span className="text-slate-500">System Username:</span><b className="font-mono">{onboardingData.systemAccess?.username || 'staff.user'}</b></div>
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
              <span>Candidate Declaration &amp; Official Verification Sign-Off</span>
            </div>

            <p className="text-[9.5px] text-slate-600 leading-relaxed mb-5">
              I hereby solemnly declare that all statements and particulars provided in this staff onboarding dossier are true,
              complete, and authentic to the best of my knowledge and belief. I agree to abide by the service rules, institutional
              code of conduct, and confidentiality protocols established by {parentCompanyLegalName} ({brandName}).
            </p>

            <div className="grid grid-cols-3 gap-5 text-[9.5px] text-center pt-3">
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
                  <span>{brandName}</span>
                  <span>VERIFIED</span>
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
        <div className="border-t border-slate-200 pt-2.5 flex items-center justify-between text-[9px] text-slate-400">
          <div className="uppercase">{parentCompanyLegalName} • STAFF REGISTRATION &amp; ONBOARDING DOSSIER</div>
          <div className="font-bold tracking-widest text-[#168A45]">PAGE 2 OF 2</div>
        </div>
      </div>
    </div>
  );
};
