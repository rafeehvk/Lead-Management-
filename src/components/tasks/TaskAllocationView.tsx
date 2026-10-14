import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  UserCheck,
  Shield,
  Layers,
  BarChart3,
  ListTodo,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  MoreVertical,
  Building2,
  Star,
  Users,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Sparkles,
  ArrowUpDown,
  Send,
  GripVertical,
  ArrowRightLeft,
  X,
  UserPlus,
} from 'lucide-react';
import { AllocatedTask, TaskPriority, TaskStatus, TaskCategory } from '../../types/tasks';
import { taskAllocationStorage } from '../../services/taskAllocationStorageService';
import { hrStorage } from '../../services/hrStorageService';
import { StaffMember, DepartmentMaster } from '../../types/hr';
import { User } from '../../types';
import { TaskAllocationModal } from './TaskAllocationModal';
import { TaskDetailModal } from './TaskDetailModal';

interface TaskAllocationViewProps {
  currentUser: User;
}

type ViewMode = 'board' | 'table' | 'workload' | 'analytics';

// Reliable default corporate roster ensuring employees exist for every department
const defaultStaffRoster: StaffMember[] = [
  {
    id: 'CB/101/001',
    staffCode: 'CB/101/001',
    fullName: 'Arvind Menon',
    position: 'Lead Sales Strategist',
    department: 'Sales & Business Development',
    departmentCode: '101',
    email: 'arvind.menon@mysar.com',
    gender: 'Male',
    contactNumber: '+91 98471 22334',
    whatsappNumber: '+91 98471 22334',
    joiningDate: '2023-01-15',
    division: 'Corporate',
    employmentType: 'Full Time',
    dateOfBirth: '1988-06-12',
    emergencyContact: { name: 'Suma Menon', relationship: 'Spouse', phone: '+91 98471 22335' },
    permanentAddress: { addressLine1: '42 MG Road', city: 'Kochi', state: 'Kerala', country: 'India', pinCode: '682001' },
    communicationAddress: { sameAsPermanent: true, addressLine1: '42 MG Road', city: 'Kochi', state: 'Kerala', country: 'India', pinCode: '682001' },
  },
  {
    id: 'CB/104/005',
    staffCode: 'CB/104/005',
    fullName: 'Pooja Hegde',
    position: 'Full Stack Software Engineer',
    department: 'Engineering & IT',
    departmentCode: '104',
    email: 'pooja.hegde@mysar.com',
    gender: 'Female',
    contactNumber: '+91 98471 44556',
    whatsappNumber: '+91 98471 44556',
    joiningDate: '2023-04-10',
    division: 'Technology',
    employmentType: 'Full Time',
    dateOfBirth: '1993-09-22',
    emergencyContact: { name: 'K. Hegde', relationship: 'Father', phone: '+91 98471 44557' },
    permanentAddress: { addressLine1: '12 Infopark Way', city: 'Kochi', state: 'Kerala', country: 'India', pinCode: '682042' },
    communicationAddress: { sameAsPermanent: true, addressLine1: '12 Infopark Way', city: 'Kochi', state: 'Kerala', country: 'India', pinCode: '682042' },
  },
  {
    id: 'CB/102/002',
    staffCode: 'CB/102/002',
    fullName: 'Siddharth Verma',
    position: 'Senior Accountant',
    department: 'Finance & Accounts',
    departmentCode: '102',
    email: 'siddharth.verma@mysar.com',
    gender: 'Male',
    contactNumber: '+91 98471 33445',
    whatsappNumber: '+91 98471 33445',
    joiningDate: '2022-11-01',
    division: 'Finance',
    employmentType: 'Full Time',
    dateOfBirth: '1990-03-18',
    emergencyContact: { name: 'Sunita Verma', relationship: 'Mother', phone: '+91 98471 33446' },
    permanentAddress: { addressLine1: '88 Marine Drive', city: 'Kochi', state: 'Kerala', country: 'India', pinCode: '682031' },
    communicationAddress: { sameAsPermanent: true, addressLine1: '88 Marine Drive', city: 'Kochi', state: 'Kerala', country: 'India', pinCode: '682031' },
  },
  {
    id: 'CB/103/003',
    staffCode: 'CB/103/003',
    fullName: 'Kavya Nair',
    position: 'Senior HR Specialist',
    department: 'Human Resources',
    departmentCode: '103',
    email: 'kavya.nair@mysar.com',
    gender: 'Female',
    contactNumber: '+91 98471 55667',
    whatsappNumber: '+91 98471 55667',
    joiningDate: '2023-02-01',
    division: 'Operations',
    employmentType: 'Full Time',
    dateOfBirth: '1992-12-05',
    emergencyContact: { name: 'Madhavan Nair', relationship: 'Father', phone: '+91 98471 55668' },
    permanentAddress: { addressLine1: '14 Panampilly Nagar', city: 'Kochi', state: 'Kerala', country: 'India', pinCode: '682036' },
    communicationAddress: { sameAsPermanent: true, addressLine1: '14 Panampilly Nagar', city: 'Kochi', state: 'Kerala', country: 'India', pinCode: '682036' },
  },
  {
    id: 'CB/105/004',
    staffCode: 'CB/105/004',
    fullName: 'Rahul Krishnan',
    position: 'Inventory & Logistics Lead',
    department: 'Inventory & Stock',
    departmentCode: '105',
    email: 'rahul.krishnan@mysar.com',
    gender: 'Male',
    contactNumber: '+91 98471 66778',
    whatsappNumber: '+91 98471 66778',
    joiningDate: '2023-03-15',
    division: 'Logistics',
    employmentType: 'Full Time',
    dateOfBirth: '1991-08-30',
    emergencyContact: { name: 'Geetha Krishnan', relationship: 'Mother', phone: '+91 98471 66779' },
    permanentAddress: { addressLine1: '23 Willingdon Island', city: 'Kochi', state: 'Kerala', country: 'India', pinCode: '682003' },
    communicationAddress: { sameAsPermanent: true, addressLine1: '23 Willingdon Island', city: 'Kochi', state: 'Kerala', country: 'India', pinCode: '682003' },
  },
  {
    id: 'CB/105/007',
    staffCode: 'CB/105/007',
    fullName: 'Farhan Akhtar',
    position: 'Procurement Specialist',
    department: 'Purchases & Procurement',
    departmentCode: '105',
    email: 'farhan.akhtar@mysar.com',
    gender: 'Male',
    contactNumber: '+91 98471 77889',
    whatsappNumber: '+91 98471 77889',
    joiningDate: '2023-05-20',
    division: 'Procurement',
    employmentType: 'Full Time',
    dateOfBirth: '1994-01-14',
    emergencyContact: { name: 'Zoya Akhtar', relationship: 'Sister', phone: '+91 98471 77890' },
    permanentAddress: { addressLine1: '5 Kakkanad Hub', city: 'Kochi', state: 'Kerala', country: 'India', pinCode: '682030' },
    communicationAddress: { sameAsPermanent: true, addressLine1: '5 Kakkanad Hub', city: 'Kochi', state: 'Kerala', country: 'India', pinCode: '682030' },
  },
  {
    id: 'CB/104/008',
    staffCode: 'CB/104/008',
    fullName: 'Meera Namboodiri',
    position: 'Quality Assurance Lead',
    department: 'Engineering & IT',
    departmentCode: '104',
    email: 'meera.namboodiri@mysar.com',
    gender: 'Female',
    contactNumber: '+91 98471 88990',
    whatsappNumber: '+91 98471 88990',
    joiningDate: '2023-06-01',
    division: 'Technology',
    employmentType: 'Full Time',
    dateOfBirth: '1995-04-19',
    emergencyContact: { name: 'Vasudevan Namboodiri', relationship: 'Father', phone: '+91 98471 88991' },
    permanentAddress: { addressLine1: '18 Aluva Road', city: 'Kochi', state: 'Kerala', country: 'India', pinCode: '683101' },
    communicationAddress: { sameAsPermanent: true, addressLine1: '18 Aluva Road', city: 'Kochi', state: 'Kerala', country: 'India', pinCode: '683101' },
  },
  {
    id: 'CB/106/009',
    staffCode: 'CB/106/009',
    fullName: 'Naveen Kumar',
    position: 'Operations Coordinator',
    department: 'Operations',
    departmentCode: '106',
    email: 'naveen.kumar@mysar.com',
    gender: 'Male',
    contactNumber: '+91 98471 99001',
    whatsappNumber: '+91 98471 99001',
    joiningDate: '2023-07-15',
    division: 'Operations',
    employmentType: 'Full Time',
    dateOfBirth: '1993-11-28',
    emergencyContact: { name: 'Radha Kumar', relationship: 'Mother', phone: '+91 98471 99002' },
    permanentAddress: { addressLine1: '9 Thoppumpady', city: 'Kochi', state: 'Kerala', country: 'India', pinCode: '682005' },
    communicationAddress: { sameAsPermanent: true, addressLine1: '9 Thoppumpady', city: 'Kochi', state: 'Kerala', country: 'India', pinCode: '682005' },
  },
] as StaffMember[];

