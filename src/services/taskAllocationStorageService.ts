import { AllocatedTask, TaskActivityLog, TaskChecklistItem, TaskPriority, TaskStatus, TaskCategory } from '../types/tasks';

const STORAGE_KEY = 'mysar_allocated_tasks_v1';
const TASK_EVENT_NAME = 'mysar_tasks_updated';

const initialMockTasks: AllocatedTask[] = [
  {
    id: 'TSK-2026-001',
    title: 'Enterprise Q4 Information Security Audit & ISO 27001 Readiness',
    description: 'Execute internal penetration testing across web infrastructure, audit staff access control privileges, review firewall policies, and compile the readiness matrix for our upcoming ISO 27001 surveillance audit.',
    category: 'Compliance & Audit',
    department: 'Engineering & IT',
    departmentCode: '104',
    priority: 'Critical',
    status: 'In Progress',
    allocatorType: 'Director',
    allocatedById: 'DIR-001',
    allocatedByName: 'Muhammed Rafeeh',
    allocatedByRole: 'Managing Director & Principal Executive',
    assignedToStaffId: 'CB/104/003',
    assignedToName: 'Arvind Menon',
    assignedToRole: 'Lead Security & DevOps Engineer',
    assignedToDepartment: 'Engineering & IT',
    assignedToEmail: 'arvind.menon@mysar.com',
    supportingAssignees: [
      { staffId: 'CB/104/007', name: 'Naveen Kumar', role: 'System Administrator' },
    ],
    startDate: '2026-10-01',
    dueDate: '2026-10-25',
    dueTime: '17:00',
    estimatedHours: 40,
    actualHoursSpent: 26,
    progress: 65,
    deliverableNotes: 'Firewall rules evaluated and privilege escalation vulnerabilities patched. Pen-test report 80% drafted.',
    deliverableLink: 'https://docs.mysar.internal/sec-audit-q4',
    checklists: [
      { id: 'chk-1', title: 'Audit AWS & GCP IAM user credentials and MFA enforcement', completed: true, completedAt: '2026-10-04', completedBy: 'Arvind Menon' },
      { id: 'chk-2', title: 'Scan container registries and dependencies for CVE patches', completed: true, completedAt: '2026-10-08', completedBy: 'Arvind Menon' },
      { id: 'chk-3', title: 'Conduct simulated external phishing and penetration test', completed: true, completedAt: '2026-10-12', completedBy: 'Arvind Menon' },
      { id: 'chk-4', title: 'Prepare disaster recovery failover drill logs for auditors', completed: false },
      { id: 'chk-5', title: 'Compile Final ISO 27001 Internal Review Document', completed: false },
    ],
    tags: ['Security', 'ISO-Audit', 'DevOps', 'Critical'],
    activityLog: [
      {
        id: 'act-1',
        timestamp: '2026-10-01 09:30',
        actorName: 'Muhammed Rafeeh',
        actorRole: 'Director',
        action: 'Task Allocated',
        notes: 'Assigned as high-priority strategic deliverable ahead of November regulatory audit.',
      },
      {
        id: 'act-2',
        timestamp: '2026-10-08 14:15',
        actorName: 'Arvind Menon',
        actorRole: 'Employee',
        action: 'Progress Updated',
        notes: 'IAM & Container CVE scanning completed. Security baseline score at 94%.',
      },
      {
        id: 'act-3',
        timestamp: '2026-10-12 18:00',
        actorName: 'Arvind Menon',
        actorRole: 'Employee',
        action: 'Progress Updated',
        notes: 'Penetration test report drafted. Proceeding with disaster recovery test.',
      },
    ],
    createdAt: '2026-10-01',
    updatedAt: '2026-10-12',
  },
  {
    id: 'TSK-2026-002',
    title: 'Financial Statements Consolidation & FY Statutory Tax Filing Preparation',
    description: 'Reconcile inter-branch balances across Kochi and Calicut operations, calculate TDS and Advance Corporate Tax obligations, verify bank reconciliation ledgers, and prepare executive profit & loss summaries for the board.',
    category: 'Finance & Accounts',
    department: 'Finance & Accounts',
    departmentCode: '103',
    priority: 'High',
    status: 'Under Review',
    allocatorType: 'Director',
    allocatedById: 'DIR-002',
    allocatedByName: 'Dr. Ramesh Nambiar',
    allocatedByRole: 'Director of Finance & Operations',
    assignedToStaffId: 'CB/103/002',
    assignedToName: 'Siddharth Verma',
    assignedToRole: 'Senior Financial Controller',
    assignedToDepartment: 'Finance & Accounts',
    assignedToEmail: 'siddharth.v@mysar.com',
    supportingAssignees: [
      { staffId: 'CB/103/005', name: 'Divya Pillai', role: 'Staff Accountant' },
    ],
    startDate: '2026-10-05',
    dueDate: '2026-10-18',
    dueTime: '18:00',
    estimatedHours: 35,
    actualHoursSpent: 32,
    progress: 90,
    deliverableNotes: 'All ledger books reconciled with 100% bank statement matching. Trial Balance, P&L, and Advance Tax schedules ready for Director review.',
    deliverableLink: 'https://finance.mysar.internal/audit/fy2026-q3-recon',
    checklists: [
      { id: 'chk-201', title: 'Complete monthly bank reconciliations across all corporate accounts', completed: true, completedAt: '2026-10-08', completedBy: 'Divya Pillai' },
      { id: 'chk-202', title: 'Verify TDS challan payments and quarterly Form 24Q/26Q reconciliations', completed: true, completedAt: '2026-10-11', completedBy: 'Siddharth Verma' },
      { id: 'chk-203', title: 'Inter-branch fund transfers and asset ledger reconciliation', completed: true, completedAt: '2026-10-13', completedBy: 'Siddharth Verma' },
      { id: 'chk-204', title: 'Executive Board P&L summary presentation and Director sign-off', completed: false },
    ],
    tags: ['Finance', 'Taxation', 'Audit', 'Statutory'],
    activityLog: [
      {
        id: 'act-201',
        timestamp: '2026-10-05 10:00',
        actorName: 'Dr. Ramesh Nambiar',
        actorRole: 'Director',
        action: 'Task Allocated',
        notes: 'Statutory compliance deadline approaching. Please ensure zero variance across ledgers.',
      },
      {
        id: 'act-202',
        timestamp: '2026-10-13 16:45',
        actorName: 'Siddharth Verma',
        actorRole: 'Employee',
        action: 'Submitted for Review',
        notes: 'Completed reconciliation schedules. Submitted for Director of Finance final sign-off.',
      },
    ],
    createdAt: '2026-10-05',
    updatedAt: '2026-10-13',
  },
  {
    id: 'TSK-2026-003',
    title: 'Deploy Client Onboarding & Proposal Workflow v2.4 Release',
    description: 'Implement multi-tier approval gates for high-value proposals (> ₹5,00,000), optimize PDF export rendering performance on mobile browsers, and configure webhook triggers for real-time CRM updates.',
    category: 'IT & Engineering',
    department: 'Engineering & IT',
    departmentCode: '104',
    priority: 'High',
    status: 'In Progress',
    allocatorType: 'Department Manager',
    allocatedById: 'MGR-104',
    allocatedByName: 'K. G. Menon',
    allocatedByRole: 'Head of Department - Engineering & Tech',
    assignedToStaffId: 'CB/104/005',
    assignedToName: 'Pooja Hegde',
    assignedToRole: 'Full Stack Software Engineer',
    assignedToDepartment: 'Engineering & IT',
    assignedToEmail: 'pooja.hegde@mysar.com',
    startDate: '2026-10-08',
    dueDate: '2026-10-22',
    dueTime: '16:00',
    estimatedHours: 30,
    actualHoursSpent: 15,
    progress: 50,
    deliverableNotes: 'Backend approval gate logic merged in staging. Working on responsive PDF renderer.',
    checklists: [
      { id: 'chk-301', title: 'Design multi-stage approval schema in database', completed: true, completedAt: '2026-10-10', completedBy: 'Pooja Hegde' },
      { id: 'chk-302', title: 'Implement approval notifications in Header dropdown', completed: true, completedAt: '2026-10-12', completedBy: 'Pooja Hegde' },
      { id: 'chk-303', title: 'Fix mobile PDF signature overflow issue on WebKit browsers', completed: false },
      { id: 'chk-304', title: 'Staging deployment & QA test execution', completed: false },
    ],
    tags: ['Engineering', 'Release-v2.4', 'CRM', 'ClientPortal'],
    activityLog: [
      {
        id: 'act-301',
        timestamp: '2026-10-08 11:30',
        actorName: 'K. G. Menon',
        actorRole: 'Department Manager',
        action: 'Task Allocated',
        notes: 'Priority engineering deliverable as requested by commercial team.',
      },
    ],
    createdAt: '2026-10-08',
    updatedAt: '2026-10-12',
  },
  {
    id: 'TSK-2026-004',
    title: 'Comprehensive Annual Medical Insurance & Group Gratuity Policy Renewal',
    description: 'Negotiate premium rates with empaneled health insurance underwriters for 140 corporate staff, collect updated dependent beneficiary nomination forms, and configure digital claims helpline cards.',
    category: 'Human Resources',
    department: 'Human Resources',
    departmentCode: '105',
    priority: 'Medium',
    status: 'Completed',
    allocatorType: 'Director',
    allocatedById: 'DIR-001',
    allocatedByName: 'Muhammed Rafeeh',
    allocatedByRole: 'Managing Director',
    assignedToStaffId: 'CB/105/002',
    assignedToName: 'Kavya Nair',
    assignedToRole: 'Senior HR Generalist & Benefits Lead',
    assignedToDepartment: 'Human Resources',
    assignedToEmail: 'kavya.nair@mysar.com',
    startDate: '2026-09-20',
    dueDate: '2026-10-10',
    dueTime: '17:00',
    estimatedHours: 25,
    actualHoursSpent: 24,
    progress: 100,
    deliverableNotes: 'Renewed group policy at 8.5% negotiated discount. Digital health cards dispatched to 140 employees with cashless hospitalization coverage.',
    deliverableLink: 'https://hr.mysar.internal/benefits/group-policy-2026',
    checklists: [
      { id: 'chk-401', title: 'Compile staff census data with age groups and dependent details', completed: true, completedAt: '2026-09-25', completedBy: 'Kavya Nair' },
      { id: 'chk-402', title: 'Obtain comparative quotes from 3 insurance carriers', completed: true, completedAt: '2026-09-30', completedBy: 'Kavya Nair' },
      { id: 'chk-403', title: 'Obtain Director approval for selected insurer terms', completed: true, completedAt: '2026-10-04', completedBy: 'Muhammed Rafeeh' },
      { id: 'chk-404', title: 'Dispatch digital e-cards to staff portal and setup WhatsApp claims desk', completed: true, completedAt: '2026-10-09', completedBy: 'Kavya Nair' },
    ],
    tags: ['HR', 'Insurance', 'Benefits', 'StaffCare'],
    completionRating: 5,
    reviewRemarks: 'Flawlessly coordinated. Achieved better coverage terms while reducing overall cost exposure.',
    reviewedByName: 'Muhammed Rafeeh',
    reviewedAt: '2026-10-10 16:30',
    activityLog: [
      {
        id: 'act-401',
        timestamp: '2026-09-20 10:00',
        actorName: 'Muhammed Rafeeh',
        actorRole: 'Director',
        action: 'Task Allocated',
        notes: 'Annual policy expiry on Oct 15. Ensure uninterrupted coverage for all employees.',
      },
      {
        id: 'act-402',
        timestamp: '2026-10-09 17:00',
        actorName: 'Kavya Nair',
        actorRole: 'Employee',
        action: 'Submitted for Review',
        notes: 'All 140 policies active. Digital cards deployed.',
      },
      {
        id: 'act-403',
        timestamp: '2026-10-10 16:30',
        actorName: 'Muhammed Rafeeh',
        actorRole: 'Director',
        action: 'Task Approved & Completed',
        notes: 'Approved with 5-star rating.',
      },
    ],
    createdAt: '2026-09-20',
    updatedAt: '2026-10-10',
  },
  {
    id: 'TSK-2026-005',
    title: 'GCC Regional Logistics & Multi-Warehouse Supply Chain RFP Proposal',
    description: 'Prepare strategic tender response and freight cost structure for regional client delivery network, calculate minimum safety buffer stock thresholds, and secure quotes from 3 bonded logistics partners.',
    category: 'Operational',
    department: 'Operations',
    departmentCode: '101',
    priority: 'Critical',
    status: 'In Progress',
    allocatorType: 'Director',
    allocatedById: 'DIR-002',
    allocatedByName: 'Dr. Ramesh Nambiar',
    allocatedByRole: 'Director of Operations',
    assignedToStaffId: 'CB/101/004',
    assignedToName: 'Rahul Krishnan',
    assignedToRole: 'Operations & Procurement Specialist',
    assignedToDepartment: 'Operations',
    assignedToEmail: 'rahul.k@mysar.com',
    supportingAssignees: [
      { staffId: 'CB/101/008', name: 'Anjali Nair', role: 'Inventory Coordinator' },
    ],
    startDate: '2026-10-06',
    dueDate: '2026-10-20',
    dueTime: '15:00',
    estimatedHours: 45,
    actualHoursSpent: 18,
    progress: 40,
    deliverableNotes: 'Freight benchmark matrix prepared for UAE, Saudi, and Oman routes. Reviewing bonded warehouse storage rates.',
    checklists: [
      { id: 'chk-501', title: 'Collate historical freight costs and shipping transit times', completed: true, completedAt: '2026-10-09', completedBy: 'Rahul Krishnan' },
      { id: 'chk-502', title: 'Issue Request for Quotation (RFQ) to 3 3PL logistics carriers', completed: true, completedAt: '2026-10-11', completedBy: 'Rahul Krishnan' },
      { id: 'chk-503', title: 'Build landed cost simulator spreadsheet with customs duty tariffs', completed: false },
      { id: 'chk-504', title: 'Submit final executive proposal to Director of Operations', completed: false },
    ],
    tags: ['SupplyChain', 'Logistics', 'Procurement', 'Regional'],
    activityLog: [
      {
        id: 'act-501',
        timestamp: '2026-10-06 09:00',
        actorName: 'Dr. Ramesh Nambiar',
        actorRole: 'Director',
        action: 'Task Allocated',
        notes: 'Critical for Q1 regional distribution contract. Keep delivery ETA under 48 hours.',
      },
    ],
    createdAt: '2026-10-06',
    updatedAt: '2026-10-11',
  },
  {
    id: 'TSK-2026-006',
    title: 'Enterprise Key Account SLA Agreement - Al Amal Holdings',
    description: 'Finalize multi-year contract revisions, confirm volume-discount pricing schedules with sales engineering, and coordinate authorized legal signatures on final SLA documentation.',
    category: 'Sales & Pipeline',
    department: 'Sales & Marketing',
    departmentCode: '106',
    priority: 'High',
    status: 'Completed',
    allocatorType: 'Department Manager',
    allocatedById: 'MGR-106',
    allocatedByName: 'Vikram Seth',
    allocatedByRole: 'Head of Sales & Business Development',
    assignedToStaffId: 'CB/106/001',
    assignedToName: 'Farhan Akhtar',
    assignedToRole: 'Enterprise Account Executive',
    assignedToDepartment: 'Sales & Marketing',
    assignedToEmail: 'farhan.a@mysar.com',
    startDate: '2026-09-28',
    dueDate: '2026-10-07',
    dueTime: '17:00',
    estimatedHours: 20,
    actualHoursSpent: 19,
    progress: 100,
    deliverableNotes: 'SLA finalized, signed by Client CEO and MYSAR MD. Deal value ₹34,50,000 booked.',
    deliverableLink: 'https://crm.mysar.internal/proposals/PRP-2026-089',
    checklists: [
      { id: 'chk-601', title: 'Review SLA terms with client procurement director', completed: true, completedAt: '2026-10-01', completedBy: 'Farhan Akhtar' },
      { id: 'chk-602', title: 'Obtain Director price discount approval (Tier 3)', completed: true, completedAt: '2026-10-03', completedBy: 'Vikram Seth' },
      { id: 'chk-603', title: 'Execute counter-signatures on corporate agreement', completed: true, completedAt: '2026-10-06', completedBy: 'Farhan Akhtar' },
    ],
    tags: ['Sales', 'EnterpriseSLA', 'HighValue', 'Contract'],
    completionRating: 5,
    reviewRemarks: 'Excellent execution on a high-value enterprise contract.',
    reviewedByName: 'Vikram Seth',
    reviewedAt: '2026-10-07 18:00',
    activityLog: [
      {
        id: 'act-601',
        timestamp: '2026-09-28 10:00',
        actorName: 'Vikram Seth',
        actorRole: 'Department Manager',
        action: 'Task Allocated',
        notes: 'Target closure before end of Q3.',
      },
      {
        id: 'act-602',
        timestamp: '2026-10-07 18:00',
        actorName: 'Vikram Seth',
        actorRole: 'Department Manager',
        action: 'Task Approved & Completed',
        notes: 'Account closed successfully.',
      },
    ],
    createdAt: '2026-09-28',
    updatedAt: '2026-10-07',
  },
  {
    id: 'TSK-2026-007',
    title: 'Q3 Staff Performance Appraisal Data Consolidation & 360 Review Metric Sheets',
    description: 'Collate manager evaluation ratings across all 6 departments, verify peer review submissions, calculate department-wise score distribution graphs, and prepare compensation adjustment recommendations for the board.',
    category: 'Strategic & Executive',
    department: 'Human Resources',
    departmentCode: '105',
    priority: 'Medium',
    status: 'Assigned',
    allocatorType: 'Department Manager',
    allocatedById: 'MGR-105',
    allocatedByName: 'Lakshmi Narayanan',
    allocatedByRole: 'Head of People & Culture',
    assignedToStaffId: 'CB/105/004',
    assignedToName: 'Meera Namboodiri',
    assignedToRole: 'HR Operations Assistant',
    assignedToDepartment: 'Human Resources',
    assignedToEmail: 'meera.n@mysar.com',
    startDate: '2026-10-12',
    dueDate: '2026-10-26',
    dueTime: '17:00',
    estimatedHours: 25,
    actualHoursSpent: 4,
    progress: 15,
    deliverableNotes: 'Evaluation templates sent to department heads. Reminder schedule active.',
    checklists: [
      { id: 'chk-701', title: 'Verify completeness of self-evaluation forms from all 140 staff', completed: true, completedAt: '2026-10-13', completedBy: 'Meera Namboodiri' },
      { id: 'chk-702', title: 'Follow-up with managers for pending performance evaluations', completed: false },
      { id: 'chk-703', title: 'Generate Bell-Curve distribution analysis and outlier report', completed: false },
      { id: 'chk-704', title: 'Compile Executive Presentation for Board of Directors', completed: false },
    ],
    tags: ['HR', 'Appraisal', 'KPI', 'Governance'],
    activityLog: [
      {
        id: 'act-701',
        timestamp: '2026-10-12 11:00',
        actorName: 'Lakshmi Narayanan',
        actorRole: 'Department Manager',
        action: 'Task Allocated',
        notes: 'Initiated bi-annual appraisal review consolidation.',
      },
    ],
    createdAt: '2026-10-12',
    updatedAt: '2026-10-13',
  },
  {
    id: 'TSK-2026-008',
    title: 'Disaster Recovery Warm-Standby Cloud Node Sync & Failover Verification',
    description: 'Conduct live replication test from primary India cloud zone to secondary Singapore disaster recovery instance, measure RTO and RPO benchmarks, and produce cryptographic backup hash verification report.',
    category: 'IT & Engineering',
    department: 'Engineering & IT',
    departmentCode: '104',
    priority: 'Critical',
    status: 'In Progress',
    allocatorType: 'Director',
    allocatedById: 'DIR-001',
    allocatedByName: 'Muhammed Rafeeh',
    allocatedByRole: 'Managing Director',
    assignedToStaffId: 'CB/104/007',
    assignedToName: 'Naveen Kumar',
    assignedToRole: 'Senior Cloud Systems Administrator',
    assignedToDepartment: 'Engineering & IT',
    assignedToEmail: 'naveen.k@mysar.com',
    startDate: '2026-10-10',
    dueDate: '2026-10-19',
    dueTime: '22:00',
    estimatedHours: 20,
    actualHoursSpent: 14,
    progress: 70,
    deliverableNotes: 'Warm-standby node successfully synced. RPO benchmark achieved: 42 seconds (well within SLA of 5 mins).',
    checklists: [
      { id: 'chk-801', title: 'Initiate incremental snapshot sync across data nodes', completed: true, completedAt: '2026-10-11', completedBy: 'Naveen Kumar' },
      { id: 'chk-802', title: 'Perform test DNS failover switch in isolated staging environment', completed: true, completedAt: '2026-10-13', completedBy: 'Naveen Kumar' },
      { id: 'chk-803', title: 'Verify database read-replica integrity and data consistency', completed: true, completedAt: '2026-10-14', completedBy: 'Naveen Kumar' },
      { id: 'chk-804', title: 'Simulate simulated client traffic on backup node and record metrics', completed: false },
    ],
    tags: ['DevOps', 'DisasterRecovery', 'Cloud', 'Critical'],
    activityLog: [
      {
        id: 'act-801',
        timestamp: '2026-10-10 14:00',
        actorName: 'Muhammed Rafeeh',
        actorRole: 'Director',
        action: 'Task Allocated',
        notes: 'Scheduled semi-annual cloud resilience audit.',
      },
    ],
    createdAt: '2026-10-10',
    updatedAt: '2026-10-14',
  },
];

