import React, { useState, useEffect } from 'react';
import {
  X,
  CheckSquare,
  UserCheck,
  Building2,
  Calendar,
  Clock,
  AlertTriangle,
  Plus,
  Trash2,
  Shield,
  Briefcase,
  Layers,
  Sparkles,
} from 'lucide-react';
import { AllocatedTask, TaskPriority, TaskCategory } from '../../types/tasks';
import { taskAllocationStorage } from '../../services/taskAllocationStorageService';
import { hrStorage } from '../../services/hrStorageService';
import { StaffMember, DepartmentMaster } from '../../types/hr';
import { User } from '../../types';

interface TaskAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  taskToEdit?: AllocatedTask | null;
  onTaskSaved?: (task: AllocatedTask) => void;
}

export const TaskAllocationModal: React.FC<TaskAllocationModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  taskToEdit,
  onTaskSaved,
}) => {
  const isDirector =
    currentUser.role === 'Admin' ||
    currentUser.accessLevel === 'Executive' ||
    /director|md|principal|ceo/i.test(currentUser.name || '') ||
    /director|md|principal|ceo/i.test(currentUser.userType || '');

  const [departments, setDepartments] = useState<DepartmentMaster[]>(() => hrStorage.getDepartmentsMaster());
  const [staffList, setStaffList] = useState<StaffMember[]>(() => hrStorage.getStaff());

  // Refresh fresh staff and departments whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setDepartments(hrStorage.getDepartmentsMaster());
      setStaffList(hrStorage.getStaff());
    }
  }, [isOpen]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('Operational');
  const [selectedDept, setSelectedDept] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('High');
  
  // Allocator Info
  const [allocatorType, setAllocatorType] = useState<'Director' | 'Department Manager'>(
    isDirector ? 'Director' : 'Department Manager'
  );
  const [allocatorName, setAllocatorName] = useState(currentUser.name || 'Executive Director');
  const [allocatorRole, setAllocatorRole] = useState(
    isDirector
      ? 'Managing Director & Principal Executive'
      : `${currentUser.department || 'Department'} Manager`
  );

  // Assignee Info
  const [assignedStaffId, setAssignedStaffId] = useState('');
  const [supportingStaffIds, setSupportingStaffIds] = useState<string[]>([]);
  
  // Dates & Effort
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('18:00');
  const [estimatedHours, setEstimatedHours] = useState<number>(16);

  // Checklists
  const [checklists, setChecklists] = useState<{ id: string; title: string }[]>([
    { id: '1', title: 'Review requirements and formulate execution plan' },
    { id: '2', title: 'Submit draft deliverables for preliminary review' },
    { id: '3', title: 'Finalize output and submit for Director/Manager sign-off' },
  ]);
  const [newChecklistText, setNewChecklistText] = useState('');

  // Tags
  const [tagsInput, setTagsInput] = useState('Deliverable, Q4');

  // Load editing state
  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description);
      setCategory(taskToEdit.category);
      setSelectedDept(taskToEdit.department);
      setPriority(taskToEdit.priority);
      setAllocatorType(taskToEdit.allocatorType);
      setAllocatorName(taskToEdit.allocatedByName);
      setAllocatorRole(taskToEdit.allocatedByRole);
      setAssignedStaffId(taskToEdit.assignedToStaffId);
      setSupportingStaffIds(taskToEdit.supportingAssignees?.map((s) => s.staffId) || []);
      setStartDate(taskToEdit.startDate);
      setDueDate(taskToEdit.dueDate);
      setDueTime(taskToEdit.dueTime || '18:00');
      setEstimatedHours(taskToEdit.estimatedHours);
      setChecklists(taskToEdit.checklists.map((c) => ({ id: c.id, title: c.title })));
      setTagsInput(taskToEdit.tags?.join(', ') || '');
    } else {
      // Defaults for new task
      setTitle('');
      setDescription('');
      setCategory('Operational');
      const defaultDept = currentUser.department || departments[0]?.departmentName || 'Operations';
      setSelectedDept(defaultDept);
      setPriority('High');
      setAllocatorType(isDirector ? 'Director' : 'Department Manager');
      setAllocatorName(currentUser.name || 'Executive Director');
      setAllocatorRole(
        isDirector
          ? 'Managing Director & Principal Executive'
          : `${currentUser.department || 'Department'} Manager`
      );
      setStartDate(today);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      setDueDate(nextWeek.toISOString().split('T')[0]);
      setDueTime('18:00');
      setEstimatedHours(16);
      setChecklists([
        { id: '1', title: 'Review requirements and formulate execution plan' },
        { id: '2', title: 'Submit draft deliverables for preliminary review' },
        { id: '3', title: 'Finalize output and submit for Director/Manager sign-off' },
      ]);
      setTagsInput('Deliverable, Q4');

      // Pick first staff in default department if available
      const deptStaff = staffList.filter(
        (s) => s.department?.toLowerCase() === defaultDept.toLowerCase()
      );
      if (deptStaff.length > 0) {
        setAssignedStaffId(deptStaff[0].id);
      } else if (staffList.length > 0) {
        setAssignedStaffId(staffList[0].id);
      } else {
        setAssignedStaffId('');
      }
    }
  }, [taskToEdit, isOpen, staffList.length]);

  // Update filtered staff when department changes
  const eligibleStaff = staffList.filter((s) => {
    if (!selectedDept || selectedDept === 'All') return true;
    return (
      s.department?.toLowerCase() === selectedDept.toLowerCase() ||
      s.departmentCode?.toLowerCase() === selectedDept.toLowerCase()
    );
  });

  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    setChecklists([...checklists, { id: String(Date.now()), title: newChecklistText.trim() }]);
    setNewChecklistText('');
  };

  const handleRemoveChecklistItem = (id: string) => {
    setChecklists(checklists.filter((c) => c.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) {
      alert('Please provide a task title and due date.');
      return;
    }

    if (staffList.length === 0) {
      alert('No staff members are registered in the system. Please add staff in the Staff / HR module first.');
      return;
    }

    const assignedStaff = staffList.find((s) => s.id === assignedStaffId) || eligibleStaff[0] || staffList[0];
    if (!assignedStaff) {
      alert('Please select an employee to assign this task to.');
      return;
    }

    const supporting = supportingStaffIds
      .map((sid) => staffList.find((s) => s.id === sid))
      .filter(Boolean)
      .map((s) => ({
        staffId: s!.id,
        name: s!.fullName,
        role: s!.position,
      }));

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (taskToEdit) {
      // Update existing
      const updated = taskAllocationStorage.updateTask(
        taskToEdit.id,
        {
          title,
          description,
          category,
          department: selectedDept,
          priority,
          allocatorType,
          allocatedByName: allocatorName,
          allocatedByRole: allocatorRole,
          assignedToStaffId: assignedStaff.id,
          assignedToName: assignedStaff.fullName,
          assignedToRole: assignedStaff.position,
          assignedToDepartment: assignedStaff.department || selectedDept,
          assignedToEmail: assignedStaff.email,
          supportingAssignees: supporting,
          startDate,
          dueDate,
          dueTime,
          estimatedHours: Number(estimatedHours) || 8,
          tags: parsedTags,
        },
        currentUser.name || 'Executive',
        isDirector ? 'Director' : 'Department Manager',
        'Task Details Modified',
        `Updated task parameters by ${currentUser.name}`
      );
      if (updated && onTaskSaved) onTaskSaved(updated);
    } else {
      // Allocate New Task
      const created = taskAllocationStorage.allocateTask({
        title,
        description,
        category,
        department: selectedDept,
        priority,
        allocatorType,
        allocatedById: currentUser.staffId || currentUser.id || 'MGT-001',
        allocatedByName: allocatorName,
        allocatedByRole: allocatorRole,
        assignedToStaffId: assignedStaff.id,
        assignedToName: assignedStaff.fullName,
        assignedToRole: assignedStaff.position,
        assignedToDepartment: assignedStaff.department || selectedDept,
        assignedToEmail: assignedStaff.email,
        supportingAssignees: supporting,
        startDate,
        dueDate,
        dueTime,
        estimatedHours: Number(estimatedHours) || 8,
        checklists: checklists.map((c) => ({ title: c.title })),
        tags: parsedTags,
        actorName: currentUser.name || 'Executive',
        actorRole: isDirector ? 'Director' : 'Department Manager',
        notes: `Allocated with ${priority} priority to ${assignedStaff.fullName}`,
      });
      if (created && onTaskSaved) onTaskSaved(created);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-[#0B5D2A] to-[#168A45] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center backdrop-blur-md">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">
                {taskToEdit ? `Edit Task: ${taskToEdit.id}` : 'Allocate New Task to Employee'}
              </h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                Executive & Departmental delegation with milestones, deadlines & quality review
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-emerald-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
          {/* Allocation Authority Banner */}
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-start space-x-3">
            <Shield className="w-5 h-5 text-[#168A45] shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 leading-relaxed">
              <span className="font-bold text-[#0B5D2A]">
                {allocatorType === 'Director' ? 'Director Allocation Authority' : 'Department Manager Delegation'}:
              </span>{' '}
              {allocatorType === 'Director'
                ? 'Tasks allocated by Directors carry enterprise priority and are directly monitored at executive reviews.'
                : 'Tasks allocated by Department Managers track team milestones and departmental output deliverables.'}
            </div>
          </div>

          {/* Allocator Details Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Allocation Level *
              </label>
              <select
                value={allocatorType}
                onChange={(e) => {
                  const val = e.target.value as 'Director' | 'Department Manager';
                  setAllocatorType(val);
                  if (val === 'Director') {
                    setAllocatorRole('Managing Director & Principal Executive');
                  } else {
                    setAllocatorRole(`${selectedDept || 'Department'} Manager`);
                  }
                }}
                className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#168A45]"
              >
                <option value="Director">Director (Executive Level)</option>
                <option value="Department Manager">Department Manager (Operational Level)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Allocated By (Name) *
              </label>
              <input
                type="text"
                required
                value={allocatorName}
                onChange={(e) => setAllocatorName(e.target.value)}
                placeholder="e.g. Muhammed Rafeeh"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#168A45]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Signatory Title / Role *
              </label>
              <input
                type="text"
                required
                value={allocatorRole}
                onChange={(e) => setAllocatorRole(e.target.value)}
                placeholder="e.g. Director of Operations"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#168A45]"
              />
            </div>
          </div>

          {/* Task Title & Category */}
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Task Title / Deliverable Name *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q4 Financial Statements Consolidation & Advance Tax Filing"
                className="w-full text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#168A45]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Task Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TaskCategory)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#168A45]"
                >
                  <option value="Operational">Operational</option>
                  <option value="Client Project">Client Project</option>
                  <option value="Compliance & Audit">Compliance & Audit</option>
                  <option value="Finance & Accounts">Finance & Accounts</option>
                  <option value="IT & Engineering">IT & Engineering</option>
                  <option value="Sales & Pipeline">Sales & Pipeline</option>
                  <option value="Administrative">Administrative</option>
                  <option value="Strategic & Executive">Strategic & Executive</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department *
                </label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#168A45]"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.departmentName}>
                      {d.departmentName}
                    </option>
                  ))}
                  <option value="General Corporate">General Corporate</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Priority Level *
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className={`w-full text-xs font-bold px-3 py-2 rounded-xl border ${
                    priority === 'Critical'
                      ? 'border-rose-300 bg-rose-50 text-rose-700'
                      : priority === 'High'
                      ? 'border-amber-300 bg-amber-50 text-amber-700'
                      : priority === 'Medium'
                      ? 'border-blue-300 bg-blue-50 text-blue-700'
                      : 'border-slate-300 bg-slate-50 text-slate-700'
                  }`}
                >
                  <option value="Critical">Critical (Immediate SLA)</option>
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low / Routine</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Detailed Objectives & Scope of Work *
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Specify the background, required outcomes, acceptance standards, and deliverable format for this task..."
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#168A45]"
              />
            </div>
          </div>

          {/* Assignee Selection */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-[#168A45]" />
                <span>Employee Assignment</span>
              </h4>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded">
                Connected: {staffList.length} Staff
              </span>
            </div>

            {staffList.length === 0 && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start space-x-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">No Staff Records Found</div>
                  <div className="text-[11px] text-amber-800 mt-0.5">
                    Task Allocation connects directly with Staff Management. Please onboard or register staff in the Staff / HR module to allocate tasks.
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Employee Assignee *
                </label>
                {staffList.length === 0 ? (
                  <div className="text-xs text-rose-600 font-medium p-2.5 bg-rose-50 rounded-xl border border-rose-200">
                    No staff available. Add staff in HR module first.
                  </div>
                ) : (
                  <select
                    value={assignedStaffId}
                    onChange={(e) => setAssignedStaffId(e.target.value)}
                    required
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#168A45]"
                  >
                    <option value="">-- Choose Staff Member --</option>
                    {eligibleStaff.length > 0 ? (
                      eligibleStaff.map((staff) => (
                        <option key={staff.id} value={staff.id}>
                          {staff.fullName} - {staff.position} ({staff.id || staff.staffCode})
                        </option>
                      ))
                    ) : (
                      staffList.map((staff) => (
                        <option key={staff.id} value={staff.id}>
                          {staff.fullName} - {staff.position} ({staff.department})
                        </option>
                      ))
                    )}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estimated Effort (Hours)
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(Number(e.target.value))}
                  placeholder="e.g. 16"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#168A45]"
                />
              </div>
            </div>

            {/* Supporting Assignees */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Supporting Collaborators (Optional)
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-white rounded-xl border border-slate-200">
                {staffList
                  .filter((s) => s.id !== assignedStaffId)
                  .map((staff) => {
                    const isSelected = supportingStaffIds.includes(staff.id);
                    return (
                      <button
                        type="button"
                        key={staff.id}
                        onClick={() => {
                          if (isSelected) {
                            setSupportingStaffIds(supportingStaffIds.filter((id) => id !== staff.id));
                          } else {
                            setSupportingStaffIds([...supportingStaffIds, staff.id]);
                          }
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-100 text-[#0B5D2A] border-emerald-300 shadow-2xs font-semibold'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {staff.fullName} ({staff.position})
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Timeline & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#168A45]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Due Date *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#168A45]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Completion Time
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#168A45]"
              />
            </div>
          </div>

          {/* Interactive Checklist Builder */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Milestones & Verification Checklist
              </label>
              <span className="text-[11px] text-slate-400">
                {checklists.length} milestone items
              </span>
            </div>

            <div className="space-y-1.5">
              {checklists.map((chk, index) => (
                <div
                  key={chk.id}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 font-bold text-[10px] flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-slate-800 font-medium">{chk.title}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveChecklistItem(chk.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="text"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChecklistItem();
                  }
                }}
                placeholder="Add another verifiable deliverable or milestone..."
                className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#168A45]"
              />
              <button
                type="button"
                onClick={handleAddChecklistItem}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center space-x-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tags / Keywords (comma-separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. Audit, Q4, Priority, ISO, Finance"
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#168A45]"
            />
          </div>

          {/* Footer Controls */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={staffList.length === 0}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0B5D2A] to-[#168A45] hover:from-[#094d23] hover:to-[#127239] text-white text-xs font-bold shadow-md shadow-emerald-900/10 transition-all cursor-pointer flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckSquare className="w-4 h-4" />
              <span>{taskToEdit ? 'Save Task Changes' : staffList.length === 0 ? 'No Staff Available' : 'Confirm & Allocate Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