export const TaskAllocationView: React.FC<TaskAllocationViewProps> = ({ currentUser }) => {
  const [tasks, setTasks] = useState<AllocatedTask[]>(() => taskAllocationStorage.getTasks());
  const [departments, setDepartments] = useState<DepartmentMaster[]>(() => hrStorage.getDepartmentsMaster());
  const [staffList, setStaffList] = useState<StaffMember[]>(() => hrStorage.getStaff());

  // Listen to custom updates
  useEffect(() => {
    const handleUpdate = () => {
      setTasks(taskAllocationStorage.getTasks());
      setStaffList(hrStorage.getStaff());
    };
    window.addEventListener('mysar_tasks_updated', handleUpdate);
    return () => window.removeEventListener('mysar_tasks_updated', handleUpdate);
  }, []);

  // Role Detection
  const isDirector =
    currentUser.role === 'Admin' ||
    currentUser.accessLevel === 'Executive' ||
    /director|md|principal|ceo/i.test(currentUser.name || '') ||
    /director|md|principal|ceo/i.test(currentUser.userType || '');

  const isDeptManager =
    currentUser.role === 'Manager' ||
    /manager|lead|head/i.test(currentUser.role || '') ||
    /manager|lead|head/i.test(currentUser.userType || '');

  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'allocated_by_me' | 'assigned_to_me' | 'my_dept'>('all');

  // Modals
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<AllocatedTask | null>(null);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<AllocatedTask | null>(null);

  // Drag and Drop & Reassignment State
  const [boardGrouping, setBoardGrouping] = useState<'status' | 'employee'>('employee');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTargetId, setDragOverTargetId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(null);
  const [employeeFilterQuery, setEmployeeFilterQuery] = useState('');

  // Quick Reassign Dialog State
  const [reassignModalTask, setReassignModalTask] = useState<AllocatedTask | null>(null);
  const [targetEmployeeId, setTargetEmployeeId] = useState<string>('');
  const [reassignNotes, setReassignNotes] = useState<string>('');

  // Effective staff list combining HR records and default roster
  const effectiveStaffList = useMemo(() => {
    const list = staffList && staffList.length > 0 ? [...staffList] : [];
    defaultStaffRoster.forEach((def) => {
      if (!list.some((s) => s.id === def.id || s.fullName.toLowerCase() === def.fullName.toLowerCase())) {
        list.push(def);
      }
    });
    return list;
  }, [staffList]);

  // Active staff filtered by department and search query
  const activeStaffList = useMemo(() => {
    let list = effectiveStaffList;
    if (selectedDept && selectedDept !== 'All') {
      list = list.filter(
        (s) =>
          s.department?.toLowerCase() === selectedDept.toLowerCase() ||
          s.departmentCode?.toLowerCase() === selectedDept.toLowerCase()
      );
    }
    if (employeeFilterQuery.trim()) {
      const q = employeeFilterQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.position.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [effectiveStaffList, selectedDept, employeeFilterQuery]);

  // Currently dragged task object
  const draggedTask = useMemo(() => {
    if (!draggedTaskId) return null;
    return tasks.find((t) => t.id === draggedTaskId) || null;
  }, [tasks, draggedTaskId]);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverTargetId(null);
  };

  const handleDropOnEmployee = (staff: StaffMember, specificTaskId?: string, customReason?: string) => {
    const taskIdToUse = specificTaskId || draggedTaskId;
    if (!taskIdToUse) return;

    const task = tasks.find((t) => t.id === taskIdToUse);
    if (!task) return;

    if (task.assignedToStaffId === staff.id) {
      setDragOverTargetId(null);
      setDraggedTaskId(null);
      return;
    }

    const previousAssigneeName = task.assignedToName;
    const reasonText = customReason || 'Drag-and-Drop reassignment by management';

    const updated = taskAllocationStorage.reassignTask(
      taskIdToUse,
      {
        staffId: staff.id,
        name: staff.fullName,
        role: staff.position,
        department: staff.department,
        email: staff.email,
      },
      currentUser.name || (isDirector ? 'Managing Director' : 'Department Manager'),
      isDirector ? 'Director' : 'Department Manager',
      reasonText
    );

    if (updated) {
      setToastMessage({
        type: 'success',
        text: `✓ Reassigned ${task.id} (${task.title.slice(0, 30)}...) from ${previousAssigneeName} to ${staff.fullName} (${staff.position})`,
      });
      setTimeout(() => setToastMessage(null), 4500);
      setTasks(taskAllocationStorage.getTasks());
    }

    setDragOverTargetId(null);
    setDraggedTaskId(null);
  };

  const handleConfirmReassignModal = () => {
    if (!reassignModalTask || !targetEmployeeId) return;
    const targetStaff = effectiveStaffList.find((s) => s.id === targetEmployeeId);
    if (!targetStaff) return;

    handleDropOnEmployee(targetStaff, reassignModalTask.id, reassignNotes);
    setReassignModalTask(null);
    setTargetEmployeeId('');
    setReassignNotes('');
  };

  const handleDropOnStatus = (newStatus: TaskStatus, specificTaskId?: string) => {
    const taskIdToUse = specificTaskId || draggedTaskId;
    if (!taskIdToUse) return;

    const task = tasks.find((t) => t.id === taskIdToUse);
    if (!task || task.status === newStatus) {
      setDragOverTargetId(null);
      setDraggedTaskId(null);
      return;
    }

    let progress = task.progress;
    if (newStatus === 'Completed') progress = 100;
    else if (newStatus === 'Assigned' && progress === 100) progress = 0;
    else if (newStatus === 'In Progress' && progress === 0) progress = 25;

    const updated = taskAllocationStorage.updateTask(
      taskIdToUse,
      { status: newStatus, progress },
      currentUser.name || 'Manager',
      isDirector ? 'Director' : 'Department Manager',
      `Status changed to ${newStatus} via Drag-and-Drop`
    );

    if (updated) {
      setToastMessage({
        type: 'success',
        text: `✓ Moved ${task.id} to ${newStatus}`,
      });
      setTimeout(() => setToastMessage(null), 3500);
      setTasks(taskAllocationStorage.getTasks());
    }

    setDragOverTargetId(null);
    setDraggedTaskId(null);
  };

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Scope filter
      if (scopeFilter === 'allocated_by_me') {
        const matchesName = task.allocatedByName?.toLowerCase() === currentUser.name?.toLowerCase();
        const matchesId = currentUser.staffId && task.allocatedById === currentUser.staffId;
        if (!matchesName && !matchesId) return false;
      } else if (scopeFilter === 'assigned_to_me') {
        const matchesName = task.assignedToName?.toLowerCase() === currentUser.name?.toLowerCase();
        const matchesId = currentUser.staffId && task.assignedToStaffId === currentUser.staffId;
        if (!matchesName && !matchesId) return false;
      } else if (scopeFilter === 'my_dept') {
        if (currentUser.department && task.department?.toLowerCase() !== currentUser.department.toLowerCase()) {
          return false;
        }
      }

      // Department filter
      if (selectedDept !== 'All' && task.department !== selectedDept) {
        return false;
      }

      // Priority filter
      if (selectedPriority !== 'All' && task.priority !== selectedPriority) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'All') {
        if (selectedStatus === 'Overdue') {
          const today = new Date().toISOString().split('T')[0];
          if (task.dueDate >= today || task.status === 'Completed' || task.status === 'Cancelled') {
            return false;
          }
        } else if (task.status !== selectedStatus) {
          return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchId = task.id.toLowerCase().includes(q);
        const matchAssignee = task.assignedToName.toLowerCase().includes(q);
        const matchAllocator = task.allocatedByName.toLowerCase().includes(q);
        const matchDept = task.department.toLowerCase().includes(q);
        const matchTags = task.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchId && !matchAssignee && !matchAllocator && !matchDept && !matchTags) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, scopeFilter, selectedDept, selectedPriority, selectedStatus, searchQuery, currentUser]);

  // Key Metrics
  const metrics = useMemo(() => {
    return taskAllocationStorage.getMetrics();
  }, [tasks]);

  // Export to CSV
  const handleExportCsv = () => {
    if (!filteredTasks.length) {
      alert('No allocated tasks available to export.');
      return;
    }

    const headers = [
      'Task ID',
      'Title',
      'Category',
      'Department',
      'Priority',
      'Status',
      'Allocation Authority',
      'Allocated By',
      'Signatory Role',
      'Assigned Employee ID',
      'Assigned Employee Name',
      'Employee Role',
      'Start Date',
      'Due Date',
      'Due Time',
      'Estimated Hours',
      'Actual Hours',
      'Progress %',
      'Completion Rating (Stars)',
      'Review Remarks',
      'Reviewed By',
      'Deliverable URL',
      'Created Date',
    ];

    const rows = filteredTasks.map((t) => [
      `"${t.id}"`,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${t.category || ''}"`,
      `"${t.department || ''}"`,
      `"${t.priority || ''}"`,
      `"${t.status || ''}"`,
      `"${t.allocatorType || ''}"`,
      `"${(t.allocatedByName || '').replace(/"/g, '""')}"`,
      `"${(t.allocatedByRole || '').replace(/"/g, '""')}"`,
      `"${t.assignedToStaffId || ''}"`,
      `"${(t.assignedToName || '').replace(/"/g, '""')}"`,
      `"${(t.assignedToRole || '').replace(/"/g, '""')}"`,
      `"${t.startDate || ''}"`,
      `"${t.dueDate || ''}"`,
      `"${t.dueTime || ''}"`,
      t.estimatedHours || 0,
      t.actualHoursSpent || 0,
      `${t.progress || 0}%`,
      t.completionRating ? `${t.completionRating}/5` : 'N/A',
      `"${(t.reviewRemarks || '').replace(/"/g, '""')}"`,
      `"${t.reviewedByName || ''}"`,
      `"${t.deliverableLink || ''}"`,
      `"${t.createdAt || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `MYSAR_Employee_Task_Allocation_Report_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDeleteTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to permanently delete task ${taskId}?`)) {
      taskAllocationStorage.deleteTask(taskId);
    }
  };

  // Grouping for Board columns
  const boardColumns: { status: TaskStatus; label: string; bgClass: string; badgeClass: string }[] = [
    { status: 'Assigned', label: 'Allocated / Assigned', bgClass: 'bg-slate-50 border-slate-200', badgeClass: 'bg-slate-200 text-slate-800' },
    { status: 'In Progress', label: 'In Progress', bgClass: 'bg-sky-50/50 border-sky-200', badgeClass: 'bg-sky-100 text-sky-800' },
    { status: 'Under Review', label: 'Under Review (Pending Approval)', bgClass: 'bg-purple-50/50 border-purple-200', badgeClass: 'bg-purple-100 text-purple-800' },
    { status: 'Completed', label: 'Completed & Signed Off', bgClass: 'bg-emerald-50/50 border-emerald-200', badgeClass: 'bg-emerald-100 text-[#0B5D2A]' },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Banner & Header */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0B5D2A] to-[#168A45] flex items-center justify-center text-white shadow-md shadow-emerald-900/10">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Task Allocation & Delegation System
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-[#0B5D2A] border border-emerald-200">
                  ERP Governance
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Corporate task allocation for employees, delegated by Department Managers & Directors with milestone verifications.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export to CSV</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTaskToEdit(null);
                setIsAllocationModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0B5D2A] to-[#168A45] hover:from-[#094d23] hover:to-[#127239] text-white text-xs font-bold shadow-md shadow-emerald-900/15 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Allocate New Task</span>
            </button>
          </div>
        </div>

        {/* Dynamic Persona & Authorization Strip */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50/80 to-teal-50/50 border border-emerald-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3 text-xs">
            <div className="w-8 h-8 rounded-xl bg-white border border-emerald-200 flex items-center justify-center text-[#168A45] shadow-2xs">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-[#0B5D2A]">
                {isDirector
                  ? 'Director Authorization Mode'
                  : isDeptManager
                  ? 'Department Manager Delegation Mode'
                  : 'Employee Operational Mode'}
              </span>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                {isDirector
                  ? 'You possess enterprise authority to allocate, delegate, reassign, and sign off deliverables across all company departments.'
                  : isDeptManager
                  ? `You have operational authority to allocate tasks, track milestones, and review deliverables for ${currentUser.department || 'your department'}.`
                  : 'View your assigned deliverables, update milestone checklists, and submit completion packages for director review.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Filter Scope:
            </span>
            <div className="flex bg-white rounded-lg p-0.5 border border-slate-200 shadow-2xs text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setScopeFilter('all')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  scopeFilter === 'all'
                    ? 'bg-[#168A45] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Tasks
              </button>
              <button
                type="button"
                onClick={() => setScopeFilter('allocated_by_me')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  scopeFilter === 'allocated_by_me'
                    ? 'bg-[#168A45] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Allocated by Me
              </button>
              <button
                type="button"
                onClick={() => setScopeFilter('assigned_to_me')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  scopeFilter === 'assigned_to_me'
                    ? 'bg-[#168A45] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Assigned to Me
              </button>
              {currentUser.department && (
                <button
                  type="button"
                  onClick={() => setScopeFilter('my_dept')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    scopeFilter === 'my_dept'
                      ? 'bg-[#168A45] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  My Dept ({currentUser.department})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Allocated
            </span>
            <div className="text-xl font-bold text-slate-900 mt-1">{metrics.total}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Across all depts</div>
          </div>

          <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200">
            <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider block">
              In Execution
            </span>
            <div className="text-xl font-bold text-sky-900 mt-1">{metrics.inProgress}</div>
            <div className="text-[10px] text-sky-700 mt-0.5">Active progress</div>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200">
            <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">
              Under Review
            </span>
            <div className="text-xl font-bold text-purple-900 mt-1">{metrics.underReview}</div>
            <div className="text-[10px] text-purple-700 mt-0.5">Pending sign-off</div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
            <span className="text-[10px] font-bold text-[#0B5D2A] uppercase tracking-wider block">
              Completed
            </span>
            <div className="text-xl font-bold text-[#0B5D2A] mt-1">{metrics.completed}</div>
            <div className="text-[10px] text-emerald-700 mt-0.5">Director approved</div>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200">
            <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
              Critical & Overdue
            </span>
            <div className="text-xl font-bold text-rose-900 mt-1">
              {metrics.critical + metrics.overdue}
            </div>
            <div className="text-[10px] text-rose-700 mt-0.5">
              {metrics.overdue} past due date
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Average Progress
            </span>
            <div className="text-xl font-bold text-slate-900 mt-1">{metrics.avgProgress}%</div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-[#168A45] h-full rounded-full"
                style={{ width: `${metrics.avgProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filter & View Toolbar */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks by title, ID, assignee, allocator, department..."
            className="w-full text-xs pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#168A45]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-[#168A45]"
          >
            <option value="All">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.departmentName}>
                {d.departmentName}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-[#168A45]"
          >
            <option value="All">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-[#168A45]"
          >
            <option value="All">All Statuses</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Under Review">Under Review</option>
            <option value="Completed">Completed</option>
            <option value="Overdue">Overdue SLA</option>
          </select>

          {/* View Mode Buttons */}
          <div className="flex bg-slate-100 rounded-xl p-0.5 border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('board')}
              title="Kanban Board View"
              className={`p-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                viewMode === 'board'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Board</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="Table Registry View"
              className={`p-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('workload')}
              title="Department Workload & Staff Capacity"
              className={`p-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                viewMode === 'workload'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Workload</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('analytics')}
              title="Executive Analytics"
              className={`p-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                viewMode === 'analytics'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Analytics</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'board' && (
        <div className="space-y-4">
          {/* Sub-toolbar for Board: Grouping Toggle & Helper */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Board Layout:
              </span>
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setBoardGrouping('employee')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                    boardGrouping === 'employee'
                      ? 'bg-white text-emerald-800 shadow-xs border border-emerald-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-emerald-700" />
                  <span>By Employee (Reassign by Drag & Drop)</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1" />
                </button>
                <button
                  type="button"
                  onClick={() => setBoardGrouping('status')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                    boardGrouping === 'status'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-slate-700" />
                  <span>By Pipeline Status</span>
                </button>
              </div>
            </div>

            {/* Quick search inside employees or guidance tip */}
            <div className="flex items-center space-x-2">
              {boardGrouping === 'employee' ? (
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={employeeFilterQuery}
                    onChange={(e) => setEmployeeFilterQuery(e.target.value)}
                    placeholder="Filter employee columns..."
                    className="text-xs pl-8 pr-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-[#168A45] bg-slate-50 w-52"
                  />
                  {employeeFilterQuery && (
                    <button
                      type="button"
                      onClick={() => setEmployeeFilterQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Drag cards between columns or drop onto tray to reassign</span>
                </div>
              )}
            </div>
          </div>

          {/* If boardGrouping === 'employee': Render Employee Reassignment Kanban */}
          {boardGrouping === 'employee' && (
            <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-thin">
              {activeStaffList.map((staff) => {
                const employeeTasks = filteredTasks.filter(
                  (t) => t.assignedToStaffId === staff.id
                );
                const totalHours = employeeTasks.reduce((acc, t) => acc + (t.estimatedHours || 0), 0);
                const isTargetHovered = dragOverTargetId === staff.id;
                const isUnderloaded = employeeTasks.length <= 1;
                const isOverloaded = employeeTasks.length >= 4;

                return (
                  <div
                    key={staff.id}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      if (dragOverTargetId !== staff.id) setDragOverTargetId(staff.id);
                    }}
                    onDragLeave={() => {
                      if (dragOverTargetId === staff.id) setDragOverTargetId(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleDropOnEmployee(staff);
                    }}
                    className={`shrink-0 w-80 p-3.5 rounded-2xl border transition-all flex flex-col min-h-[550px] space-y-3 ${
                      isTargetHovered
                        ? 'bg-emerald-50/90 border-[#168A45] ring-4 ring-emerald-300/40 shadow-xl scale-[1.01]'
                        : 'bg-slate-50/80 border-slate-200/90'
                    }`}
                  >
                    {/* Employee Column Header */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0B5D2A] to-[#168A45] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {staff.fullName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 truncate">
                              {staff.fullName}
                            </h4>
                            <p className="text-[10px] text-slate-500 truncate">
                              {staff.position}
                            </p>
                          </div>
                        </div>

                        <span className="font-mono text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                          {staff.id}
                        </span>
                      </div>

                      {/* Workload badges */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                        <span className="text-slate-500 font-medium truncate">
                          {staff.department}
                        </span>
                        <div className="flex items-center space-x-1 shrink-0">
                          <span
                            className={`px-1.5 py-0.2 rounded font-bold ${
                              isOverloaded
                                ? 'bg-amber-100 text-amber-800'
                                : isUnderloaded
                                ? 'bg-emerald-100 text-[#0B5D2A]'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {employeeTasks.length} {employeeTasks.length === 1 ? 'Task' : 'Tasks'} ({totalHours}h)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Drag Hover Dropzone banner */}
                    {isTargetHovered && (
                      <div className="p-3 rounded-xl bg-emerald-500/15 border-2 border-dashed border-[#168A45] text-center text-xs font-bold text-[#0B5D2A] animate-pulse flex items-center justify-center space-x-2">
                        <UserCheck className="w-4 h-4 text-[#168A45]" />
                        <span>Drop to reassign to {staff.fullName}</span>
                      </div>
                    )}

                    {/* Task Cards for this Employee */}
                    <div className="space-y-3 flex-1 overflow-y-auto">
                      {employeeTasks.map((task) => {
                        const isTaskOverdue =
                          task.dueDate < new Date().toISOString().split('T')[0] &&
                          task.status !== 'Completed';
                        const isCardDragging = draggedTaskId === task.id;

                        return (
                          <div
                            key={task.id}
                            draggable={isDirector || isDeptManager}
                            onDragStart={(e) => handleDragStart(e, task.id)}
                            onDragEnd={handleDragEnd}
                            onClick={() => setSelectedTaskForDetail(task)}
                            className={`p-3.5 rounded-xl bg-white border transition-all cursor-pointer space-y-2.5 group select-none relative ${
                              isCardDragging
                                ? 'opacity-40 border-dashed border-[#168A45] ring-2 ring-emerald-500 scale-95 shadow-inner'
                                : 'border-slate-200 shadow-2xs hover:shadow-md hover:border-[#168A45]/60 hover:-translate-y-0.5'
                            }`}
                          >
                            {/* Card Top Row: Grip handle, ID, Priority Badge, Quick Reassign Button */}
                            <div className="flex items-center justify-between gap-1.5">
                              <div className="flex items-center space-x-1.5 min-w-0">
                                {(isDirector || isDeptManager) && (
                                  <span
                                    title="Drag this handle to reassign to another employee"
                                    className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-800 p-0.5 rounded hover:bg-slate-100"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <GripVertical className="w-4 h-4" />
                                  </span>
                                )}
                                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                  {task.id}
                                </span>
                              </div>

                              <div className="flex items-center space-x-1 shrink-0">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    task.priority === 'Critical'
                                      ? 'bg-rose-100 text-rose-700'
                                      : task.priority === 'High'
                                      ? 'bg-amber-100 text-amber-700'
                                      : task.priority === 'Medium'
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {task.priority}
                                </span>
                                {(isDirector || isDeptManager) && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setReassignModalTask(task);
                                      setTargetEmployeeId('');
                                      setReassignNotes('');
                                    }}
                                    title="Reassign to another employee"
                                    className="p-1 rounded-md text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                                  >
                                    <ArrowRightLeft className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Title */}
                            <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#168A45] transition-colors line-clamp-2">
                              {task.title}
                            </h4>

                            {/* Department & Allocator */}
                            <div className="text-[10px] text-slate-500 space-y-0.5">
                              <div className="flex items-center space-x-1">
                                <Shield className="w-3 h-3 text-[#168A45]" />
                                <span className="truncate">
                                  By: <strong>{task.allocatedByName}</strong> ({task.allocatorType})
                                </span>
                              </div>
                            </div>

                            {/* Status badge & Milestones Progress */}
                            <div className="space-y-1 pt-1 border-t border-slate-100">
                              <div className="flex items-center justify-between text-[10px]">
                                <span
                                  className={`px-1.5 py-0.2 rounded font-bold ${
                                    task.status === 'Completed'
                                      ? 'bg-emerald-100 text-[#0B5D2A]'
                                      : task.status === 'Under Review'
                                      ? 'bg-purple-100 text-purple-700'
                                      : task.status === 'In Progress'
                                      ? 'bg-sky-100 text-sky-800'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {task.status}
                                </span>
                                <span className="font-bold text-slate-700">{task.progress}%</span>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    task.progress === 100
                                      ? 'bg-emerald-600'
                                      : task.progress > 50
                                      ? 'bg-[#168A45]'
                                      : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${task.progress}%` }}
                                />
                              </div>
                            </div>

                            {/* Due Date & Footer */}
                            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                              <span
                                className={`flex items-center space-x-1 ${
                                  isTaskOverdue ? 'text-rose-600 font-bold' : ''
                                }`}
                              >
                                <Calendar className="w-3 h-3" />
                                <span>{task.dueDate}</span>
                                {isTaskOverdue && <span>(Overdue)</span>}
                              </span>

                              <span className="text-slate-400 font-mono">
                                Est: {task.estimatedHours}h
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {employeeTasks.length === 0 && (
                        <div className="text-center py-10 px-3 text-slate-400 text-xs border border-dashed border-slate-300 rounded-xl bg-white/50 flex flex-col items-center justify-center space-y-1.5">
                          <UserPlus className="w-5 h-5 text-slate-300" />
                          <span>No tasks allocated</span>
                          <span className="text-[10px] text-emerald-600 font-semibold">
                            Drag a task here to assign
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {activeStaffList.length === 0 && (
                <div className="w-full py-16 text-center text-slate-400 text-xs border border-dashed border-slate-300 rounded-2xl bg-white">
                  No employees matched the selected department or search filter.
                </div>
              )}
            </div>
          )}

          {/* If boardGrouping === 'status': Render Status Pipeline Board with Drag & Drop */}
          {boardGrouping === 'status' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {boardColumns.map((col) => {
                const columnTasks = filteredTasks.filter((t) => {
                  if (col.status === 'In Progress') {
                    return t.status === 'In Progress' || t.status === 'Needs Revision';
                  }
                  return t.status === col.status;
                });
                const isColumnHovered = dragOverTargetId === col.status;

                return (
                  <div
                    key={col.status}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      if (dragOverTargetId !== col.status) setDragOverTargetId(col.status);
                    }}
                    onDragLeave={() => {
                      if (dragOverTargetId === col.status) setDragOverTargetId(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleDropOnStatus(col.status);
                    }}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col min-h-[500px] space-y-3 ${col.bgClass} ${
                      isColumnHovered
                        ? 'border-emerald-500 ring-2 ring-emerald-300/50 bg-emerald-50/70 shadow-lg'
                        : ''
                    }`}
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-800">{col.label}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${col.badgeClass}`}
                        >
                          {columnTasks.length}
                        </span>
                      </div>
                    </div>

                    {isColumnHovered && (
                      <div className="p-2 rounded-xl bg-emerald-500/10 border-2 border-dashed border-[#168A45] text-center text-[11px] font-bold text-[#0B5D2A] animate-pulse">
                        Drop to move to {col.label}
                      </div>
                    )}

                    {/* Cards List */}
                    <div className="space-y-3 flex-1 overflow-y-auto">
                      {columnTasks.map((task) => {
                        const isTaskOverdue =
                          task.dueDate < new Date().toISOString().split('T')[0] &&
                          task.status !== 'Completed';
                        const completedChecklist = task.checklists.filter((c) => c.completed).length;
                        const isCardDragging = draggedTaskId === task.id;

                        return (
                          <div
                            key={task.id}
                            draggable={isDirector || isDeptManager}
                            onDragStart={(e) => handleDragStart(e, task.id)}
                            onDragEnd={handleDragEnd}
                            onClick={() => setSelectedTaskForDetail(task)}
                            className={`p-4 rounded-xl bg-white border transition-all cursor-pointer space-y-3 group relative select-none ${
                              isCardDragging
                                ? 'opacity-40 border-dashed border-[#168A45] ring-2 ring-emerald-500 scale-95 shadow-inner'
                                : 'border-slate-200 shadow-2xs hover:shadow-md hover:border-[#168A45]/50'
                            }`}
                          >
                            {/* Header: Grip, ID, Priority, Reassign Button */}
                            <div className="flex items-center justify-between gap-1.5">
                              <div className="flex items-center space-x-1.5 min-w-0">
                                {(isDirector || isDeptManager) && (
                                  <span
                                    title="Drag to reassign employee or move pipeline stage"
                                    className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-800 p-0.5 rounded hover:bg-slate-100"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <GripVertical className="w-4 h-4" />
                                  </span>
                                )}
                                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                  {task.id}
                                </span>
                              </div>

                              <div className="flex items-center space-x-1 shrink-0">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    task.priority === 'Critical'
                                      ? 'bg-rose-100 text-rose-700'
                                      : task.priority === 'High'
                                      ? 'bg-amber-100 text-amber-700'
                                      : task.priority === 'Medium'
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {task.priority}
                                </span>
                                {(isDirector || isDeptManager) && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setReassignModalTask(task);
                                      setTargetEmployeeId('');
                                      setReassignNotes('');
                                    }}
                                    title="Reassign to another employee"
                                    className="p-1 rounded-md text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                                  >
                                    <ArrowRightLeft className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Title */}
                            <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#168A45] transition-colors line-clamp-2">
                              {task.title}
                            </h4>

                            {/* Department & Allocator */}
                            <div className="text-[11px] text-slate-500 space-y-1">
                              <div className="flex items-center space-x-1">
                                <Building2 className="w-3 h-3 text-slate-400" />
                                <span className="font-medium text-slate-700">{task.department}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Shield className="w-3 h-3 text-[#168A45]" />
                                <span className="truncate">
                                  By: <strong>{task.allocatedByName}</strong> ({task.allocatorType})
                                </span>
                              </div>
                            </div>

                            {/* Assignee Card with Drag cue */}
                            <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-100 flex items-center justify-between text-[11px]">
                              <div className="flex items-center space-x-2 truncate">
                                <div className="w-6 h-6 rounded-full bg-[#168A45] text-white flex items-center justify-center font-bold text-[10px]">
                                  {task.assignedToName.charAt(0)}
                                </div>
                                <div className="truncate">
                                  <span className="font-bold text-slate-900 block truncate">
                                    {task.assignedToName}
                                  </span>
                                  <span className="text-[10px] text-slate-500 truncate block">
                                    {task.assignedToRole}
                                  </span>
                                </div>
                              </div>
                              <span className="font-mono text-[9px] font-bold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                                {task.assignedToStaffId}
                              </span>
                            </div>

                            {/* Progress Bar & Checklist Count */}
                            <div className="space-y-1.5 pt-1">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-slate-500 font-medium">
                                  Milestones: {completedChecklist}/{task.checklists.length}
                                </span>
                                <span className="font-bold text-[#0B5D2A]">{task.progress}%</span>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    task.progress === 100
                                      ? 'bg-emerald-600'
                                      : task.progress > 50
                                      ? 'bg-[#168A45]'
                                      : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${task.progress}%` }}
                                />
                              </div>
                            </div>

                            {/* Due Date & Footer */}
                            <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-500">
                              <span
                                className={`flex items-center space-x-1 ${
                                  isTaskOverdue ? 'text-rose-600 font-bold' : ''
                                }`}
                              >
                                <Calendar className="w-3 h-3" />
                                <span>{task.dueDate}</span>
                                {isTaskOverdue && <span>(Overdue)</span>}
                              </span>

                              {task.completionRating ? (
                                <div className="flex items-center text-amber-500">
                                  <Star className="w-3 h-3 fill-amber-400" />
                                  <span className="font-bold text-slate-700 ml-0.5">
                                    {task.completionRating}/5
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400">
                                  Est: {task.estimatedHours}h
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {columnTasks.length === 0 && (
                        <div className="text-center py-12 text-slate-400 text-xs border border-dashed border-slate-300 rounded-xl bg-white/40">
                          No tasks in {col.label}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Registry Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Task ID</th>
                  <th className="px-4 py-3">Title & Category</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Allocated By (Authority)</th>
                  <th className="px-4 py-3">Primary Assignee</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Target Due</th>
                  <th className="px-4 py-3">Progress / Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map((task) => {
                  const isTaskOverdue =
                    task.dueDate < new Date().toISOString().split('T')[0] &&
                    task.status !== 'Completed';

                  return (
                    <tr
                      key={task.id}
                      onClick={() => setSelectedTaskForDetail(task)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">
                        {task.id}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="font-bold text-slate-900 group-hover:text-[#168A45] transition-colors truncate">
                          {task.title}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {task.category}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {task.department}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{task.allocatedByName}</div>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                            task.allocatorType === 'Director'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {task.allocatorType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{task.assignedToName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {task.assignedToStaffId} • {task.assignedToRole}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            task.priority === 'Critical'
                              ? 'bg-rose-100 text-rose-700'
                              : task.priority === 'High'
                              ? 'bg-amber-100 text-amber-700'
                              : task.priority === 'Medium'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div
                          className={`font-semibold ${
                            isTaskOverdue ? 'text-rose-600 font-bold' : 'text-slate-800'
                          }`}
                        >
                          {task.dueDate}
                        </div>
                        <div className="text-[10px] text-slate-400">{task.dueTime || '18:00'}</div>
                      </td>
                      <td className="px-4 py-3 min-w-[130px]">
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span
                            className={`font-bold px-1.5 py-0.2 rounded-md ${
                              task.status === 'Completed'
                                ? 'bg-emerald-100 text-[#0B5D2A]'
                                : task.status === 'Under Review'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {task.status}
                          </span>
                          <span className="font-bold text-slate-700">{task.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              task.progress === 100
                                ? 'bg-emerald-600'
                                : task.progress > 50
                                ? 'bg-[#168A45]'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            type="button"
                            onClick={() => setSelectedTaskForDetail(task)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#168A45] hover:bg-slate-100 transition-colors cursor-pointer"
                            title="View Full Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {(isDirector || isDeptManager) && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setReassignModalTask(task);
                                  setTargetEmployeeId('');
                                  setReassignNotes('');
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                                title="Reassign Task to Employee"
                              >
                                <ArrowRightLeft className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setTaskToEdit(task);
                                  setIsAllocationModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Edit Task"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteTask(task.id, e)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete Task"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredTasks.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-xs">
                No tasks match your selected search or filter criteria.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Department Workload & Employee Capacity View */}
      {viewMode === 'workload' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span className="font-semibold text-slate-800">
              Department Workload & Staff Delegation Matrix
            </span>
            <span>
              Showing staff across active departments with allocated deliverables
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept) => {
              const deptTasks = tasks.filter((t) => t.department === dept.departmentName);
              const deptStaff = effectiveStaffList.filter(
                (s) =>
                  s.department?.toLowerCase() === dept.departmentName.toLowerCase() ||
                  s.departmentCode?.toLowerCase() === dept.departmentCode?.toLowerCase()
              );
              const completedDeptTasks = deptTasks.filter((t) => t.status === 'Completed').length;
              const pendingDeptTasks = deptTasks.filter((t) => t.status !== 'Completed').length;

              return (
                <div
                  key={dept.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{dept.departmentName}</h4>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Head: {dept.headOfDepartment || 'Department Lead'}
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {deptTasks.length} Tasks
                    </span>
                  </div>

                  {/* Summary bar */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Completed
                      </span>
                      <strong className="text-[#0B5D2A]">{completedDeptTasks}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        In Progress
                      </span>
                      <strong className="text-sky-700">{pendingDeptTasks}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Staff Headcount
                      </span>
                      <strong className="text-slate-800">{deptStaff.length} Employees</strong>
                    </div>
                  </div>

                  {/* Staff List in Department */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Team Members & Assigned Tasks
                      </span>
                      <span className="text-[9px] text-emerald-700 font-semibold">
                        Drag tasks to reassign
                      </span>
                    </div>
                    {deptStaff.length > 0 ? (
                      deptStaff.slice(0, 6).map((staff) => {
                        const employeeTasks = deptTasks.filter(
                          (t) => t.assignedToStaffId === staff.id
                        );
                        const empCompleted = employeeTasks.filter(
                          (t) => t.status === 'Completed'
                        ).length;
                        const isStaffHovered = dragOverTargetId === `workload-${staff.id}`;

                        return (
                          <div
                            key={staff.id}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = 'move';
                              if (dragOverTargetId !== `workload-${staff.id}`) {
                                setDragOverTargetId(`workload-${staff.id}`);
                              }
                            }}
                            onDragLeave={() => {
                              if (dragOverTargetId === `workload-${staff.id}`) setDragOverTargetId(null);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              handleDropOnEmployee(staff);
                            }}
                            className={`p-2.5 rounded-xl border transition-all flex items-center justify-between text-xs ${
                              isStaffHovered
                                ? 'border-[#168A45] bg-emerald-50 ring-2 ring-emerald-300 scale-[1.01] shadow-sm'
                                : 'border-slate-100 hover:border-slate-200 bg-white'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                                {staff.fullName.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 truncate">
                                  {staff.fullName}
                                </div>
                                <div className="text-[10px] text-slate-500 truncate">
                                  {staff.position}
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              {isStaffHovered ? (
                                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full animate-pulse">
                                  Drop to Reassign
                                </span>
                              ) : (
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    employeeTasks.length > 2
                                      ? 'bg-amber-100 text-amber-800'
                                      : employeeTasks.length > 0
                                      ? 'bg-emerald-100 text-[#0B5D2A]'
                                      : 'bg-slate-100 text-slate-500'
                                  }`}
                                >
                                  {employeeTasks.length} Assigned ({empCompleted} done)
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-xs text-slate-400 py-3 text-center">
                        No staff directly mapped to department code.
                      </div>
                    )}
                  </div>

                  {/* Fast Delegate Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setTaskToEdit(null);
                      setIsAllocationModalOpen(true);
                    }}
                    className="w-full py-2 rounded-xl bg-slate-100 hover:bg-[#EAF7EF] text-slate-700 hover:text-[#0B5D2A] font-bold text-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Delegate Task to {dept.departmentName}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Executive Analytics View */}
      {viewMode === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Category Distribution */}
          <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-[#168A45]" />
              <span>Deliverables by Corporate Category</span>
            </h4>
            <div className="space-y-3">
              {[
                'Compliance & Audit',
                'Operational',
                'Finance & Accounts',
                'IT & Engineering',
                'Sales & Pipeline',
                'Human Resources',
                'Strategic & Executive',
              ].map((cat) => {
                const count = tasks.filter((t) => t.category === cat).length;
                const percentage = tasks.length > 0 ? Math.round((count / tasks.length) * 100) : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">{cat}</span>
                      <span className="font-mono text-slate-500">
                        {count} tasks ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#168A45] h-full rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Priority & Executive Governance Metrics */}
          <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Shield className="w-4 h-4 text-[#168A45]" />
              <span>Executive Allocation Governance</span>
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200">
                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                  Director Allocated
                </span>
                <div className="text-2xl font-bold text-purple-950 mt-1">
                  {tasks.filter((t) => t.allocatorType === 'Director').length}
                </div>
                <div className="text-[11px] text-purple-800 mt-0.5">
                  Executive governance tasks
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                  Manager Allocated
                </span>
                <div className="text-2xl font-bold text-blue-950 mt-1">
                  {tasks.filter((t) => t.allocatorType === 'Department Manager').length}
                </div>
                <div className="text-[11px] text-blue-800 mt-0.5">
                  Departmental delegations
                </div>
              </div>
            </div>

            {/* Quality Rating Distribution */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-800 block">
                Sign-off Performance Benchmark
              </span>
              <p className="text-xs text-slate-600 leading-relaxed">
                Completed deliverables are reviewed by Directors & Managers and scored from 1 to 5 stars on speed, completeness, and documentation rigor.
              </p>
              <div className="flex items-center space-x-4 pt-2">
                <div className="flex items-center text-amber-500">
                  <Star className="w-5 h-5 fill-amber-400" />
                  <span className="font-bold text-slate-800 text-sm ml-1.5">
                    {tasks.filter((t) => t.completionRating).length > 0
                      ? (
                          tasks
                            .filter((t) => t.completionRating)
                            .reduce((sum, t) => sum + t.completionRating!, 0) /
                          tasks.filter((t) => t.completionRating).length
                        ).toFixed(1)
                      : '5.0'}
                    / 5.0
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  Average Quality Score on Completed Tasks
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Allocation / Edit Modal */}
      <TaskAllocationModal
        isOpen={isAllocationModalOpen}
        onClose={() => setIsAllocationModalOpen(false)}
        currentUser={currentUser}
        taskToEdit={taskToEdit}
        onTaskSaved={(savedTask) => {
          setTasks(taskAllocationStorage.getTasks());
        }}
      />

      {/* Detail & Review Modal */}
      {selectedTaskForDetail && (
        <TaskDetailModal
          task={selectedTaskForDetail}
          isOpen={Boolean(selectedTaskForDetail)}
          onClose={() => setSelectedTaskForDetail(null)}
          currentUser={currentUser}
          onTaskUpdated={(updated) => {
            setSelectedTaskForDetail(updated);
            setTasks(taskAllocationStorage.getTasks());
          }}
          onEditRequested={(task) => {
            setSelectedTaskForDetail(null);
            setTaskToEdit(task);
            setIsAllocationModalOpen(true);
          }}
        />
      )}

      {/* Floating Quick Reassign Shelf (Active when dragging any task card) */}
      {draggedTaskId && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl border border-emerald-500/60 space-y-2.5 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
            <div className="flex items-center space-x-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span className="font-bold text-emerald-400 uppercase tracking-wider text-[11px]">
                Quick Reassignment Dock
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-200 font-semibold truncate max-w-md">
                Task {draggedTask?.id}: "{draggedTask?.title}"
              </span>
            </div>
            <span className="text-[11px] text-emerald-300 font-medium">
              Drop onto any team member to reassign deliverable
            </span>
          </div>

          <div className="flex items-center space-x-2.5 overflow-x-auto pb-1 scrollbar-thin">
            {effectiveStaffList.map((st) => {
              const isCurrentAssignee = draggedTask?.assignedToStaffId === st.id;
              const isTrayTargetHovered = dragOverTargetId === `tray-${st.id}`;

              return (
                <div
                  key={st.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverTargetId !== `tray-${st.id}`) {
                      setDragOverTargetId(`tray-${st.id}`);
                    }
                  }}
                  onDragLeave={() => {
                    if (dragOverTargetId === `tray-${st.id}`) setDragOverTargetId(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDropOnEmployee(st);
                  }}
                  className={`shrink-0 p-2.5 rounded-xl border transition-all cursor-pointer min-w-[190px] max-w-[210px] ${
                    isCurrentAssignee
                      ? 'bg-slate-800/80 border-slate-700 opacity-60 cursor-not-allowed'
                      : isTrayTargetHovered
                      ? 'bg-[#168A45] border-emerald-300 ring-2 ring-white scale-105 shadow-lg'
                      : 'bg-slate-800 hover:bg-slate-750 border-slate-700 hover:border-emerald-500/50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {st.fullName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{st.fullName}</div>
                      <div className="text-[10px] text-slate-300 truncate">{st.position}</div>
                    </div>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[9px] text-slate-400">
                    <span className="truncate max-w-[110px]">{st.department}</span>
                    {isCurrentAssignee ? (
                      <span className="text-amber-400 font-bold">Current</span>
                    ) : isTrayTargetHovered ? (
                      <span className="text-white font-bold animate-pulse">Drop here!</span>
                    ) : (
                      <span className="text-emerald-400 font-medium">Drop to assign</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Reassign Modal Dialog */}
      {reassignModalTask && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#0B5D2A] flex items-center justify-center">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Reassign Task Deliverable</h3>
                  <p className="text-[11px] text-slate-500">
                    Transfer ownership and milestones to another team member
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReassignModalTask(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Task Summary Card */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-700">{reassignModalTask.id}</span>
                <span className="font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded text-[10px]">
                  {reassignModalTask.department}
                </span>
              </div>
              <div className="font-semibold text-slate-900">{reassignModalTask.title}</div>
              <div className="text-[11px] text-slate-500 flex items-center space-x-1.5 pt-1 border-t border-slate-200/60">
                <span>Current Assignee:</span>
                <strong className="text-slate-800">{reassignModalTask.assignedToName}</strong>
                <span className="text-slate-400">({reassignModalTask.assignedToRole})</span>
              </div>
            </div>

            {/* Target Employee Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Select Target Employee *</label>
              <select
                value={targetEmployeeId}
                onChange={(e) => setTargetEmployeeId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-[#168A45]"
              >
                <option value="">-- Choose Employee to Assign --</option>
                {effectiveStaffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} • {s.position} ({s.department}) - {s.id}
                  </option>
                ))}
              </select>
            </div>

            {/* Reassign Reason */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Reassignment Reason / Directorial Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={reassignNotes}
                onChange={(e) => setReassignNotes(e.target.value)}
                placeholder="e.g. Workload rebalancing, specialist domain handover, urgent SLA escalation..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#168A45]"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReassignModalTask(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!targetEmployeeId}
                onClick={handleConfirmReassignModal}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#168A45] hover:bg-[#0B5D2A] text-white disabled:opacity-50 shadow-md shadow-emerald-900/10 cursor-pointer"
              >
                Confirm Reassignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-xl bg-slate-900 text-white shadow-2xl border border-emerald-500/60 flex items-center space-x-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="w-8 h-8 rounded-full bg-emerald-600/30 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="text-xs font-semibold">{toastMessage.text}</div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white text-xs ml-2 cursor-pointer p-1"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
