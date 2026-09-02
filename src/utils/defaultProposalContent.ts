import { ProposalContentConfig, Settings } from '../types';

export const DEFAULT_PROPOSAL_CONTENT: ProposalContentConfig = {
  // Page 3: 1. About Casbiro Solutions Private Limited
  aboutCompanyTitle: '1. About Casbiro Solutions Private Limited',
  aboutCompanyText1:
    'Casbiro Solutions Private Limited is an innovative technology company focused on transforming the education sector through smart digital solutions.',
  aboutCompanyText2:
    'Our flagship product, MYSAR (My Student Analysis Record), is designed to create a complete and continuous student development system that supports schools, teachers, parents, and students.',
  companyObjectives: [
    'Digitize and simplify school operations',
    'Enhance transparency in academic and non-academic activities',
    'Strengthen parent–teacher collaboration',
    'Enable data-driven decision-making in education',
  ],
  companyScaleNote:
    'Our solutions are scalable, user-friendly, and built to support institutions of all sizes.',

  // Page 4: 2. About MYSAR
  aboutProductTitle: '2. About MYSAR (My Student Analysis Record)',
  aboutProductText:
    'MYSAR is a comprehensive student management and analysis platform that goes beyond traditional systems.',
  productHighlights: [
    'A 360° student profile',
    'Continuous academic and behavioral tracking',
    'A lifelong student portfolio, even if the student changes schools',
    'Real-time insights for teachers and parents',
  ],
  productSummaryQuote:
    'The platform ensures that every student’s progress is documented, analyzed, and improved using data-driven insights.',

  // Page 5, 6, 7: 3. Modules in MYSAR
  modulesIntroText:
    'MYSAR includes a wide range of modules designed to cover all aspects of school management:',
  modules: [
    {
      id: 'mod-1',
      name: 'Teacher Dashboard',
      category: 'Core Operations',
      features: [
        'Quick data entry and updates',
        'Class and subject overview',
        'Performance alerts and insights',
      ],
      isLive: true,
    },
    {
      id: 'mod-2',
      name: 'School Administration',
      category: 'Administration',
      features: [
        'Academic year and class management',
        'Student-teacher mapping',
        'Institution-wide monitoring',
      ],
      isLive: true,
    },
    {
      id: 'mod-3',
      name: 'Academic Management',
      category: 'Academics',
      features: [
        'Study material sharing',
        'Homework and project tracking',
        'Online class support',
        'Notice board system',
      ],
      isLive: true,
    },
    {
      id: 'mod-4',
      name: 'Student Profile & Portfolio',
      category: 'Student Lifecycle',
      features: [
        'Complete student digital record',
        'Academic, behavioral, and extracurricular tracking',
        'Long-term portfolio system',
      ],
      isLive: true,
    },
    {
      id: 'mod-5',
      name: 'Assessment & Evaluation',
      category: 'Academics',
      features: [
        'Exam and test records',
        'Grading system',
        'Teacher remarks and feedback',
        'Performance comparison',
      ],
      isLive: true,
    },
    {
      id: 'mod-6',
      name: 'Attendance Management',
      category: 'Core Operations',
      features: [
        'Daily attendance tracking',
        'Leave management',
        'Late entry and early exit tracking',
      ],
      isLive: true,
    },
    {
      id: 'mod-7',
      name: 'Fee Management',
      category: 'Administration & Finance',
      features: [
        'Fee structure setup',
        'Payment tracking and reminders',
        'Collection and pending reports',
      ],
      isLive: true,
    },
    {
      id: 'mod-8',
      name: 'Behavioral Tracking',
      category: 'Student Lifecycle',
      features: [
        'Discipline records',
        'Custom behavior categories',
        'Teacher observations',
      ],
      isLive: true,
    },
    {
      id: 'mod-9',
      name: 'Non-Academic Records',
      category: 'Activities & Skills',
      features: [
        'Sports, arts, and activities tracking',
        'Achievement records',
        'Skill development',
      ],
      isLive: true,
    },
    {
      id: 'mod-10',
      name: 'Extracurricular Activities',
      category: 'Activities & Skills',
      features: [
        'Personality development tracking',
        'Leadership and social skills',
        'Talent identification',
      ],
      isLive: true,
    },
    {
      id: 'mod-11',
      name: 'Parent Access',
      category: 'Communication & Access',
      features: [
        'Secure login with OTP',
        'Real-time updates',
        'Communication with teachers',
      ],
      isLive: true,
    },
    {
      id: 'mod-12',
      name: 'ID Card & Certification',
      category: 'Administration',
      features: [
        'ID card generation',
        'Certificate creation',
        'Secure storage and printing',
      ],
      isLive: true,
    },
  ],

  // Page 8, 9: 4. Reports in MYSAR
  reportsIntroText:
    'MYSAR provides a comprehensive set of reports that help schools monitor, analyze, and improve overall performance across academic, administrative, and operational areas.',
  reportCategories: [
    {
      id: 'rep-cat-1',
      categoryName: 'Student & Admission Reports',
      reports: [
        'Admission Report',
        'Student Profile / Detailed Student Report',
        'Student Transfer and Promotion Report',
        'Students Birthdays Report',
      ],
    },
    {
      id: 'rep-cat-2',
      categoryName: 'Staff & Parent Reports',
      reports: ['Staff Profile / Staff Report', 'Parents Profile / Report'],
    },
    {
      id: 'rep-cat-3',
      categoryName: 'Academic Reports',
      reports: [
        'Homework Report',
        'Exam Report',
        'Progress Report (Student Performance Analysis)',
        'Study Material Report',
        'Online Class Report',
      ],
    },
    {
      id: 'rep-cat-4',
      categoryName: 'Attendance & Leave Reports',
      reports: ['Attendance Report (Student)', 'Leave Request Report'],
    },
    {
      id: 'rep-cat-5',
      categoryName: 'Financial Reports',
      reports: ['Fee Report (Collection, Pending)'],
    },
    {
      id: 'rep-cat-6',
      categoryName: 'Behavior & Feedback Reports',
      reports: [
        'Behavior Report (Student Conduct & Discipline Tracking)',
        'Parent Feedback for School',
        'Parent Feedback for Teachers',
      ],
    },
    {
      id: 'rep-cat-7',
      categoryName: 'Activity & Development Reports',
      reports: [
        'Extra-Curricular Activities Report',
        'Non-Academic Activities Report',
      ],
    },
    {
      id: 'rep-cat-8',
      categoryName: 'Communication Reports',
      reports: ['Notices Report'],
    },
    {
      id: 'rep-cat-9',
      categoryName: 'Analytical Reports',
      reports: [
        'Student Comparison Report',
        'Performance Analysis Reports (Academic & Behavioral Insights)',
        'Student Portfolio',
      ],
    },
  ],

  // Page 10, 11: 5. Services from Team MYSAR
  servicesIntroText:
    'Team MYSAR is committed to providing end-to-end support to ensure smooth implementation, effective usage, and continuous improvement for your institution.',
  services: [
    {
      id: 'srv-1',
      title: '1. Implementation & Onboarding',
      points: [
        'Complete system setup and configuration',
        'School onboarding and account activation',
        'Module-wise deployment support',
      ],
    },
    {
      id: 'srv-2',
      title: '2. Training & Guidance',
      points: [
        'Training sessions for teachers and administrators',
        'Parent orientation and guidance',
        'Continuous support for effective usage',
      ],
    },
    {
      id: 'srv-3',
      title: '3. Data Management Support',
      points: [
        'Initial student and staff data upload',
        'Data structuring and verification',
        'Ongoing data assistance when required',
      ],
    },
    {
      id: 'srv-4',
      title: '4. Performance Monitoring Services',
      points: [
        'Monthly Staff Performance Report',
        'Monthly Students Performance Report',
        'Data-driven insights for improvement',
      ],
    },
    {
      id: 'srv-5',
      title: '5. Academic & Activity Support',
      points: [
        'Homework and exam management guidance',
        'Non-Academic Event Support (if needed)',
        'Extra Curricular Activity Support (if needed)',
      ],
    },
    {
      id: 'srv-6',
      title: '6. Parent Engagement & Conversion',
      points: [
        'Support in converting parents into MYSAR Application users',
        'Awareness and engagement strategies',
        'Improving parent participation and communication',
      ],
    },
    {
      id: 'srv-7',
      title: '7. Technical Support',
      points: [
        'Dedicated support team',
        'Quick issue resolution',
        '24/7 assistance',
      ],
    },
    {
      id: 'srv-8',
      title: '8. Continuous Updates & Improvements',
      points: [
        'Regular feature updates',
        'System enhancements based on feedback',
        'Upgradation of modules and reports',
      ],
    },
    {
      id: 'srv-9',
      title: '9. Consultation & Advisory',
      points: [
        'Best practices for using MYSAR effectively',
        'Guidance for improving academic performance',
        'Strategic support for school development',
      ],
    },
  ],

  // Page 12: 6. Pricing notes
  pricingIntroText:
    'We offer flexible and affordable pricing plans tailored to meet the needs of educational institutions.',
  pricingNotes: {
    parentPaymentNote: '• Normal Rate: ₹150 per student / year',
    schoolPaymentNote: '• Normal Rate: ₹100 per student / year',
    trialOfferNote:
      '• Trial Price: ₹40 per student (Applicable for the first year only)',
  },

  // Page 13: 7. Contact Information
  contactIntroText:
    'For further details, queries, or to proceed with implementation, please feel free to contact us:',
  officeAddressLines: [
    'No. 4/461, 2nd Floor, Valamkattil Tower,',
    'Judgemukku, Kakkanad, Kochi, Kerala – 682021',
  ],
  contactPersons: [
    {
      name: 'Sakeer Ali V',
      designation: 'Sales & Marketing',
      phone: '+91 7994 807 907',
    },
    {
      name: 'Mohamed Rafeeh VK',
      designation: 'IT Admin',
      phone: '+91 7994 806 906',
    },
    {
      name: 'Nisar Ahammed VK',
      designation: 'Operations',
      phone: '+91 7994 805 905',
    },
  ],
  contactEmail: 'support@casbiro.com',
  supportPoints: [
    'Proposal discussions and onboarding',
    'Product demonstration',
    'Implementation planning',
    'Training and support',
  ],
  closingNote:
    'We are always available to support {{INSTITUTE_NAME}} at every stage of the journey—from onboarding to successful implementation and beyond.',

  // Page 14: 8. Conclusion & Upcoming Modules
  conclusionTitle: '8. Conclusion',
  conclusionParagraphs: [
    'MYSAR (My Student Analysis Record) is more than just a school management system—it is a comprehensive platform designed to transform the way educational institutions operate, analyze, and grow.',
    'By integrating academics, attendance, behavior, activities, and communication into a single system, MYSAR enables {{INSTITUTE_NAME}} to achieve greater efficiency, transparency, and student success. The platform empowers teachers with actionable insights, keeps parents actively engaged, and helps management make informed, data-driven decisions.',
    'With dedicated support from Team MYSAR, continuous updates, and a focus on complete student development, we are confident that this partnership will contribute significantly to the institution’s academic excellence and overall growth.',
  ],
  upcomingModulesIntro:
    'As part of our continuous innovation, we are also planning to introduce advanced modules in the coming years, including:',
  upcomingModules: [
    'HR Management',
    'Hostel Management',
    'Finance Management',
    'Library Management',
    'Fleet Management',
    'Lesson Planner',
    'Store Management',
    'Timetable Creation (Auto Suggestion)',
    'Reception Management',
  ],
  studentAppNote:
    'In addition, we are working towards launching a dedicated student application to further enhance student engagement and learning experiences.',
  finalCallToAction:
    'We look forward to collaborating with {{INSTITUTE_NAME}} in building a smarter, more connected, and future-ready learning environment.',
};

