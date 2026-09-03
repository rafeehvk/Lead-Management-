import React, { useState } from 'react';
import {
  X,
  User,
  MapPin,
  Briefcase,
  Award,
  GraduationCap,
  Users,
  CreditCard,
  FileText,
  Shield,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Upload,
  Check,
  Building,
  Calendar,
  Phone,
  Mail,
  Lock,
  Sparkles,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import {
  StaffMember,
  EmploymentType,
  EmploymentStatus,
  StaffExperienceRecord,
  StaffQualificationRecord,
  StaffFamilyContact,
  StaffSalaryDetails,
  StaffDocument,
} from '../../types/hr';

interface StaffRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (staffData: Partial<StaffMember>) => void;
  existingStaffCount: number;
}

type TabKey =
  | 'personal'
  | 'address'
  | 'employment'
  | 'experience'
  | 'qualifications'
  | 'family'
  | 'bankPayroll'
  | 'documents'
  | 'systemAccess'
  | 'verification';

interface TabConfig {
  key: TabKey;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
}

const TABS: TabConfig[] = [
  { key: 'personal', label: '1. Personal Information', shortLabel: 'Personal', icon: User },
  { key: 'address', label: '2. Address Information', shortLabel: 'Address', icon: MapPin },
  { key: 'employment', label: '3. Employment Details', shortLabel: 'Employment', icon: Briefcase },
  { key: 'experience', label: '4. Experience History', shortLabel: 'Experience', icon: Award },
  { key: 'qualifications', label: '5. Qualifications', shortLabel: 'Qualifications', icon: GraduationCap },
  { key: 'family', label: '6. Family Contacts', shortLabel: 'Family', icon: Users },
  { key: 'bankPayroll', label: '7. Bank & Payroll', shortLabel: 'Bank & Payroll', icon: CreditCard },
  { key: 'documents', label: '8. Documents', shortLabel: 'Documents', icon: FileText },
  { key: 'systemAccess', label: '9. System & Access', shortLabel: 'System Access', icon: Shield },
  { key: 'verification', label: '10. Verification & Sign-off', shortLabel: 'Verification', icon: CheckCircle2 },
];

