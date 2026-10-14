import React, { useState } from 'react';
import {
  X,
  CheckSquare,
  Clock,
  Calendar,
  UserCheck,
  Shield,
  Star,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ExternalLink,
  MessageSquare,
  History,
  TrendingUp,
  Tag,
  Building,
  User,
  ArrowRight,
  Send,
} from 'lucide-react';
import { AllocatedTask, TaskStatus } from '../../types/tasks';
import { taskAllocationStorage } from '../../services/taskAllocationStorageService';
import { User as SystemUser } from '../../types';

interface TaskDetailModalProps {
  task: AllocatedTask;
  isOpen: boolean;
  onClose: () => void;
  currentUser: SystemUser;
  onTaskUpdated: (task: AllocatedTask) => void;
  onEditRequested?: (task: AllocatedTask) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  currentUser,
  onTaskUpdated,
  onEditRequested,
}) => {
  const isDirector =
    currentUser.role === 'Admin' ||
    currentUser.accessLevel === 'Executive' ||
    /director|md|principal|ceo/i.test(currentUser.name || '') ||
    /director|md|principal|ceo/i.test(currentUser.userType || '');

  const isDeptManager =
    currentUser.role === 'Manager' ||
    /manager|lead|head/i.test(currentUser.role || '') ||
    (currentUser.department && currentUser.department.toLowerCase() === task.department.toLowerCase());

  const canApproveOrReview = isDirector || isDeptManager;

  // Local state for interactive actions
  const [activeTab, setActiveTab] = useState<'overview' | 'checklist' | 'review' | 'activity'>('overview');
  const [progressVal, setProgressVal] = useState<number>(task.progress);
  const [progressNotes, setProgressNotes] = useState('');
  const [hoursSpentInput, setHoursSpentInput] = useState<number>(0);
  
  // Review state
  const [reviewRating, setReviewRating] = useState<number>(task.completionRating || 5);
  const [reviewRemarks, setReviewRemarks] = useState(task.reviewRemarks || '');
  const [deliverableNotesInput, setDeliverableNotesInput] = useState(task.deliverableNotes || '');
  const [deliverableLinkInput, setDeliverableLinkInput] = useState(task.deliverableLink || '');

  if (!isOpen) return null;

  const handleToggleChecklist = (chkId: string) => {
    const updated = taskAllocationStorage.toggleChecklistItem(
      task.id,
      chkId,
      currentUser.name || 'User',
      currentUser.role || 'Staff'
    );
    if (updated) {
      setProgressVal(updated.progress);
      onTaskUpdated(updated);
    }
  };

  const handleUpdateProgress = () => {
    const updated = taskAllocationStorage.updateProgress(
      task.id,
      progressVal,
      currentUser.name || 'User',
      currentUser.role || 'Staff',
      progressNotes,
      hoursSpentInput > 0 ? hoursSpentInput : undefined
    );
    if (updated) {
      setProgressNotes('');
      setHoursSpentInput(0);
      onTaskUpdated(updated);
    }
  };

  const handleSubmitForReview = () => {
    const updated = taskAllocationStorage.submitForReview(
      task.id,
      deliverableNotesInput,
      deliverableLinkInput,
      currentUser.name || 'Assignee',
      'Employee'
    );
    if (updated) {
      onTaskUpdated(updated);
      setActiveTab('overview');
    }
  };

  const handleDirectorDecision = (decision: 'Approve' | 'Revision') => {
    if (!reviewRemarks.trim() && decision === 'Revision') {
      alert('Please specify the revision instructions or required fixes.');
      return;
    }
    const updated = taskAllocationStorage.reviewTask(
      task.id,
      decision,
      reviewRating,
      reviewRemarks,
      currentUser.name || 'Executive Director',
      isDirector ? 'Director' : 'Department Manager'
    );
    if (updated) {
      onTaskUpdated(updated);
      onClose();
    }
  };

  const isOverdue =
    task.dueDate < new Date().toISOString().split('T')[0] &&
    task.status !== 'Completed' &&
    task.status !== 'Cancelled';

  const completedChecklistCount = task.checklists.filter((c) => c.completed).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-white/10 text-emerald-300 border border-white/15">
              {task.id}
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-white truncate max-w-md sm:max-w-xl">
                {task.title}
              </h3>
              <div className="flex items-center space-x-2 text-[11px] text-slate-300 mt-0.5">
                <span className="flex items-center space-x-1">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>{task.department}</span>
                </span>
                <span>•</span>
                <span>{task.category}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {onEditRequested && canApproveOrReview && (
              <button
                type="button"
                onClick={() => onEditRequested(task)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors cursor-pointer"
              >
                Edit Parameters
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status & Priority Strip */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            {/* Priority */}
            <span
              className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                task.priority === 'Critical'
                  ? 'bg-rose-100 text-rose-700 border border-rose-200'
                  : task.priority === 'High'
                  ? 'bg-amber-100 text-amber-700 border border-amber-200'
                  : task.priority === 'Medium'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              ● {task.priority} Priority
            </span>

            {/* Status */}
            <span
              className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                task.status === 'Completed'
                  ? 'bg-emerald-100 text-[#0B5D2A] border border-emerald-300'
                  : task.status === 'Under Review'
                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                  : task.status === 'In Progress'
                  ? 'bg-sky-100 text-sky-800 border border-sky-200'
                  : task.status === 'Needs Revision'
                  ? 'bg-orange-100 text-orange-800 border border-orange-200'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {task.status}
            </span>

            {isOverdue && (
              <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-bold text-[10px] animate-pulse">
                OVERDUE
              </span>
            )}
          </div>

          {/* Due date countdown */}
          <div className="flex items-center space-x-4 text-slate-600 text-[11px]">
            <span className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Due: <strong className="text-slate-800">{task.dueDate}</strong> ({task.dueTime || '18:00'})</span>
            </span>
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Est: {task.estimatedHours} hrs {task.actualHoursSpent ? `| Spent: ${task.actualHoursSpent} hrs` : ''}</span>
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 flex space-x-4 text-xs font-semibold bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'border-[#168A45] text-[#0B5D2A]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Overview & Deliverables
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('checklist')}
            className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'checklist'
                ? 'border-[#168A45] text-[#0B5D2A]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Milestones</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
              {completedChecklistCount}/{task.checklists.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('review')}
            className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'review'
                ? 'border-[#168A45] text-[#0B5D2A]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Director / Manager Review</span>
            {task.status === 'Under Review' && (
              <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'activity'
                ? 'border-[#168A45] text-[#0B5D2A]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Activity Trail</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 text-[10px]">
              {task.activityLog?.length || 0}
            </span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="overflow-y-auto p-6 space-y-5 flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* People Cards: Allocator vs Assignee */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Allocator Card */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
                      <Shield className="w-3.5 h-3.5 text-[#168A45]" />
                      <span>Allocated By ({task.allocatorType})</span>
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-[#0B5D2A]">
                      {task.allocatorType === 'Director' ? 'Director Level' : 'Manager Level'}
                    </span>
                  </div>
                  <div className="font-bold text-sm text-slate-900">{task.allocatedByName}</div>
                  <div className="text-xs text-slate-600">{task.allocatedByRole}</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Allocated on: {task.createdAt}
                  </div>
                </div>

                {/* Assignee Card */}
                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center space-x-1">
                      <UserCheck className="w-3.5 h-3.5 text-[#168A45]" />
                      <span>Primary Assignee</span>
                    </span>
                    <span className="font-mono text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                      {task.assignedToStaffId}
                    </span>
                  </div>
                  <div className="font-bold text-sm text-slate-900">{task.assignedToName}</div>
                  <div className="text-xs text-slate-600">
                    {task.assignedToRole} • {task.assignedToDepartment}
                  </div>
                  {task.supportingAssignees && task.supportingAssignees.length > 0 && (
                    <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-emerald-200/60">
                      <span className="font-semibold text-slate-700">Collaborators:</span>{' '}
                      {task.supportingAssignees.map((s) => s.name).join(', ')}
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Slider & Tracker */}
              <div className="p-4.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-[#168A45]" />
                      <span>Task Progress & Velocity</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Adjust completion slider or select milestone increments
                    </p>
                  </div>
                  <div className="text-xl font-black text-[#0B5D2A] font-mono">
                    {progressVal}%
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      progressVal === 100
                        ? 'bg-emerald-600'
                        : progressVal > 50
                        ? 'bg-[#168A45]'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${progressVal}%` }}
                  />
                </div>

                {/* Slider and Quick Buttons */}
                <div className="space-y-2 pt-1">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={progressVal}
                    onChange={(e) => setProgressVal(Number(e.target.value))}
                    className="w-full accent-[#168A45] cursor-pointer"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-1.5">
                      {[0, 25, 50, 75, 100].map((pct) => (
                        <button
                          type="button"
                          key={pct}
                          onClick={() => setProgressVal(pct)}
                          className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                            progressVal === pct
                              ? 'bg-emerald-100 text-[#0B5D2A] border-emerald-300 shadow-2xs font-bold'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        max="24"
                        placeholder="+hrs"
                        value={hoursSpentInput || ''}
                        onChange={(e) => setHoursSpentInput(Number(e.target.value))}
                        className="w-16 text-xs px-2 py-1 rounded-lg border border-slate-300 bg-white"
                        title="Hours logged in this update"
                      />
                      <button
                        type="button"
                        onClick={handleUpdateProgress}
                        className="px-3.5 py-1.5 rounded-lg bg-[#168A45] hover:bg-[#0B5D2A] text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                      >
                        Save Progress
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress Log Note */}
                <input
                  type="text"
                  placeholder="Optional log note for this update (e.g. Completed initial mockups, resolved staging blocker)..."
                  value={progressNotes}
                  onChange={(e) => setProgressNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#168A45]"
                />
              </div>

              {/* Scope & Description */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Scope of Work & Deliverables
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                  {task.description}
                </p>
              </div>

              {/* Deliverable Link & Notes */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Output / Submission Deliverables</span>
                  {task.deliverableLink && (
                    <a
                      href={task.deliverableLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#168A45] hover:underline flex items-center space-x-1"
                    >
                      <span>Open Link</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </h4>

                <div className="space-y-2">
                  <input
                    type="url"
                    placeholder="Deliverable URL (e.g. https://docs.mysar.internal/report or Google Drive link)..."
                    value={deliverableLinkInput}
                    onChange={(e) => setDeliverableLinkInput(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#168A45]"
                  />

                  <textarea
                    rows={2}
                    placeholder="Deliverable remarks / completion notes submitted by employee..."
                    value={deliverableNotesInput}
                    onChange={(e) => setDeliverableNotesInput(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#168A45]"
                  />
                </div>

                {task.status !== 'Completed' && (
                  <button
                    type="button"
                    onClick={handleSubmitForReview}
                    className="w-full py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit Deliverable for Director / Manager Review</span>
                  </button>
                )}
              </div>

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  {task.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px] border border-slate-200"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Checklist Tab */}
          {activeTab === 'checklist' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#0B5D2A]">
                    Interactive Milestone Verification
                  </h4>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Click checkboxes as deliverables are finished. Task progress auto-calculates.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-[#0B5D2A]">
                    {completedChecklistCount} / {task.checklists.length}
                  </span>
                  <span className="text-[10px] text-emerald-700 block">Completed</span>
                </div>
              </div>

              <div className="space-y-2">
                {task.checklists.map((chk, i) => (
                  <div
                    key={chk.id}
                    onClick={() => handleToggleChecklist(chk.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 ${
                      chk.completed
                        ? 'bg-emerald-50/40 border-emerald-200 text-slate-800'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={chk.completed}
                      onChange={() => {}} // Handled by parent div
                      className="mt-0.5 w-4 h-4 accent-[#168A45] rounded cursor-pointer shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-xs font-semibold ${
                          chk.completed ? 'line-through text-slate-500' : 'text-slate-800'
                        }`}
                      >
                        {chk.title}
                      </div>
                      {chk.completed && chk.completedBy && (
                        <div className="text-[10px] text-emerald-700 mt-0.5">
                          ✓ Completed by {chk.completedBy} on {chk.completedAt}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Director & Manager Review Tab */}
          {activeTab === 'review' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-900 to-indigo-900 text-white space-y-2">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-purple-300" />
                  <h4 className="text-sm font-bold">Executive Evaluation & Quality Sign-Off</h4>
                </div>
                <p className="text-xs text-purple-200 leading-relaxed">
                  Directors and Department Managers evaluate the deliverables, rate completion quality (1-5 stars), and either approve completion or request specific revisions.
                </p>
              </div>

              {/* Past Review Remarks if completed */}
              {task.reviewedByName && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0B5D2A] flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Reviewed by {task.reviewedByName}</span>
                    </span>
                    {task.completionRating && (
                      <div className="flex items-center text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < task.completionRating!
                                ? 'fill-amber-400 text-amber-500'
                                : 'text-slate-300'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-emerald-900 italic">
                    "{task.reviewRemarks}"
                  </p>
                  <div className="text-[10px] text-emerald-700">
                    Sign-off recorded: {task.reviewedAt}
                  </div>
                </div>
              )}

              {/* Reviewer Action Form */}
              {canApproveOrReview ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3.5">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Record Director / Manager Decision
                  </h4>

                  {/* Quality Star Rating */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Execution Quality Rating (1 - 5 Stars)
                    </label>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setReviewRating(star)}
                          className="p-1 cursor-pointer transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= reviewRating
                                ? 'fill-amber-400 text-amber-500'
                                : 'text-slate-300 hover:text-slate-400'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-slate-700 ml-2">
                        {reviewRating === 5
                          ? 'Outstanding (5/5)'
                          : reviewRating === 4
                          ? 'Exceeds Expectations (4/5)'
                          : reviewRating === 3
                          ? 'Meets Requirements (3/5)'
                          : reviewRating === 2
                          ? 'Needs Improvement (2/5)'
                          : 'Unsatisfactory (1/5)'}
                      </span>
                    </div>
                  </div>

                  {/* Evaluation Remarks */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Director / Manager Evaluation Remarks *
                    </label>
                    <textarea
                      rows={3}
                      value={reviewRemarks}
                      onChange={(e) => setReviewRemarks(e.target.value)}
                      placeholder="Detail your appraisal of the deliverable, praise exceptional execution, or specify required amendments..."
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#168A45]"
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleDirectorDecision('Revision')}
                      className="px-4 py-2 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-800 text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Request Revision</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDirectorDecision('Approve')}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0B5D2A] to-[#168A45] hover:from-[#094d23] hover:to-[#127239] text-white text-xs font-bold shadow-md shadow-emerald-900/10 transition-all cursor-pointer flex items-center space-x-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve & Sign Off (Complete Task)</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                  Only assigned Department Managers and Directors possess sign-off authority for this task.
                </div>
              )}
            </div>
          )}

          {/* Activity Audit Trail Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-2">
                <History className="w-4 h-4 text-slate-400" />
                <span>Task History & Delegation Audit Trail</span>
              </h4>

              <div className="space-y-2">
                {task.activityLog && task.activityLog.length > 0 ? (
                  task.activityLog.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900">{log.actorName}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-medium">
                            {log.actorRole}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                      </div>
                      <div className="font-semibold text-[#168A45]">{log.action}</div>
                      {log.notes && (
                        <p className="text-slate-600 text-[11px] leading-relaxed">{log.notes}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No activity recorded yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Task ID: <strong className="font-mono text-slate-700">{task.id}</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