export function getEffectiveProposalContent(settings?: Settings): ProposalContentConfig {
  if (!settings?.proposalContent) {
    return DEFAULT_PROPOSAL_CONTENT;
  }

  const custom = settings.proposalContent;
  return {
    ...DEFAULT_PROPOSAL_CONTENT,
    ...custom,
    modules: custom.modules && custom.modules.length > 0 ? custom.modules : DEFAULT_PROPOSAL_CONTENT.modules,
    reportCategories:
      custom.reportCategories && custom.reportCategories.length > 0
        ? custom.reportCategories
        : DEFAULT_PROPOSAL_CONTENT.reportCategories,
    services:
      custom.services && custom.services.length > 0 ? custom.services : DEFAULT_PROPOSAL_CONTENT.services,
    pricingNotes: {
      ...DEFAULT_PROPOSAL_CONTENT.pricingNotes,
      ...(custom.pricingNotes || {}),
    },
    contactPersons:
      custom.contactPersons && custom.contactPersons.length > 0
        ? custom.contactPersons
        : DEFAULT_PROPOSAL_CONTENT.contactPersons,
    officeAddressLines:
      custom.officeAddressLines && custom.officeAddressLines.length > 0
        ? custom.officeAddressLines
        : DEFAULT_PROPOSAL_CONTENT.officeAddressLines,
    supportPoints:
      custom.supportPoints && custom.supportPoints.length > 0
        ? custom.supportPoints
        : DEFAULT_PROPOSAL_CONTENT.supportPoints,
    conclusionParagraphs:
      custom.conclusionParagraphs && custom.conclusionParagraphs.length > 0
        ? custom.conclusionParagraphs
        : DEFAULT_PROPOSAL_CONTENT.conclusionParagraphs,
    upcomingModules:
      custom.upcomingModules && custom.upcomingModules.length > 0
        ? custom.upcomingModules
        : DEFAULT_PROPOSAL_CONTENT.upcomingModules,
  };
}
