import { AllocatedTask, TaskActivityLog, TaskChecklistItem, TaskPriority, TaskStatus, TaskCategory } from '../types/tasks';

const STORAGE_KEY = 'mysar_allocated_tasks_v1';
const TASK_EVENT_NAME = 'mysar_tasks_updated';

// Default to empty array - dummy data removed
const initialMockTasks: AllocatedTask[] = [];

export const isDummyTask = (t: AllocatedTask): boolean => {
  if (['TSK-2026-001', 'TSK-2026-002', 'TSK-2026-003', 'TSK-2026-004', 'TSK-2026-005', 'TSK-2026-006', 'TSK-2026-007', 'TSK-2026-008'].includes(t.id)) {
    return true;
  }
  if (/ISO 27001|GST reconciliation|Deploy Client Onboarding|POS invoice|Internal Q4 Audit|Security compliance|Vendor contracts|Audit Preparation/i.test(t.title || '')) {
    return true;
  }
  const dummyAssignees = [
    'Arvind Menon',
    'Pooja Hegde',
    'Siddharth Verma',
    'Kavya Nair',
    'Rahul Krishnan',
    'Farhan Akhtar',
    'Meera Namboodiri',
    'Naveen Kumar',
  ];
  if (dummyAssignees.includes(t.assignedToName)) {
    return true;
  }
  return false;
};

// Auto-purge any legacy dummy tasks from localStorage on initial load
try {
  const dummyPurged = localStorage.getItem('mysar_dummy_tasks_purged_v5');
  if (!dummyPurged) {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const filtered = Array.isArray(parsed) ? parsed.filter(t => !isDummyTask(t)) : [];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      } catch {}
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    }
    localStorage.setItem('mysar_dummy_tasks_purged_v5', 'true');
  }
} catch (e) {}

class TaskAllocationStorageService {
  private dispatchEvent() {
    try {
      window.dispatchEvent(new CustomEvent(TASK_EVENT_NAME));
    } catch {}
  }

  public getTasks(): AllocatedTask[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse allocated tasks', e);
    }
    this.saveTasks([]);
    return [];
  }

  public clearAllTasks(): void {
    this.saveTasks([]);
  }

  public clearDummyTasks(): void {
    const tasks = this.getTasks();
    const nonDummy = tasks.filter(t => !isDummyTask(t));
    this.saveTasks(nonDummy);
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
    const urgent = tasks.filter((t) => t.priority === 'Urgent' || t.priority === 'Critical').length;
    const critical = urgent;
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
      urgent,
      critical,
      overdue,
      avgProgress,
      departmentMap,
    };
  }
}

export const taskAllocationStorage = new TaskAllocationStorageService();
