import React from 'react';
import { StaffMember } from '../../types/hr';
import { storage } from '../../services/storageService';

interface PrintableStaffProfileProps {
  staff: StaffMember;
  id?: string;
}

export const PrintableStaffProfile: React.FC<PrintableStaffProfileProps> = ({
  staff,
  id = 'printable-staff-profile-doc',
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

  return (
    <div id={id} className="bg-slate-200 text-slate-800 font-sans select-none">
      {/* ======================= PAGE 1 ======================= */}
      <div className="hr-pdf-page w-[794px] h-[1123px] max-h-[1123px] bg-white relative flex flex-col justify-between overflow-hidden shadow-xl border border-slate-200 mx-auto text-xs p-10 box-border">
        {/* Top Institutional Header */}
        <div>
          <div className="flex items-center justify-between border-b-2 border-[#168A45] pb-4 mb-4">
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
                Official Staff Dossier
              </span>
              <div className="text-[10px] text-slate-500 font-mono font-medium">Ref: {staff.id}</div>
              <div className="text-[9px] text-slate-400">Generated: {currentDate}</div>
            </div>
          </div>

          {/* Staff Primary Identity Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/90 mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-xl bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center text-2xl font-black text-[#0B5D2A] shadow-xs shrink-0 overflow-hidden">
                {staff.profilePhoto ? (
                  <img
                    src={staff.profilePhoto}
                    alt={staff.fullName}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                ) : (
                  staff.fullName.charAt(0)
                )}
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                  {staff.fullName}
                </h2>
                <div className="text-xs font-bold text-emerald-800 mt-0.5">
                  {staff.position} • {staff.department} Department
                </div>
                <div className="text-[10px] text-slate-500 mt-1 flex items-center space-x-2">
                  <span><b>ID:</b> {staff.id}</span>
                  <span>•</span>
                  <span><b>Joined:</b> {staff.joiningDate}</span>
                  <span>•</span>
                  <span><b>Type:</b> {staff.employmentType}</span>
                </div>
              </div>
            </div>

            <div className="text-right space-y-1 text-[10px]">
              <div className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700">
                <b>Cadre:</b> {staff.employeeCategory || 'Academic & Admin'}
              </div>
              <div className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700">
                <b>Work Location:</b> {staff.workLocation || 'Main Campus'}
              </div>
            </div>
          </div>

          {/* Section 1: Personal & Contact Coordinates */}
          <div className="mb-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#0B5D2A] uppercase tracking-wider mb-2 border-b border-emerald-100 pb-1">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#0B5D2A] text-[10px] flex items-center justify-center font-extrabold">
                1
              </span>
              <span>Personal Coordinates & Demographics</span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-[10px]">
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/80">
                <div className="text-slate-400 font-medium">Date of Birth</div>
                <div className="font-bold text-slate-900 mt-0.5">{staff.dateOfBirth}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/80">
                <div className="text-slate-400 font-medium">Gender</div>
                <div className="font-bold text-slate-900 mt-0.5">{staff.gender}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/80">
                <div className="text-slate-400 font-medium">Blood Group</div>
                <div className="font-bold text-rose-700 mt-0.5">{staff.bloodGroup || 'O+ Positive'}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/80">
                <div className="text-slate-400 font-medium">Nationality & Marital</div>
                <div className="font-bold text-slate-900 mt-0.5">
                  {staff.nationality || 'Indian'} • {staff.maritalStatus || 'Married'}
                </div>
              </div>

              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/80">
                <div className="text-slate-400 font-medium">Primary Contact No</div>
                <div className="font-bold text-slate-900 mt-0.5">{staff.contactNumber}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/80">
                <div className="text-slate-400 font-medium">WhatsApp Number</div>
                <div className="font-bold text-slate-900 mt-0.5">{staff.whatsappNumber || staff.contactNumber}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/80">
                <div className="text-slate-400 font-medium">Personal Email</div>
                <div className="font-bold text-slate-900 mt-0.5 truncate">{staff.personalEmail || staff.email}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/80">
                <div className="text-slate-400 font-medium">Official Institutional Email</div>
                <div className="font-bold text-emerald-800 mt-0.5 truncate">{staff.email}</div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="mt-2 p-2.5 bg-rose-50/60 rounded-lg border border-rose-200/80 flex items-center justify-between text-[10px]">
              <div>
                <span className="font-bold text-rose-900 uppercase tracking-wide">Emergency Contact: </span>
                <span className="text-slate-800 font-semibold">
                  {staff.emergencyContact.name} ({staff.emergencyContact.relationship})
                </span>
              </div>
              <div className="font-bold text-rose-800 font-mono">{staff.emergencyContact.phone}</div>
            </div>
          </div>

          {/* Section 2: Residential Addresses */}
          <div className="mb-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#0B5D2A] uppercase tracking-wider mb-2 border-b border-emerald-100 pb-1">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#0B5D2A] text-[10px] flex items-center justify-center font-extrabold">
                2
              </span>
              <span>Residential Address Details</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[10px]">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                <div className="font-bold text-slate-800 mb-1">Permanent Residential Address</div>
                <div className="text-slate-600 leading-relaxed">
                  {staff.permanentAddress.addressLine1}
                  {staff.permanentAddress.addressLine2 ? `, ${staff.permanentAddress.addressLine2}` : ''},{' '}
                  {staff.permanentAddress.city}, {staff.permanentAddress.state} – {staff.permanentAddress.pinCode},{' '}
                  {staff.permanentAddress.country}
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                <div className="font-bold text-slate-800 mb-1">Communication / Present Address</div>
                <div className="text-slate-600 leading-relaxed">
                  {staff.communicationAddress.sameAsPermanent
                    ? 'Same as Permanent Residential Address.'
                    : `${staff.communicationAddress.addressLine1}, ${staff.communicationAddress.city}, ${staff.communicationAddress.state} – ${staff.communicationAddress.pinCode}`}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Salary, Bank & Statutory Payroll Details */}
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-[#0B5D2A] uppercase tracking-wider mb-2 border-b border-emerald-100 pb-1">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#0B5D2A] text-[10px] flex items-center justify-center font-extrabold">
                3
              </span>
              <span>Statutory Compensation & Bank Account</span>
            </div>

            <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/80 mb-2.5 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-emerald-800 font-semibold uppercase">Net Disbursed Monthly In-Hand</div>
                <div className="text-xl font-black text-emerald-950">
                  ₹{staff.salary.netSalary.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="text-right text-[10px] space-y-0.5">
                <div><span className="text-slate-500">Gross Earnings:</span> <b className="text-slate-800">₹{staff.salary.grossSalary.toLocaleString('en-IN')}</b></div>
                <div><span className="text-slate-500">Total Deductions:</span> <b className="text-rose-700">₹{staff.salary.totalDeductions.toLocaleString('en-IN')}</b></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[10px]">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1">
                <div className="font-bold text-slate-800 border-b border-slate-200 pb-1 mb-1">Earnings Structure</div>
                <div className="flex justify-between"><span className="text-slate-500">Basic Salary:</span><span className="font-semibold">₹{staff.salary.basicSalary.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">House Rent Allowance (HRA):</span><span className="font-semibold">₹{staff.salary.hra.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Total Allowances:</span><span className="font-semibold">₹{(staff.salary.allowances + staff.salary.specialAllowance).toLocaleString()}</span></div>
                {staff.salary.allowanceItems && staff.salary.allowanceItems.length > 0 && (
                  <div className="pt-1 border-t border-slate-200/60 text-[9px] text-slate-600 space-y-0.5">
                    {staff.salary.allowanceItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between pl-1">
                        <span>• {item.name}:</span>
                        <span className="font-mono">₹{item.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1">
                <div className="font-bold text-slate-800 border-b border-slate-200 pb-1 mb-1">Bank & Statutory Accounts</div>
                <div className="flex justify-between"><span className="text-slate-500">Bank:</span><span className="font-semibold truncate max-w-[140px]">{staff.salary.bankDetails.bankName}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Account No:</span><span className="font-semibold font-mono">{staff.salary.bankDetails.accountNo}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">IFSC / Branch:</span><span className="font-semibold">{staff.salary.bankDetails.ifscCode}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">PF / UAN:</span><span className="font-semibold font-mono text-[9px]">{staff.bankPayroll?.uan || '100984712093'}</span></div>
              </div>
            </div>
          </div>

          {/* Section 4: Academic & Professional Qualifications (Moved to Page 1 to eliminate bottom blank space) */}
          <div className="mt-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#0B5D2A] uppercase tracking-wider mb-2 border-b border-emerald-100 pb-1">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#0B5D2A] text-[10px] flex items-center justify-center font-extrabold">
                4
              </span>
              <span>Academic &amp; Professional Qualifications</span>
            </div>

            <table className="w-full text-left text-[10px] border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[9px]">
                <tr>
                  <th className="p-2 border-b border-slate-200">Level</th>
                  <th className="p-2 border-b border-slate-200">Course / Degree</th>
                  <th className="p-2 border-b border-slate-200">Institution / University</th>
                  <th className="p-2 border-b border-slate-200">Year</th>
                  <th className="p-2 border-b border-slate-200 text-right">Grade / Class</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!staff.qualifications || staff.qualifications.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-2.5 text-center text-slate-400 italic">
                      No qualification credentials cataloged.
                    </td>
                  </tr>
                ) : (
                  staff.qualifications.map((q, idx) => (
                    <tr key={q.id || idx}>
                      <td className="p-2 font-medium text-slate-500">{q.level}</td>
                      <td className="p-2 font-bold text-slate-800">
                        {q.courseName}
                        {q.specialization ? <span className="text-slate-400 font-normal"> ({q.specialization})</span> : ''}
                      </td>
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
        <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[9px] text-slate-400">
          <div className="uppercase">{parentCompanyLegalName} • STAFF REGISTRATION &amp; ONBOARDING • FOR HR ARCHIVE ONLY</div>
          <div className="font-bold tracking-widest text-[#168A45]">PAGE 1 OF 2</div>
        </div>
      </div>

      {/* ======================= PAGE 2 ======================= */}
      <div className="hr-pdf-page w-[794px] h-[1123px] max-h-[1123px] bg-white relative flex flex-col justify-between overflow-hidden shadow-xl border border-slate-200 mx-auto text-xs p-10 box-border mt-6">
        <div>
          {/* Page 2 Mini Header */}
          <div className="flex items-center justify-between border-b-2 border-[#168A45] pb-3 mb-4">
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
                  Staff Registration &amp; Onboarding • {staff.fullName} ({staff.id})
                </div>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 font-semibold">Page 2 of 2</div>
          </div>

          {/* Section 5: Previous Employment & Experience History */}
          <div className="mb-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#0B5D2A] uppercase tracking-wider mb-2 border-b border-emerald-100 pb-1">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#0B5D2A] text-[10px] flex items-center justify-center font-extrabold">
                5
              </span>
              <span>Prior Career & Employment Experience</span>
            </div>

            <table className="w-full text-left text-[10px] border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[9px]">
                <tr>
                  <th className="p-2 border-b border-slate-200">Organization</th>
                  <th className="p-2 border-b border-slate-200">Designation & Role</th>
                  <th className="p-2 border-b border-slate-200">Duration / Period</th>
                  <th className="p-2 border-b border-slate-200">Tenure</th>
                  <th className="p-2 border-b border-slate-200 text-right">Reason for Leaving</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!staff.experiences || staff.experiences.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-3 text-center text-slate-400 italic">
                      No previous organizational employment logged.
                    </td>
                  </tr>
                ) : (
                  staff.experiences.map((exp, idx) => (
                    <tr key={exp.id || idx}>
                      <td className="p-2 font-bold text-slate-800">{exp.organization}</td>
                      <td className="p-2 text-emerald-800 font-medium">{exp.designation}</td>
                      <td className="p-2 text-slate-600">{exp.dateOfJoining} to {exp.dateOfLeaving || 'Present'}</td>
                      <td className="p-2 font-medium text-slate-700">{exp.totalExperience || '—'}</td>
                      <td className="p-2 text-right text-slate-500">{exp.reasonForLeaving || 'Career progression'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Section 6: Family Contacts & Dependents */}
          <div className="mb-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#0B5D2A] uppercase tracking-wider mb-2 border-b border-emerald-100 pb-1">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#0B5D2A] text-[10px] flex items-center justify-center font-extrabold">
                6
              </span>
              <span>Family Contacts & Institutional Dependents</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              {!staff.familyMembers || staff.familyMembers.length === 0 ? (
                <div className="col-span-2 p-2.5 text-center text-slate-400 italic bg-slate-50 rounded-lg">
                  No family records on file.
                </div>
              ) : (
                staff.familyMembers.map((fam, idx) => (
                  <div key={fam.id || idx} className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">{fam.name}</div>
                      <div className="text-slate-500 text-[9px]">{fam.relationship} • {fam.contactNumber}</div>
                    </div>
                    <div className="space-x-1">
                      {fam.isEmergencyContact && (
                        <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-rose-100 text-rose-800">
                          Emergency
                        </span>
                      )}
                      {fam.isDependent && (
                        <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-emerald-100 text-emerald-800">
                          Dependent
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section 7: Verified Documents & Attendance / Performance Summary */}
          <div className="grid grid-cols-2 gap-3 mb-4 text-[10px]">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="font-bold text-slate-800 mb-1 border-b border-slate-200 pb-1">
                Verified Document Registry ({staff.documents?.length || 0})
              </div>
              <div className="space-y-1">
                {staff.documents?.slice(0, 4).map((d) => (
                  <div key={d.id} className="flex justify-between items-center text-[9px]">
                    <span className="text-slate-700 font-medium truncate max-w-[170px]">{d.category} ({d.fileName})</span>
                    <span className="font-bold text-emerald-800 bg-emerald-100 px-1 rounded">{d.verificationStatus}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="font-bold text-slate-800 mb-1 border-b border-slate-200 pb-1">
                Institutional Performance & Attendance
              </div>
              <div className="space-y-1 text-[9px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Overall KPI Index:</span>
                  <span className="font-bold text-emerald-800">{staff.overallKpiScore || 90}% (Exemplary)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Attendance Today:</span>
                  <span className="font-bold text-emerald-700">{staff.todayAttendanceStatus || 'Present'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ERP Access Level:</span>
                  <span className="font-semibold text-slate-700">{staff.systemAccess?.accessLevel || 'Standard'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 8: Institutional Verification Sign-Off & Official Seal */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-2">
            <div className="text-[10px] font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-200 pb-1 flex justify-between">
              <span>Official Verification & Sign-Off Authorization</span>
              <span className="text-emerald-700 font-bold">STATUS: VERIFIED & APPROVED</span>
            </div>

            <div className="grid grid-cols-3 gap-4 text-[9px] text-center pt-2">
              <div className="flex flex-col justify-end">
                <div className="border-b border-slate-400 pb-1 font-semibold text-slate-800 font-mono">
                  {staff.fullName}
                </div>
                <div className="text-slate-500 mt-1">Staff Signature</div>
              </div>

              <div className="flex flex-col justify-end">
                <div className="border-b border-slate-400 pb-1 font-semibold text-slate-800">
                  {staff.verification?.registeredBy || 'Sri. Ananthan K. (HR Admin)'}
                </div>
                <div className="text-slate-500 mt-1">HR Administrator</div>
              </div>

              <div className="flex flex-col justify-end items-center">
                <div className="w-14 h-14 rounded-full border-2 border-emerald-700 flex flex-col items-center justify-center text-[7px] font-bold text-emerald-800 mb-1 leading-tight uppercase">
                  <span>MYSAR</span>
                  <span className="text-[6px]">SEAL</span>
                  <span>VERIFIED</span>
                </div>
                <div className="border-b border-slate-400 w-full pb-1 font-semibold text-slate-800">
                  {staff.verification?.verifiedBy || 'Dr. Ramesh Nambiar (Principal)'}
                </div>
                <div className="text-slate-500 mt-1">Authorized Signatory & Seal</div>
              </div>
            </div>
          </div>
        </div>

        {/* Page 2 Footer */}
        <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[9px] text-slate-400">
          <div>CASBIRO SOLUTIONS PRIVATE LIMITED • CONFIDENTIAL STAFF DOSSIER</div>
          <div className="font-bold tracking-widest text-[#168A45]">PAGE 2 OF 2</div>
        </div>
      </div>
    </div>
  );
};
