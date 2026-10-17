export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent' | 'Critical';

export type TaskStatus =
  | 'Assigned'
  | 'In Progress'
  | 'Under Review'
  | 'Needs Revision'
  | 'Completed'
  | 'Overdue'
  | 'Cancelled';

export type TaskCategory =
  | 'Operational'
  | 'Client Project'
  | 'Compliance & Audit'
  | 'Administrative'
  | 'Finance & Accounts'
  | 'Sales & Pipeline'
  | 'IT & Engineering'
  | 'Human Resources'
  | 'Strategic & Executive'
  | 'General Corporate';

export interface TaskChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
}

export interface TaskActivityLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string; // 'Director' | 'Department Manager' | 'Employee' | 'Admin'
  action: string;
  notes?: string;
}

export interface AllocatedTask {
  id: string; // e.g. "TSK-2026-001"
  title: string;
  description: string;
  category: TaskCategory;
  department: string;
  departmentCode?: string;
  priority: TaskPriority;
  status: TaskStatus;
  
  // Allocator Info (Manager or Director)
  allocatorType: 'Director' | 'Department Manager';
  allocatedById: string; // Staff ID or User ID
  allocatedByName: string;
  allocatedByRole: string; // e.g. "Managing Director", "Finance Director", "Sales Department Manager"
  
  // Assignee Info
  assignedToStaffId: string;
  assignedToName: string;
  assignedToRole: string;
  assignedToDepartment: string;
  assignedToEmail?: string;
  supportingAssignees?: {
    staffId: string;
    name: string;
    role: string;
  }[];
  
  // Timeline & Effort
  startDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM
  estimatedHours: number;
  actualHoursSpent?: number;
  progress: number; // 0 to 100
  
  // Deliverables & Verification
  deliverableNotes?: string;
  deliverableLink?: string;
  checklists: TaskChecklistItem[];
  tags: string[];
  
  // Manager / Director Review & Appraisal
  reviewRemarks?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  completionRating?: number; // 1 - 5 stars
  
  // History & Audit
  activityLog: TaskActivityLog[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskFilterOptions {
  searchQuery: string;
  department: string;
  priority: string;
  status: string;
  category: string;
  scope: 'all' | 'assigned_to_me' | 'allocated_by_me' | 'my_department';
}