export const StaffRegistrationModal: React.FC<StaffRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingStaffCount,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('personal');

  // Auto-generate next employee ID
  const nextId = `EMP-2026-${String(existingStaffCount + 1).padStart(3, '0')}`;

  // 1. Personal Information State
  const [staffId, setStaffId] = useState(nextId);
  const [fullName, setFullName] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Female');
  const [dateOfBirth, setDateOfBirth] = useState('1994-06-15');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [nationality, setNationality] = useState('Indian');
  const [maritalStatus, setMaritalStatus] = useState<'Single' | 'Married' | 'Divorced' | 'Widowed'>('Married');
  const [personalEmail, setPersonalEmail] = useState('');
  const [officialEmail, setOfficialEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyRelationship, setEmergencyRelationship] = useState('Spouse');

  // 2. Address Information State
  const [permanentAddress, setPermanentAddress] = useState({
    addressLine1: '',
    addressLine2: '',
    city: '',
    district: 'Ernakulam',
    state: 'Kerala',
    country: 'India',
    pinCode: '',
  });

  const [sameAsPermanent, setSameAsPermanent] = useState(true);
  const [communicationAddress, setCommunicationAddress] = useState({
    addressLine1: '',
    addressLine2: '',
    city: '',
    district: 'Ernakulam',
    state: 'Kerala',
    country: 'India',
    pinCode: '',
  });

  // 3. Employment Information State
  const [dateOfJoining, setDateOfJoining] = useState(new Date().toISOString().split('T')[0]);
  const [department, setDepartment] = useState('Academic');
  const [position, setPosition] = useState('');
  const [employeeCategory, setEmployeeCategory] = useState<'Administrator' | 'Manager' | 'Accountant' | 'CSR' | 'Marketing' | 'Sales' | 'Other'>('Administrator');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('Full Time');
  const [branchLocation, setBranchLocation] = useState('Kochi Main Campus');
  const [reportingManager, setReportingManager] = useState('Dr. Ramesh Nambiar');
  const [workLocation, setWorkLocation] = useState('On-site (Campus Wing A)');
  const [previousEmployeeId, setPreviousEmployeeId] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState<EmploymentStatus>('Active');
  const [probationPeriod, setProbationPeriod] = useState('6 Months');

  // 4. Experience Information State (Multiple Records)
  const [experiences, setExperiences] = useState<StaffExperienceRecord[]>([
    {
      id: 'exp-1',
      organization: 'St. Teresa Higher Secondary Institute',
      designation: 'Senior Faculty & Department Coordinator',
      department: 'Academic',
      employmentType: 'Full Time',
      dateOfJoining: '2021-06-01',
      dateOfLeaving: '2024-04-30',
      totalExperience: '2 Years 11 Months',
      reasonForLeaving: 'Career Growth & Institutional Leadership',
      certificateDoc: 'Experience_Certificate_StTeresa.pdf',
      remarks: 'Exemplary service record with high academic student ratings.',
    },
  ]);

  // 5. Qualifications State (Multiple Records)
  const [qualifications, setQualifications] = useState<StaffQualificationRecord[]>([
    {
      id: 'qual-1',
      level: 'Postgraduate',
      courseName: 'M.Sc. Mathematics & Statistics',
      specialization: 'Applied Statistics',
      institution: 'University of Kerala',
      yearOfPassing: '2019',
      grade: 'Distinction (86.4%)',
      certificateDoc: 'MSc_Certificate_KeralaUniv.pdf',
      remarks: 'First class with university ranking.',
    },
    {
      id: 'qual-2',
      level: 'Undergraduate',
      courseName: 'B.Sc. Mathematics',
      specialization: 'Pure Mathematics',
      institution: 'Mahatma Gandhi University',
      yearOfPassing: '2016',
      grade: '82%',
      certificateDoc: 'BSc_Degree_Certificate.pdf',
      remarks: 'Major in Real Analysis and Algebra.',
    },
  ]);

  // 6. Family Contact Information (Multiple Records)
  const [familyMembers, setFamilyMembers] = useState<StaffFamilyContact[]>([
    {
      id: 'fam-1',
      name: 'Dr. Suresh Varma',
      relationship: 'Spouse',
      dateOfBirth: '1992-03-22',
      contactNumber: '+91 98460 11223',
      whatsappNumber: '+91 98460 11223',
      email: 'suresh.varma@gmail.com',
      occupation: 'Medical Practitioner',
      address: 'Near Civil Station, Kakkanad, Kochi',
      isEmergencyContact: true,
      isDependent: false,
    },
  ]);

  // 7. Bank & Payroll State
  const [bankName, setBankName] = useState('State Bank of India');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [ifscCode, setIfscCode] = useState('SBIN0002144');
  const [bankBranch, setBankBranch] = useState('Edappally, Kochi');
  const [uan, setUan] = useState('100984712093');
  const [pfNumber, setPfNumber] = useState('KR/KCH/0048192/000/1209');
  const [esiNumber, setEsiNumber] = useState('4800918234001');
  const [basicSalary, setBasicSalary] = useState(38000);
  const [hra, setHra] = useState(15200);
  const [allowances, setAllowances] = useState(6800);
  const [specialAllowance, setSpecialAllowance] = useState(2000);
  const [pfDeduction, setPfDeduction] = useState(1800);
  const [taxDeduction, setTaxDeduction] = useState(1500);

  // Computed Salary Values
  const grossSalary = basicSalary + hra + allowances + specialAllowance;
  const totalDeductions = pfDeduction + taxDeduction;
  const netSalary = grossSalary - totalDeductions;

  // 8. Documents State
  const [aadhaarNumber, setAadhaarNumber] = useState('•••• •••• 9812');
  const [panNumber, setPanNumber] = useState('ABCDE1234F');
  const [uploadedDocs, setUploadedDocs] = useState<{ [key: string]: boolean }>({
    aadhaar: true,
    pan: true,
    passportPhoto: true,
    resume: true,
    experienceCert: true,
    qualificationCert: true,
    joiningDocs: true,
  });

  // 9. System & Access Information State
  const [enableLogin, setEnableLogin] = useState(true);
  const [systemUsername, setSystemUsername] = useState('');
  const [systemRole, setSystemRole] = useState('Staff');
  const [accessLevel, setAccessLevel] = useState<'Read-Only' | 'Standard' | 'Manager' | 'Administrator' | 'Super Admin'>('Standard');
  const [assignedModules, setAssignedModules] = useState<string[]>([
    'Dashboard',
    'HR & Staff Directory',
    'Attendance & Leave',
  ]);
  const [systemBranchAccess, setSystemBranchAccess] = useState('Kochi Main Campus');
  const [accountStatus, setAccountStatus] = useState<'Active' | 'Pending' | 'Suspended'>('Active');

  // 10. Registration & Verification State
  const [registrationDate, setRegistrationDate] = useState(new Date().toISOString().split('T')[0]);
  const [registeredBy, setRegisteredBy] = useState('HR Admin - Sri. Ananthan K.');
  const [verificationStatus, setVerificationStatus] = useState<'Pending' | 'Verified' | 'Under Review' | 'Rejected'>('Verified');
  const [verifiedBy, setVerifiedBy] = useState('Dr. Ramesh Nambiar (Principal)');
  const [verificationDate, setVerificationDate] = useState(new Date().toISOString().split('T')[0]);
  const [registrationRemarks, setRegistrationRemarks] = useState(
    'All original credentials, certificates and background clearances thoroughly cross-checked and approved.'
  );

  // Pre-fill quick demo data for easy testing
  const handlePreloadDemo = () => {
    setFullName('Smt. Meera Gopikrishnan');
    setPersonalEmail('meera.gopi@gmail.com');
    setOfficialEmail('meera.g@mysar.org');
    setContactNumber('+91 94471 28930');
    setWhatsappNumber('+91 94471 28930');
    setEmergencyPhone('+91 98460 11223');
    setEmergencyContactName('Dr. Suresh Varma');
    setEmergencyRelationship('Spouse');
    setPermanentAddress({
      addressLine1: 'Villa No. 14, Lotus Gardens',
      addressLine2: 'Kakkanad SEZ Road',
      city: 'Kochi',
      district: 'Ernakulam',
      state: 'Kerala',
      country: 'India',
      pinCode: '682030',
    });
    setSameAsPermanent(true);
    setPosition('Assistant Professor & Coordinator');
    setDepartment('Academic');
    setEmployeeCategory('Administrator');
    setEmploymentType('Full Time');
    setAccountHolderName('Meera Gopikrishnan');
    setAccountNo('309481920481');
    setSystemUsername('meera.g');
  };

  // Multiple Records Handlers: Experience
  const handleAddExperience = () => {
    const newExp: StaffExperienceRecord = {
      id: `exp-${Date.now()}`,
      organization: '',
      designation: '',
      department: 'General',
      employmentType: 'Full Time',
      dateOfJoining: '',
      dateOfLeaving: '',
      totalExperience: '',
      reasonForLeaving: '',
      remarks: '',
    };
    setExperiences([...experiences, newExp]);
  };

  const handleUpdateExperience = (index: number, field: keyof StaffExperienceRecord, value: string) => {
    const updated = [...experiences];
    updated[index] = { ...updated[index], [field]: value };
    setExperiences(updated);
  };

  const handleRemoveExperience = (index: number) => {
    setExperiences(experiences.filter((_, idx) => idx !== index));
  };

  // Multiple Records Handlers: Qualifications
  const handleAddQualification = () => {
    const newQual: StaffQualificationRecord = {
      id: `qual-${Date.now()}`,
      level: 'Undergraduate',
      courseName: '',
      specialization: '',
      institution: '',
      yearOfPassing: '',
      grade: '',
      remarks: '',
    };
    setQualifications([...qualifications, newQual]);
  };

  const handleUpdateQualification = (index: number, field: keyof StaffQualificationRecord, value: string) => {
    const updated = [...qualifications];
    updated[index] = { ...updated[index], [field]: value };
    setQualifications(updated);
  };

  const handleRemoveQualification = (index: number) => {
    setQualifications(qualifications.filter((_, idx) => idx !== index));
  };

  // Multiple Records Handlers: Family Contacts
  const handleAddFamilyMember = () => {
    const newFam: StaffFamilyContact = {
      id: `fam-${Date.now()}`,
      name: '',
      relationship: 'Parent',
      contactNumber: '',
      whatsappNumber: '',
      occupation: '',
      isEmergencyContact: false,
      isDependent: false,
    };
    setFamilyMembers([...familyMembers, newFam]);
  };

  const handleUpdateFamilyMember = (index: number, field: keyof StaffFamilyContact, value: any) => {
    const updated = [...familyMembers];
    updated[index] = { ...updated[index], [field]: value };
    setFamilyMembers(updated);
  };

  const handleRemoveFamilyMember = (index: number) => {
    setFamilyMembers(familyMembers.filter((_, idx) => idx !== index));
  };

  // Toggle Module Selection
  const toggleModule = (mod: string) => {
    if (assignedModules.includes(mod)) {
      setAssignedModules(assignedModules.filter((m) => m !== mod));
    } else {
      setAssignedModules([...assignedModules, mod]);
    }
  };

  // Final Form Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setActiveTab('personal');
      alert('Please enter the Staff Member Full Name.');
      return;
    }

    const commAddr = sameAsPermanent ? permanentAddress : communicationAddress;

    const initialDocs: StaffDocument[] = [
      {
        id: `doc-aadhaar-${Date.now()}`,
        category: 'ID Proof',
        documentNumber: aadhaarNumber,
        fileName: 'Aadhaar_Government_ID.pdf',
        verificationStatus: verificationStatus === 'Verified' ? 'Verified' : 'Pending',
        uploadDate: registrationDate,
      },
      {
        id: `doc-pan-${Date.now()}`,
        category: 'ID Proof',
        documentNumber: panNumber,
        fileName: 'PAN_Card_Copy.pdf',
        verificationStatus: verificationStatus === 'Verified' ? 'Verified' : 'Pending',
        uploadDate: registrationDate,
      },
      {
        id: `doc-resume-${Date.now()}`,
        category: 'Resume',
        fileName: 'Curriculum_Vitae_Updated.pdf',
        verificationStatus: 'Verified',
        uploadDate: registrationDate,
      },
    ];

    const staffPayload: Partial<StaffMember> = {
      id: staffId || nextId,
      staffId: staffId || nextId,
      fullName: fullName.trim(),
      profilePhoto,
      gender,
      dateOfBirth,
      bloodGroup,
      nationality,
      maritalStatus,
      email: officialEmail || personalEmail || `${fullName.toLowerCase().replace(/\s+/g, '.')}@mysar.org`,
      personalEmail,
      contactNumber,
      whatsappNumber: whatsappNumber || contactNumber,
      emergencyContact: {
        name: emergencyContactName || 'Family Member',
        relationship: emergencyRelationship,
        phone: emergencyPhone || contactNumber,
      },
      permanentAddress,
      communicationAddress: {
        ...commAddr,
        sameAsPermanent,
      },
      joiningDate: dateOfJoining,
      division: `${department} Wing`,
      department,
      position: position || 'Staff Specialist',
      employeeCategory,
      employmentType,
      branchLocation,
      reportingManager,
      workLocation,
      previousEmployeeId,
      employmentStatus,
      probationPeriod,
      documents: initialDocs,
      salary: {
        basicSalary,
        hra,
        allowances,
        specialAllowance,
        bonus: 0,
        otherEarnings: 0,
        grossSalary,
        pfDeduction,
        taxDeduction,
        otherDeductions: 0,
        totalDeductions,
        netSalary,
        salaryFrequency: 'Monthly',
        paymentMethod: 'Bank Transfer',
        bankDetails: {
          bankName,
          accountNo: accountNo || '••••••••4819',
          ifscCode,
          branch: bankBranch,
        },
      },
      bankPayroll: {
        bankName,
        accountHolderName: accountHolderName || fullName,
        accountNo,
        ifscCode,
        branch: bankBranch,
        uan,
        pfNumber,
        esiNumber,
        salaryStructure: `Standard MYSAR Grade (Gross ₹${grossSalary.toLocaleString()}/mo)`,
      },
      experiences,
      qualifications,
      familyMembers,
      systemAccess: {
        enableLogin,
        username: systemUsername || (officialEmail ? officialEmail.split('@')[0] : 'staff.user'),
        role: systemRole,
        accessLevel,
        assignedModules,
        branchAccess: systemBranchAccess,
        accountStatus,
      },
      verification: {
        registrationDate,
        registeredBy,
        verificationStatus,
        verifiedBy,
        verificationDate,
        remarks: registrationRemarks,
      },
      aadhaarNumber,
      panNumber,
      todayAttendanceStatus: 'Present',
      overallKpiScore: 90,
      notes: registrationRemarks,
      createdDate: registrationDate,
      updatedDate: registrationDate,
    };

    onSave(staffPayload);
    onClose();
  };

  // Next / Previous Navigation Helpers
  const currentTabIndex = TABS.findIndex((t) => t.key === activeTab);
  const handleNext = () => {
    if (currentTabIndex < TABS.length - 1) {
      setActiveTab(TABS[currentTabIndex + 1].key);
    }
  };
  const handlePrev = () => {
    if (currentTabIndex > 0) {
      setActiveTab(TABS[currentTabIndex - 1].key);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 text-xs flex flex-col max-h-[94vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-[#168A45] shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900">Onboard New Staff Member</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  MYSAR HR Module
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                  ID: {staffId}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Official institutional staff registration form spanning 10 structured sections.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePreloadDemo}
              title="Click to populate realistic sample staff credentials"
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/80 rounded-xl font-semibold cursor-pointer transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Fill Demo Details</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 10-Tab Horizontal Step Navigator */}
        <div className="bg-slate-50/80 border-b border-slate-200 px-4 py-2 shrink-0 overflow-x-auto scrollbar-none">
          <div className="flex items-center space-x-1.5 min-w-max">
            {TABS.map((tab, idx) => {
              const IconComp = tab.icon;
              const isActive = activeTab === tab.key;
              const isPast = idx < currentTabIndex;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer text-[11px] ${
                    isActive
                      ? 'bg-[#168A45] text-white shadow-xs'
                      : isPast
                      ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/70'
                  }`}
                >
                  <IconComp className={`w-3.5 h-3.5 ${isActive ? 'text-white' : isPast ? 'text-emerald-700' : 'text-slate-400'}`} />
                  <span className="whitespace-nowrap">{tab.shortLabel}</span>
                  {isPast && <Check className="w-3 h-3 text-emerald-700 ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* SECTION 1: PERSONAL INFORMATION */}
          {activeTab === 'personal' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">1. Personal Information</h3>
                  <p className="text-slate-500 text-[11px]">Primary identity, contact coordinates, and demographic details.</p>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Step 1 of 10
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="font-semibold text-slate-700">Staff ID / Employee ID *</label>
                  <input
                    type="text"
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    required
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-slate-50 font-mono font-bold"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="font-semibold text-slate-700">Full Name *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Smt. Meera Gopikrishnan"
                    required
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Date of Birth</label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Nationality</label>
                  <input
                    type="text"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Marital Status</label>
                  <select
                    value={maritalStatus}
                    onChange={(e) => setMaritalStatus(e.target.value as any)}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Personal Email</label>
                  <input
                    type="email"
                    value={personalEmail}
                    onChange={(e) => setPersonalEmail(e.target.value)}
                    placeholder="e.g. personal@gmail.com"
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Contact Number *</label>
                  <input
                    type="tel"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="+91 94471 00000"
                    required
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">WhatsApp Number</label>
                  <input
                    type="tel"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="+91 94471 00000"
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Emergency Contact Number *</label>
                  <input
                    type="tel"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder="+91 98460 00000"
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  />
                </div>
              </div>

              {/* Emergency Contact Persona Group */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                <div>
                  <label className="font-semibold text-slate-700">Emergency Contact Person Name</label>
                  <input
                    type="text"
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    placeholder="e.g. Dr. Suresh Varma"
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Emergency Contact Relationship</label>
                  <select
                    value={emergencyRelationship}
                    onChange={(e) => setEmergencyRelationship(e.target.value)}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Profile Photo URL / Selector */}
              <div>
                <label className="font-semibold text-slate-700">Profile Photo URL or Avatar</label>
                <div className="flex items-center space-x-3 mt-1.5">
                  <img
                    src={profilePhoto}
                    alt="Preview"
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs"
                  />
                  <input
                    type="url"
                    value={profilePhoto}
                    onChange={(e) => setProfilePhoto(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: ADDRESS INFORMATION */}
          {activeTab === 'address' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">2. Address Information</h3>
                  <p className="text-slate-500 text-[11px]">Permanent legal residence and official communication coordinates.</p>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Step 2 of 10
                </span>
              </div>

              {/* Permanent Address */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center space-x-2 font-bold text-slate-900">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Permanent Address</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label className="font-semibold text-slate-700">Address Line 1</label>
                    <input
                      type="text"
                      value={permanentAddress.addressLine1}
                      onChange={(e) => setPermanentAddress({ ...permanentAddress, addressLine1: e.target.value })}
                      placeholder="House Name / Flat No., Street, Landmark"
                      className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="font-semibold text-slate-700">Address Line 2 (Optional)</label>
                    <input
                      type="text"
                      value={permanentAddress.addressLine2}
                      onChange={(e) => setPermanentAddress({ ...permanentAddress, addressLine2: e.target.value })}
                      placeholder="Post Office, Locality, Area"
                      className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700">City / Place</label>
                    <input
                      type="text"
                      value={permanentAddress.city}
                      onChange={(e) => setPermanentAddress({ ...permanentAddress, city: e.target.value })}
                      placeholder="e.g. Kochi"
                      className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700">District</label>
                    <input
                      type="text"
                      value={permanentAddress.district}
                      onChange={(e) => setPermanentAddress({ ...permanentAddress, district: e.target.value })}
                      placeholder="e.g. Ernakulam"
                      className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700">State</label>
                    <input
                      type="text"
                      value={permanentAddress.state}
                      onChange={(e) => setPermanentAddress({ ...permanentAddress, state: e.target.value })}
                      className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700">Country</label>
                    <input
                      type="text"
                      value={permanentAddress.country}
                      onChange={(e) => setPermanentAddress({ ...permanentAddress, country: e.target.value })}
                      className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700">PIN Code</label>
                    <input
                      type="text"
                      value={permanentAddress.pinCode}
                      onChange={(e) => setPermanentAddress({ ...permanentAddress, pinCode: e.target.value })}
                      placeholder="682030"
                      className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Communication Address */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 font-bold text-slate-900">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>Communication Address</span>
                  </div>

                  <label className="flex items-center space-x-2 cursor-pointer font-semibold text-slate-700 text-[11px] bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                    <input
                      type="checkbox"
                      checked={sameAsPermanent}
                      onChange={(e) => {
                        setSameAsPermanent(e.target.checked);
                        if (e.target.checked) {
                          setCommunicationAddress({ ...permanentAddress });
                        }
                      }}
                      className="rounded text-[#168A45] focus:ring-emerald-500 w-4 h-4"
                    />
                    <span>Same as Permanent Address?</span>
                  </label>
                </div>

                {!sameAsPermanent ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div className="md:col-span-2">
                      <label className="font-semibold text-slate-700">Address Line 1</label>
                      <input
                        type="text"
                        value={communicationAddress.addressLine1}
                        onChange={(e) => setCommunicationAddress({ ...communicationAddress, addressLine1: e.target.value })}
                        placeholder="House Name / Flat No., Street, Landmark"
                        className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="font-semibold text-slate-700">Address Line 2</label>
                      <input
                        type="text"
                        value={communicationAddress.addressLine2}
                        onChange={(e) => setCommunicationAddress({ ...communicationAddress, addressLine2: e.target.value })}
                        placeholder="Post Office, Locality, Area"
                        className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700">City / Place</label>
                      <input
                        type="text"
                        value={communicationAddress.city}
                        onChange={(e) => setCommunicationAddress({ ...communicationAddress, city: e.target.value })}
                        className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700">District</label>
                      <input
                        type="text"
                        value={communicationAddress.district}
                        onChange={(e) => setCommunicationAddress({ ...communicationAddress, district: e.target.value })}
                        className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700">State</label>
                      <input
                        type="text"
                        value={communicationAddress.state}
                        onChange={(e) => setCommunicationAddress({ ...communicationAddress, state: e.target.value })}
                        className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700">Country</label>
                      <input
                        type="text"
                        value={communicationAddress.country}
                        onChange={(e) => setCommunicationAddress({ ...communicationAddress, country: e.target.value })}
                        className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700">PIN Code</label>
                      <input
                        type="text"
                        value={communicationAddress.pinCode}
                        onChange={(e) => setCommunicationAddress({ ...communicationAddress, pinCode: e.target.value })}
                        className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 text-[11px] italic bg-white p-3 rounded-xl border border-dashed border-slate-200">
                    Communication address is synced automatically with Permanent Address.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* SECTION 3: EMPLOYMENT INFORMATION */}
          {activeTab === 'employment' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">3. Employment Information</h3>
                  <p className="text-slate-500 text-[11px]">Designation, cadre, department, and institutional hierarchy.</p>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Step 3 of 10
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="font-semibold text-slate-700">Employee ID</label>
                  <input
                    type="text"
                    value={staffId}
                    readOnly
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-slate-100 font-mono font-bold cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Date of Joining *</label>
                  <input
                    type="date"
                    value={dateOfJoining}
                    onChange={(e) => setDateOfJoining(e.target.value)}
                    required
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Department *</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  >
                    <option value="Academic">Academic</option>
                    <option value="Administration">Administration</option>
                    <option value="Finance">Finance</option>
                    <option value="HR">HR</option>
                    <option value="IT">IT</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Designation / Position *</label>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="e.g. Senior Faculty / Admission Head"
                    required
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Employee Category *</label>
                  <select
                    value={employeeCategory}
                    onChange={(e) => setEmployeeCategory(e.target.value as any)}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white font-semibold text-emerald-800"
                  >
                    <option value="Administrator">Administrator</option>
                    <option value="Manager">Manager</option>
                    <option value="Accountant">Accountant</option>
                    <option value="CSR">CSR</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="Other">Other Cadre</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Employment Type *</label>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value as any)}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  >
                    <option value="Permanent">Permanent</option>
                    <option value="Temporary">Temporary</option>
                    <option value="Internship">Internship</option>
                    <option value="Contract">Contract</option>
                    <option value="Part-Time">Part-Time</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Branch / Location</label>
                  <select
                    value={branchLocation}
                    onChange={(e) => setBranchLocation(e.target.value)}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  >
                    <option value="Kochi Main Campus">Kochi Main Campus</option>
                    <option value="Calicut Regional Centre">Calicut Regional Centre</option>
                    <option value="Trivandrum South Wing">Trivandrum South Wing</option>
                    <option value="Wayanad Academic Outreach">Wayanad Academic Outreach</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Reporting Manager</label>
                  <input
                    type="text"
                    value={reportingManager}
                    onChange={(e) => setReportingManager(e.target.value)}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Work Location</label>
                  <input
                    type="text"
                    value={workLocation}
                    onChange={(e) => setWorkLocation(e.target.value)}
                    placeholder="e.g. On-site (Campus Wing A)"
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Previous Employee ID (If any)</label>
                  <input
                    type="text"
                    value={previousEmployeeId}
                    onChange={(e) => setPreviousEmployeeId(e.target.value)}
                    placeholder="e.g. MYSAR-OLD-118"
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Employment Status *</label>
                  <select
                    value={employmentStatus}
                    onChange={(e) => setEmploymentStatus(e.target.value as any)}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white font-semibold"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Resigned">Resigned</option>
                    <option value="Terminated">Terminated</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Probation Period</label>
                  <input
                    type="text"
                    value={probationPeriod}
                    onChange={(e) => setProbationPeriod(e.target.value)}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: EXPERIENCE INFORMATION (MULTIPLE RECORDS) */}
          {activeTab === 'experience' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">4. Prior Experience History</h3>
                  <p className="text-slate-500 text-[11px]">Chronological employment record across previous organizations.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddExperience}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Experience Record</span>
                </button>
              </div>

              {experiences.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-slate-500 mb-2">No prior experience records added (Fresher candidate).</p>
                  <button
                    type="button"
                    onClick={handleAddExperience}
                    className="text-xs text-emerald-700 font-bold hover:underline"
                  >
                    + Click to add previous organization experience
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {experiences.map((exp, idx) => (
                    <div key={exp.id || idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 relative">
                      <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                        <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                          <Award className="w-4 h-4 text-emerald-600" />
                          <span>Experience Record #{idx + 1}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveExperience(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-2">
                          <label className="font-semibold text-slate-700">Previous Organization *</label>
                          <input
                            type="text"
                            value={exp.organization}
                            onChange={(e) => handleUpdateExperience(idx, 'organization', e.target.value)}
                            placeholder="e.g. St. Teresa Higher Secondary Institute"
                            className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700">Designation *</label>
                          <input
                            type="text"
                            value={exp.designation}
                            onChange={(e) => handleUpdateExperience(idx, 'designation', e.target.value)}
                            placeholder="e.g. Senior Faculty"
                            className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700">Department</label>
                          <input
                            type="text"
                            value={exp.department}
                            onChange={(e) => handleUpdateExperience(idx, 'department', e.target.value)}
                            placeholder="e.g. Academic Wing"
                            className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700">Employment Type</label>
                          <select
                            value={exp.employmentType}
                            onChange={(e) => handleUpdateExperience(idx, 'employmentType', e.target.value)}
                            className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                          >
                            <option value="Full Time">Full Time</option>
                            <option value="Part Time">Part Time</option>
                            <option value="Contract">Contract</option>
                            <option value="Internship">Internship</option>
                          </select>
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700">Total Experience</label>
                          <input
                            type="text"
                            value={exp.totalExperience}
                            onChange={(e) => handleUpdateExperience(idx, 'totalExperience', e.target.value)}
                            placeholder="e.g. 2 Years 11 Months"
                            className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700">Date of Joining</label>
                          <input
                            type="date"
                            value={exp.dateOfJoining}
                            onChange={(e) => handleUpdateExperience(idx, 'dateOfJoining', e.target.value)}
                            className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700">Date of Leaving</label>
                          <input
                            type="date"
                            value={exp.dateOfLeaving}
                            onChange={(e) => handleUpdateExperience(idx, 'dateOfLeaving', e.target.value)}
                            className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700">Experience Certificate Document</label>
                          <input
                            type="text"
                            value={exp.certificateDoc || ''}
                            onChange={(e) => handleUpdateExperience(idx, 'certificateDoc', e.target.value)}
                            placeholder="Certificate_Filename.pdf"
                            className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white font-mono text-[11px]"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="font-semibold text-slate-700">Reason for Leaving</label>
                          <input
                            type="text"
                            value={exp.reasonForLeaving}
                            onChange={(e) => handleUpdateExperience(idx, 'reasonForLeaving', e.target.value)}
                            placeholder="e.g. Career Growth & Relocation"
                            className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700">Remarks / References</label>
                          <input
                            type="text"
                            value={exp.remarks || ''}
                            onChange={(e) => handleUpdateExperience(idx, 'remarks', e.target.value)}
                            placeholder="Remarks from previous employer"
                            className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 5: QUALIFICATIONS (MULTIPLE RECORDS) */}
          {activeTab === 'qualifications' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">5. Academic & Professional Qualifications</h3>
                  <p className="text-slate-500 text-[11px]">Degrees, diplomas, certifications, passing years, and institutions.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddQualification}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Qualification</span>
                </button>
              </div>

              <div className="space-y-3">
                {qualifications.map((qual, idx) => (
                  <div key={qual.id || idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 relative">
                    <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                      <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                        <GraduationCap className="w-4 h-4 text-emerald-600" />
                        <span>Qualification Entry #{idx + 1}</span>
                      </span>
                      {qualifications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQualification(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="font-semibold text-slate-700">Qualification Level *</label>
                        <select
                          value={qual.level}
                          onChange={(e) => handleUpdateQualification(idx, 'level', e.target.value)}
                          className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white font-semibold"
                        >
                          <option value="SSLC / 10th">SSLC / 10th</option>
                          <option value="Plus Two / 12th">Plus Two / 12th</option>
                          <option value="Diploma">Diploma</option>
                          <option value="Undergraduate">Undergraduate</option>
                          <option value="Postgraduate">Postgraduate</option>
                          <option value="M.Phil">M.Phil</option>
                          <option value="Ph.D.">Ph.D.</option>
                          <option value="Other">Other Professional Certification</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="font-semibold text-slate-700">Course / Degree Name *</label>
                        <input
                          type="text"
                          value={qual.courseName}
                          onChange={(e) => handleUpdateQualification(idx, 'courseName', e.target.value)}
                          placeholder="e.g. M.Sc. Mathematics / B.Tech Computer Science"
                          className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700">Specialization / Major</label>
                        <input
                          type="text"
                          value={qual.specialization}
                          onChange={(e) => handleUpdateQualification(idx, 'specialization', e.target.value)}
                          placeholder="e.g. Applied Statistics"
                          className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="font-semibold text-slate-700">Institution / University *</label>
                        <input
                          type="text"
                          value={qual.institution}
                          onChange={(e) => handleUpdateQualification(idx, 'institution', e.target.value)}
                          placeholder="e.g. University of Kerala"
                          className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700">Year of Passing</label>
                        <input
                          type="text"
                          value={qual.yearOfPassing}
                          onChange={(e) => handleUpdateQualification(idx, 'yearOfPassing', e.target.value)}
                          placeholder="e.g. 2019"
                          className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700">Grade / Percentage</label>
                        <input
                          type="text"
                          value={qual.grade}
                          onChange={(e) => handleUpdateQualification(idx, 'grade', e.target.value)}
                          placeholder="e.g. 86.4% / CGPA 8.6"
                          className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700">Certificate / Document</label>
                        <input
                          type="text"
                          value={qual.certificateDoc || ''}
                          onChange={(e) => handleUpdateQualification(idx, 'certificateDoc', e.target.value)}
                          placeholder="Degree_Certificate.pdf"
                          className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white font-mono text-[11px]"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="font-semibold text-slate-700">Remarks</label>
                        <input
                          type="text"
                          value={qual.remarks || ''}
                          onChange={(e) => handleUpdateQualification(idx, 'remarks', e.target.value)}
                          placeholder="e.g. First Class with Distinction"
                          className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 6: FAMILY CONTACT INFORMATION (MULTIPLE RECORDS) */}
          {activeTab === 'family' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">6. Family Contact Information</h3>
                  <p className="text-slate-500 text-[11px]">Next of kin, dependents, and emergency points of contact.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddFamilyMember}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Family Member</span>
                </button>
              </div>

              <div className="space-y-3">
                {familyMembers.map((fam, idx) => (
                  <div key={fam.id || idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 relative">
                    <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                      <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                        <Users className="w-4 h-4 text-emerald-600" />
                        <span>Family Member #{idx + 1}</span>
                      </span>
                      {familyMembers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveFamilyMember(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="font-semibold text-slate-700">Name *</label>
                        <input
                          type="text"
                          value={fam.name}
                          onChange={(e) => handleUpdateFamilyMember(idx, 'name', e.target.value)}
                          placeholder="e.g. Dr. Suresh Varma"
                          className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700">Relationship *</label>
                        <select
                          value={fam.relationship}
                          onChange={(e) => handleUpdateFamilyMember(idx, 'relationship', e.target.value)}
                          className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                        >
                          <option value="Spouse">Spouse</option>
                          <option value="Father">Father</option>
                          <option value="Mother">Mother</option>
                          <option value="Child">Child / Dependent</option>
                          <option value="Sibling">Sibling</option>
                          <option value="Guardian">Guardian</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700">Date of Birth</label>
                        <input
                          type="date"
                          value={fam.dateOfBirth || ''}
                          onChange={(e) => handleUpdateFamilyMember(idx, 'dateOfBirth', e.target.value)}
                          className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700">Contact Number *</label>
                        <input
                          type="tel"
                          value={fam.contactNumber}
                          onChange={(e) => handleUpdateFamilyMember(idx, 'contactNumber', e.target.value)}
                          placeholder="+91 98460 00000"
                          className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700">WhatsApp Number</label>
                        <input
                          type="tel"
                          value={fam.whatsappNumber || ''}
                          onChange={(e) => handleUpdateFamilyMember(idx, 'whatsappNumber', e.target.value)}
                          placeholder="+91 98460 00000"
                          className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700">Email</label>
                        <input
                          type="email"
                          value={fam.email || ''}
                          onChange={(e) => handleUpdateFamilyMember(idx, 'email', e.target.value)}
                          placeholder="family@gmail.com"
                          className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700">Occupation</label>
                        <input
                          type="text"
                          value={fam.occupation || ''}
                          onChange={(e) => handleUpdateFamilyMember(idx, 'occupation', e.target.value)}
                          placeholder="e.g. Physician / Teacher / Retired"
                          className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="font-semibold text-slate-700">Residential Address</label>
                        <input
                          type="text"
                          value={fam.address || ''}
                          onChange={(e) => handleUpdateFamilyMember(idx, 'address', e.target.value)}
                          placeholder="Address coordinates if residing separately"
                          className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 pt-1 border-t border-slate-200/60">
                      <label className="flex items-center space-x-2 cursor-pointer font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={fam.isEmergencyContact}
                          onChange={(e) => handleUpdateFamilyMember(idx, 'isEmergencyContact', e.target.checked)}
                          className="rounded text-[#168A45] focus:ring-emerald-500 w-4 h-4"
                        />
                        <span>Designate as Emergency Contact?</span>
                      </label>

                      <label className="flex items-center space-x-2 cursor-pointer font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={fam.isDependent}
                          onChange={(e) => handleUpdateFamilyMember(idx, 'isDependent', e.target.checked)}
                          className="rounded text-[#168A45] focus:ring-emerald-500 w-4 h-4"
                        />
                        <span>Institutional Dependent (ESI / Medical Benefit)?</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 7: BANK & PAYROLL INFORMATION */}
          {activeTab === 'bankPayroll' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">7. Bank & Payroll Information</h3>
                  <p className="text-slate-500 text-[11px]">Disbursement bank details, EPF/ESI statutory numbers, and compensation structure.</p>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Step 7 of 10
                </span>
              </div>

              {/* Bank Account Fields */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="font-bold text-slate-900 flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>Salary Account Credentials</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700">Bank Name *</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. State Bank of India"
                      className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700">Account Holder Name *</label>
                    <input
                      type="text"
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      placeholder={fullName || 'Name as on bank passbook'}
                      className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700">Bank Account Number *</label>
                    <input
                      type="text"
                      value={accountNo}
                      onChange={(e) => setAccountNo(e.target.value)}
                      placeholder="e.g. 309481920481"
                      className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700">IFSC Code *</label>
                    <input
                      type="text"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                      placeholder="e.g. SBIN0002144"
                      className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700">Branch Name</label>
                    <input
                      type="text"
                      value={bankBranch}
                      onChange={(e) => setBankBranch(e.target.value)}
                      placeholder="e.g. Edappally, Kochi"
                      className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Statutory Numbers */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="font-bold text-slate-900 flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span>Statutory Compliance Numbers (EPF & ESI)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700">Universal Account Number (UAN)</label>
                    <input
                      type="text"
                      value={uan}
                      onChange={(e) => setUan(e.target.value)}
                      placeholder="12-digit UAN"
                      className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700">Provident Fund (PF) Number</label>
                    <input
                      type="text"
                      value={pfNumber}
                      onChange={(e) => setPfNumber(e.target.value)}
                      placeholder="KR/KCH/..."
                      className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700">ESI Insurance Number</label>
                    <input
                      type="text"
                      value={esiNumber}
                      onChange={(e) => setEsiNumber(e.target.value)}
                      placeholder="17-digit ESI"
                      className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Salary Structure & Live Calculation */}
              <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-emerald-950 flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-emerald-700" />
                    <span>Monthly Salary Structure & Breakdown</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-emerald-800 font-semibold uppercase tracking-wider">Net Disbursed Salary</span>
                    <div className="text-base font-extrabold text-emerald-900">
                      ₹{netSalary.toLocaleString('en-IN')}<span className="text-xs font-normal"> / mo</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700">Basic Salary (₹) *</label>
                    <input
                      type="number"
                      value={basicSalary}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setBasicSalary(val);
                        setHra(Math.round(val * 0.4));
                      }}
                      className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700">HRA (40% Standard)</label>
                    <input
                      type="number"
                      value={hra}
                      onChange={(e) => setHra(parseInt(e.target.value) || 0)}
                      className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700">Special Allowances (₹)</label>
                    <input
                      type="number"
                      value={allowances}
                      onChange={(e) => setAllowances(parseInt(e.target.value) || 0)}
                      className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700">Total Deductions (PF+Tax)</label>
                    <input
                      type="number"
                      value={totalDeductions}
                      readOnly
                      className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-rose-700 bg-rose-50/60 font-bold"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-emerald-900 bg-white/80 p-2.5 rounded-xl border border-emerald-200">
                  <span>Gross Pay: <b>₹{grossSalary.toLocaleString('en-IN')}</b></span>
                  <span>EPF Deduction: <b>₹{pfDeduction.toLocaleString('en-IN')}</b></span>
                  <span>TDS / Professional Tax: <b>₹{taxDeduction.toLocaleString('en-IN')}</b></span>
                  <span className="font-bold text-emerald-800">Net Take-home: ₹{netSalary.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 8: DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">8. Identity & Institutional Documents</h3>
                  <p className="text-slate-500 text-[11px]">Aadhaar, PAN, certificates, resume, and joining dossier verification.</p>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Step 8 of 10
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="font-semibold text-slate-700">Aadhaar / Government ID Number *</label>
                  <input
                    type="text"
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value)}
                    placeholder="12-digit Aadhaar"
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white font-mono"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="font-semibold text-slate-700">PAN Card Number *</label>
                  <input
                    type="text"
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white font-mono uppercase"
                  />
                </div>
              </div>

              {/* Document Checklist & Upload Status */}
              <div className="space-y-2">
                <span className="font-bold text-slate-800">Verification Document Checklist</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: 'aadhaar', label: 'Aadhaar / National ID Proof', file: 'Aadhaar_Document_Verified.pdf' },
                    { id: 'pan', label: 'PAN Card Verification', file: 'PAN_Card_Copy.pdf' },
                    { id: 'passportPhoto', label: 'Formal Passport Photograph', file: 'Passport_Photo_Digital.jpg' },
                    { id: 'resume', label: 'Resume / Curriculum Vitae', file: 'Curriculum_Vitae_Official.pdf' },
                    { id: 'experienceCert', label: 'Experience Certificates', file: 'Experience_Documents_Bundle.pdf' },
                    { id: 'qualificationCert', label: 'Qualification Degree Certificates', file: 'Degrees_Marklists_Consolidated.pdf' },
                    { id: 'joiningDocs', label: 'Signed Joining Report & NDA', file: 'Joining_Form_Executed.pdf' },
                    { id: 'otherDocs', label: 'Medical & Police Verification', file: 'Fitness_Clearance.pdf' },
                  ].map((doc) => {
                    const isAttached = uploadedDocs[doc.id];
                    return (
                      <div
                        key={doc.id}
                        className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between shadow-2xs hover:border-emerald-300 transition-all"
                      >
                        <div className="flex items-center space-x-2.5">
                          <FileCheck className={`w-4 h-4 ${isAttached ? 'text-emerald-600' : 'text-slate-400'}`} />
                          <div>
                            <div className="font-semibold text-slate-800">{doc.label}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{doc.file}</div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setUploadedDocs({ ...uploadedDocs, [doc.id]: !isAttached })}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                            isAttached
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {isAttached ? 'Attached ✓' : 'Upload'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 9: SYSTEM & ACCESS INFORMATION */}
          {activeTab === 'systemAccess' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">9. System & Access Permissions</h3>
                  <p className="text-slate-500 text-[11px]">Configure ERP portal access, role tier, assigned institutional modules, and security status.</p>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Step 9 of 10
                </span>
              </div>

              {/* Login Enable Toggle */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 flex items-center space-x-2">
                    <Lock className="w-4 h-4 text-emerald-600" />
                    <span>MYSAR ERP Portal Staff Login</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Generate portal credentials for staff self-service, attendance check-in, and department tools.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableLogin}
                    onChange={(e) => setEnableLogin(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#168A45]"></div>
                </label>
              </div>

              {enableLogin && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="font-semibold text-slate-700">Username / Login Email *</label>
                    <input
                      type="text"
                      value={systemUsername || (officialEmail ? officialEmail.split('@')[0] : '')}
                      onChange={(e) => setSystemUsername(e.target.value)}
                      placeholder="e.g. meera.g"
                      className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700">System Role</label>
                    <select
                      value={systemRole}
                      onChange={(e) => setSystemRole(e.target.value)}
                      className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                    >
                      <option value="Staff">Faculty / Teaching Staff</option>
                      <option value="Department Coordinator">Department Coordinator</option>
                      <option value="Manager">Office / Campus Manager</option>
                      <option value="Accountant">Finance & Accountant</option>
                      <option value="HR Admin">HR Administrator</option>
                      <option value="Principal">Principal / Executive Director</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700">Access Level</label>
                    <select
                      value={accessLevel}
                      onChange={(e) => setAccessLevel(e.target.value as any)}
                      className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white font-semibold text-emerald-800"
                    >
                      <option value="Standard">Standard User (Self Service)</option>
                      <option value="Read-Only">Read-Only Observer</option>
                      <option value="Manager">Department Manager</option>
                      <option value="Administrator">Administrator</option>
                      <option value="Super Admin">Super Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700">Branch / Location Scope</label>
                    <select
                      value={systemBranchAccess}
                      onChange={(e) => setSystemBranchAccess(e.target.value)}
                      className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                    >
                      <option value="Kochi Main Campus">Kochi Main Campus Only</option>
                      <option value="Calicut Regional Centre">Calicut Regional Centre</option>
                      <option value="Trivandrum South Wing">Trivandrum South Wing</option>
                      <option value="All Branches">All Institutional Branches</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700">Account Status</label>
                    <select
                      value={accountStatus}
                      onChange={(e) => setAccountStatus(e.target.value as any)}
                      className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white font-semibold"
                    >
                      <option value="Active">Active</option>
                      <option value="Pending">Pending First Login</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Assigned Modules Multi-Select */}
              <div className="space-y-2">
                <label className="font-bold text-slate-800">Assigned Institutional Modules</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    'Dashboard',
                    'Leads & Admissions',
                    'HR & Staff Directory',
                    'Attendance & Leave',
                    'Payroll Management',
                    'KPI & Performance',
                    'Academic Schedules',
                    'Reports & Analytics',
                    'System Settings',
                  ].map((mod) => {
                    const isSelected = assignedModules.includes(mod);
                    return (
                      <button
                        key={mod}
                        type="button"
                        onClick={() => toggleModule(mod)}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-[11px]">{mod}</span>
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                        ) : (
                          <span className="w-3.5 h-3.5 border border-slate-300 rounded-sm" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 10: REGISTRATION & VERIFICATION */}
          {activeTab === 'verification' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">10. Registration & Audit Verification</h3>
                  <p className="text-slate-500 text-[11px]">Final institutional audit, approval sign-off, and permanent registry commit.</p>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Step 10 of 10
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700">Registration Date</label>
                  <input
                    type="date"
                    value={registrationDate}
                    onChange={(e) => setRegistrationDate(e.target.value)}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Registered By (HR Officer)</label>
                  <input
                    type="text"
                    value={registeredBy}
                    onChange={(e) => setRegisteredBy(e.target.value)}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Verification Status *</label>
                  <select
                    value={verificationStatus}
                    onChange={(e) => setVerificationStatus(e.target.value as any)}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white font-bold text-emerald-800"
                  >
                    <option value="Verified">Verified & Approved</option>
                    <option value="Pending">Pending Audit Check</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Verified By (Auditor / Principal)</label>
                  <input
                    type="text"
                    value={verifiedBy}
                    onChange={(e) => setVerifiedBy(e.target.value)}
                    placeholder="e.g. Dr. Ramesh Nambiar (Principal)"
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Verification Date</label>
                  <input
                    type="date"
                    value={verificationDate}
                    onChange={(e) => setVerificationDate(e.target.value)}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Audit Remarks / Onboarding Notes</label>
                <textarea
                  rows={3}
                  value={registrationRemarks}
                  onChange={(e) => setRegistrationRemarks(e.target.value)}
                  placeholder="Notes regarding candidate verification, credentials, or joining conditions..."
                  className="w-full mt-1 border border-slate-200 rounded-xl p-3 text-slate-900 bg-white focus:outline-hidden"
                />
              </div>

              {/* Summary Overview Card before submitting */}
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-slate-800 space-y-2">
                <div className="flex items-center space-x-2 font-bold text-emerald-950">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Ready to Commit Staff Registration to MYSAR Directory</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                  <div>
                    <span className="text-slate-500">Staff ID:</span>
                    <div className="font-bold text-slate-900">{staffId}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Full Name:</span>
                    <div className="font-bold text-slate-900">{fullName || '—'}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Cadre & Dept:</span>
                    <div className="font-bold text-slate-900">{employeeCategory} • {department}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Net Salary:</span>
                    <div className="font-bold text-emerald-700">₹{netSalary.toLocaleString('en-IN')}/mo</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Modal Footer Controls */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div>
            {currentTabIndex > 0 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center space-x-1.5 px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Section</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2.5">
            {currentTabIndex < TABS.length - 1 && (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold cursor-pointer shadow-2xs"
              >
                <span>Next Section</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              className="flex items-center space-x-2 px-5 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl font-bold cursor-pointer shadow-sm transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Save & Onboard Staff</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