class TaskAllocationStorageService {
  private dispatchEvent() {
    try {
      window.dispatchEvent(new CustomEvent(TASK_EVENT_NAME));
    } catch {}
  }

  public getTasks(): AllocatedTask[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to parse allocated tasks', e);
    }
    // Seed default tasks
    this.saveTasks(initialMockTasks);
    return initialMockTasks;
  }

  public saveTasks(tasks: AllocatedTask[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      this.dispatchEvent();
    } catch (e) {
      console.error('Failed to save tasks', e);
    }
  }

  public getTaskById(id: string): AllocatedTask | undefined {
    return this.getTasks().find((t) => t.id === id);
  }

  public generateNextTaskId(): string {
    const tasks = this.getTasks();
    const currentYear = new Date().getFullYear();
    let maxNum = 0;
    tasks.forEach((t) => {
      const match = t.id.match(/TSK-(\d{4})-(\d+)/);
      if (match) {
        const num = parseInt(match[2], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
    return `TSK-${currentYear}-${String(maxNum + 1).padStart(3, '0')}`;
  }

  public allocateTask(data: {
    title: string;
    description: string;
    category: TaskCategory;
    department: string;
    departmentCode?: string;
    priority: TaskPriority;
    allocatorType: 'Director' | 'Department Manager';
    allocatedById: string;
    allocatedByName: string;
    allocatedByRole: string;
    assignedToStaffId: string;
    assignedToName: string;
    assignedToRole: string;
    assignedToDepartment: string;
    assignedToEmail?: string;
    supportingAssignees?: { staffId: string; name: string; role: string }[];
    startDate: string;
    dueDate: string;
    dueTime?: string;
    estimatedHours: number;
    checklists: { title: string }[];
    tags: string[];
    actorName: string;
    actorRole: string;
    notes?: string;
  }): AllocatedTask {
    const tasks = this.getTasks();
    const newId = this.generateNextTaskId();
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const newTask: AllocatedTask = {
      id: newId,
      title: data.title,
      description: data.description,
      category: data.category,
      department: data.department,
      departmentCode: data.departmentCode,
      priority: data.priority,
      status: 'Assigned',
      allocatorType: data.allocatorType,
      allocatedById: data.allocatedById,
      allocatedByName: data.allocatedByName,
      allocatedByRole: data.allocatedByRole,
      assignedToStaffId: data.assignedToStaffId,
      assignedToName: data.assignedToName,
      assignedToRole: data.assignedToRole,
      assignedToDepartment: data.assignedToDepartment,
      assignedToEmail: data.assignedToEmail,
      supportingAssignees: data.supportingAssignees || [],
      startDate: data.startDate || today,
      dueDate: data.dueDate,
      dueTime: data.dueTime || '18:00',
      estimatedHours: data.estimatedHours || 8,
      actualHoursSpent: 0,
      progress: 0,
      deliverableNotes: '',
      checklists: (data.checklists || []).map((c, i) => ({
        id: `chk-${Date.now()}-${i}`,
        title: c.title,
        completed: false,
      })),
      tags: data.tags || [],
      activityLog: [
        {
          id: `act-${Date.now()}`,
          timestamp: `${today} ${nowTime}`,
          actorName: data.actorName,
          actorRole: data.actorRole,
          action: 'Task Allocated',
          notes: data.notes || `Allocated to ${data.assignedToName} (${data.assignedToRole}) by ${data.allocatedByName} (${data.allocatedByRole}).`,
        },
      ],
      createdAt: today,
      updatedAt: today,
    };

    const updated = [newTask, ...tasks];
    this.saveTasks(updated);
    return newTask;
  }

  public updateTask(
    id: string,
    updates: Partial<AllocatedTask>,
    actorName: string,
    actorRole: string,
    actionDesc = 'Task Updated',
    logNote?: string
  ): AllocatedTask | null {
    const tasks = this.getTasks();
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) return null;

    const current = tasks[idx];
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const newActivity: TaskActivityLog = {
      id: `act-${Date.now()}`,
      timestamp: `${today} ${nowTime}`,
      actorName,
      actorRole,
      action: actionDesc,
      notes: logNote || undefined,
    };

    const updatedTask: AllocatedTask = {
      ...current,
      ...updates,
      updatedAt: today,
      activityLog: [newActivity, ...(current.activityLog || [])],
    };

    tasks[idx] = updatedTask;
    this.saveTasks(tasks);
    return updatedTask;
  }

  public updateProgress(
    id: string,
    progress: number,
    actorName: string,
    actorRole: string,
    notes?: string,
    hoursSpent?: number
  ): AllocatedTask | null {
    const task = this.getTaskById(id);
    if (!task) return null;

    let newStatus = task.status;
    if (progress === 100 && task.status !== 'Under Review' && task.status !== 'Completed') {
      newStatus = 'Under Review'; // Needs Director or Manager verification
    } else if (progress > 0 && task.status === 'Assigned') {
      newStatus = 'In Progress';
    }

    const updates: Partial<AllocatedTask> = {
      progress: Math.min(100, Math.max(0, progress)),
      status: newStatus,
      deliverableNotes: notes !== undefined ? notes : task.deliverableNotes,
      actualHoursSpent: hoursSpent !== undefined ? (task.actualHoursSpent || 0) + hoursSpent : task.actualHoursSpent,
    };

    return this.updateTask(
      id,
      updates,
      actorName,
      actorRole,
      'Progress Updated',
      `Progress set to ${progress}%${hoursSpent ? ` (+${hoursSpent} hrs logged)` : ''}${notes ? `. Note: ${notes}` : ''}`
    );
  }

  public toggleChecklistItem(taskId: string, itemId: string, actorName: string, actorRole: string): AllocatedTask | null {
    const task = this.getTaskById(taskId);
    if (!task) return null;

    const item = task.checklists.find((c) => c.id === itemId);
    if (!item) return null;

    const nextCompleted = !item.completed;
    const today = new Date().toISOString().split('T')[0];

    const updatedChecklists = task.checklists.map((c) =>
      c.id === itemId
        ? {
            ...c,
            completed: nextCompleted,
            completedAt: nextCompleted ? today : undefined,
            completedBy: nextCompleted ? actorName : undefined,
          }
        : c
    );

    // Auto-calculate progress based on completed items if items exist
    const completedCount = updatedChecklists.filter((c) => c.completed).length;
    const calculatedProgress = Math.round((completedCount / updatedChecklists.length) * 100);

    let status = task.status;
    if (calculatedProgress === 100 && status !== 'Completed') {
      status = 'Under Review';
    } else if (calculatedProgress > 0 && status === 'Assigned') {
      status = 'In Progress';
    }

    return this.updateTask(
      taskId,
      {
        checklists: updatedChecklists,
        progress: calculatedProgress,
        status,
      },
      actorName,
      actorRole,
      nextCompleted ? 'Checklist Item Completed' : 'Checklist Item Unchecked',
      `Item: "${item.title}" (${completedCount}/${updatedChecklists.length} completed, ${calculatedProgress}%)`
    );
  }

  public submitForReview(
    taskId: string,
    deliverableNotes: string,
    deliverableLink: string | undefined,
    actorName: string,
    actorRole: string
  ): AllocatedTask | null {
    return this.updateTask(
      taskId,
      {
        status: 'Under Review',
        progress: 100,
        deliverableNotes,
        deliverableLink: deliverableLink || undefined,
      },
      actorName,
      actorRole,
      'Submitted for Manager / Director Review',
      deliverableNotes ? `Notes: ${deliverableNotes}` : 'Marked all requirements complete and submitted for sign-off.'
    );
  }

  public reviewTask(
    taskId: string,
    decision: 'Approve' | 'Revision',
    rating: number,
    remarks: string,
    reviewerName: string,
    reviewerRole: string
  ): AllocatedTask | null {
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    if (decision === 'Approve') {
      return this.updateTask(
        taskId,
        {
          status: 'Completed',
          progress: 100,
          completionRating: rating || 5,
          reviewRemarks: remarks,
          reviewedByName: reviewerName,
          reviewedAt: `${today} ${nowTime}`,
        },
        reviewerName,
        reviewerRole,
        'Task Approved & Completed',
        `Approved with rating ${rating}/5 stars. Remarks: ${remarks}`
      );
    } else {
      return this.updateTask(
        taskId,
        {
          status: 'Needs Revision',
          progress: 80,
          reviewRemarks: remarks,
          reviewedByName: reviewerName,
          reviewedAt: `${today} ${nowTime}`,
        },
        reviewerName,
        reviewerRole,
        'Revision Requested',
        `Changes required: ${remarks}`
      );
    }
  }

  public reassignTask(
    taskId: string,
    newAssignee: {
      staffId: string;
      name: string;
      role: string;
      department: string;
      email?: string;
    },
    actorName: string,
    actorRole: string,
    reason?: string
  ): AllocatedTask | null {
    const task = this.getTaskById(taskId);
    if (!task) return null;

    const prevName = task.assignedToName;

    return this.updateTask(
      taskId,
      {
        assignedToStaffId: newAssignee.staffId,
        assignedToName: newAssignee.name,
        assignedToRole: newAssignee.role,
        assignedToDepartment: newAssignee.department,
        assignedToEmail: newAssignee.email,
        status: 'Assigned',
      },
      actorName,
      actorRole,
      'Task Reallocated',
      `Reassigned from ${prevName} to ${newAssignee.name} (${newAssignee.role}). ${reason ? `Reason: ${reason}` : ''}`
    );
  }

  public deleteTask(id: string): boolean {
    const tasks = this.getTasks();
    const filtered = tasks.filter((t) => t.id !== id);
    if (filtered.length !== tasks.length) {
      this.saveTasks(filtered);
      return true;
    }
    return false;
  }

  public getMetrics() {
    const tasks = this.getTasks();
    const today = new Date().toISOString().split('T')[0];

    const total = tasks.length;
    const assigned = tasks.filter((t) => t.status === 'Assigned').length;
    const inProgress = tasks.filter((t) => t.status === 'In Progress' || t.status === 'Needs Revision').length;
    const underReview = tasks.filter((t) => t.status === 'Under Review').length;
    const completed = tasks.filter((t) => t.status === 'Completed').length;
    const critical = tasks.filter((t) => t.priority === 'Critical').length;
    const overdue = tasks.filter((t) => t.dueDate < today && t.status !== 'Completed' && t.status !== 'Cancelled').length;

    const totalProgress = tasks.reduce((sum, t) => sum + (t.progress || 0), 0);
    const avgProgress = total > 0 ? Math.round(totalProgress / total) : 0;

    const departmentMap: Record<string, { total: number; completed: number; inProgress: number }> = {};
    tasks.forEach((t) => {
      const dept = t.department || 'General';
      if (!departmentMap[dept]) {
        departmentMap[dept] = { total: 0, completed: 0, inProgress: 0 };
      }
      departmentMap[dept].total += 1;
      if (t.status === 'Completed') departmentMap[dept].completed += 1;
      if (t.status === 'In Progress' || t.status === 'Under Review') departmentMap[dept].inProgress += 1;
    });

    return {
      total,
      assigned,
      inProgress,
      underReview,
      completed,
      critical,
      overdue,
      avgProgress,
      departmentMap,
    };
  }
}

export const taskAllocationStorage = new TaskAllocationStorageService();
