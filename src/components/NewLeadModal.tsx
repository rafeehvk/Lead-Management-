import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Users,
  Calendar,
  Flag,
  MessageSquare,
  Clock,
  FileText,
  Sparkles,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { Lead, LeadPriority, LeadStatus, User as UserType } from '../types';
import { StatusBadge } from './StatusBadge';
import { LeadActivityTimeline } from './LeadActivityTimeline';

interface NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (leadData: Partial<Lead>) => void;
  editLead?: Lead | null;
  users: UserType[];
  currentUser?: UserType;
  onCreateProposal?: (lead: Lead) => void;
  onAddFollowUp?: (lead: Lead) => void;
}

export const NewLeadModal: React.FC<NewLeadModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editLead,
  users,
  currentUser,
  onCreateProposal,
  onAddFollowUp,
}) => {
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState<Partial<Lead>>({
    instituteName: '',
    contactPerson: '',
    mobile: '',
    email: '',
    address: '',
    studentCount: 500,
    leadSource: 'Referral',
    assignedTo: 'Anand Kumar',
    priority: 'Medium' as LeadPriority,
    status: 'New' as LeadStatus,
    followUpDate: today,
    remarks: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeMobileTab, setActiveMobileTab] = useState<'details' | 'timeline'>('details');
  const [timelineKey, setTimelineKey] = useState(0);

  useEffect(() => {
    if (editLead) {
      setFormData(editLead);
      setActiveMobileTab('details');
    } else {
      setFormData({
        instituteName: '',
        contactPerson: '',
        mobile: '',
        email: '',
        address: '',
        studentCount: 500,
        leadSource: 'Referral',
        assignedTo: users[0]?.name || 'Anand Kumar',
        priority: 'Medium',
        status: 'New',
        followUpDate: today,
        remarks: '',
      });
    }
    setErrors({});
  }, [editLead, isOpen, users]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.instituteName?.trim()) {
      newErrors.instituteName = 'Institute Name is required';
    }
    if (!formData.contactPerson?.trim()) {
      newErrors.contactPerson = 'Contact Person is required';
    }
    if (!formData.mobile?.trim()) {
      newErrors.mobile = 'Mobile Number is required';
    }
    if (!formData.studentCount || Number(formData.studentCount) <= 0) {
      newErrors.studentCount = 'Valid student count is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(formData);
    onClose();
  };

  const leadSources = [
    'Referral',
    'Website',
    'Exhibition',
    'Field Visit',
    'Cold Call',
    'Social Media',
    'Partner Inbound',
    'Direct Visit',
    'Other',
  ];

  const isEditing = !!editLead;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div
        className={`bg-white border border-gray-200 rounded-2xl w-full shadow-2xl overflow-hidden my-4 flex flex-col ${
          isEditing ? 'max-w-6xl max-h-[92vh]' : 'max-w-2xl max-h-[90vh]'
        }`}
      >
        {/* Modal Header Bar */}
        <div className="bg-slate-50 border-b border-gray-200 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#168A45] text-white flex items-center justify-center font-bold text-sm shadow-2xs">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800">
                  {isEditing ? formData.instituteName || 'Edit Lead Details' : 'Add New Institutional Lead'}
                </h3>
                {isEditing && formData.status && (
                  <StatusBadge status={formData.status} />
                )}
              </div>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? `ID: ${editLead?.id} • Created: ${editLead?.createdDate || 'Recent'} by ${editLead?.createdBy || 'Staff'}`
                  : 'Create a new institutional school/college lead'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEditing && onCreateProposal && (
              <button
                type="button"
                onClick={() => {
                  if (editLead) {
                    onClose();
                    onCreateProposal(editLead);
                  }
                }}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#168A45] text-[#168A45] hover:bg-[#EAF7EF] text-xs font-bold transition-colors shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Create Proposal</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile View Switcher Tabs (Visible on < lg screens when editing) */}
        {isEditing && (
          <div className="lg:hidden flex border-b border-gray-200 bg-white px-4">
            <button
              type="button"
              onClick={() => setActiveMobileTab('details')}
              className={`flex-1 py-2.5 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 ${
                activeMobileTab === 'details'
                  ? 'border-[#168A45] text-[#0B5D2A]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Lead Details</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMobileTab('timeline')}
              className={`flex-1 py-2.5 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 ${
                activeMobileTab === 'timeline'
                  ? 'border-[#168A45] text-[#0B5D2A]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Activity Timeline</span>
            </button>
          </div>
        )}

        {/* Modal Main Body (2-Column Grid on Desktop when editing) */}
        <div className={`flex-1 overflow-hidden ${isEditing ? 'grid grid-cols-1 lg:grid-cols-12' : ''}`}>
          {/* Left Column: Lead Edit Form */}
          <div
            className={`flex flex-col h-full overflow-y-auto ${
              isEditing
                ? `lg:col-span-7 ${activeMobileTab === 'details' ? 'block' : 'hidden lg:block'}`
                : 'w-full'
            }`}
          >
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Institute Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Institute Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Greenwood International Public School"
                      value={formData.instituteName || ''}
                      onChange={(e) => setFormData({ ...formData, instituteName: e.target.value })}
                      className={`w-full bg-[#F7FAF8] border rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45] focus:ring-1 focus:ring-[#168A45] transition-all ${
                        errors.instituteName ? 'border-red-400' : 'border-gray-200'
                      }`}
                    />
                  </div>
                  {errors.instituteName && (
                    <p className="text-[11px] text-red-500 mt-1">{errors.instituteName}</p>
                  )}
                </div>

                {/* Contact Person & Mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Contact Person & Designation <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Ramesh Narayan (Principal)"
                      value={formData.contactPerson || ''}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      className={`w-full bg-[#F7FAF8] border rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45] focus:ring-1 focus:ring-[#168A45] transition-all ${
                        errors.contactPerson ? 'border-red-400' : 'border-gray-200'
                      }`}
                    />
                    {errors.contactPerson && (
                      <p className="text-[11px] text-red-500 mt-1">{errors.contactPerson}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. +91 98450 88776"
                      value={formData.mobile || ''}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      className={`w-full bg-[#F7FAF8] border rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45] focus:ring-1 focus:ring-[#168A45] transition-all ${
                        errors.mobile ? 'border-red-400' : 'border-gray-200'
                      }`}
                    />
                    {errors.mobile && (
                      <p className="text-[11px] text-red-500 mt-1">{errors.mobile}</p>
                    )}
                  </div>
                </div>

                {/* Email & Student Count */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. principal@greenwoodschool.edu.in"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45] focus:ring-1 focus:ring-[#168A45] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Number of Students <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 500"
                      value={formData.studentCount || ''}
                      onChange={(e) => setFormData({ ...formData, studentCount: Number(e.target.value) })}
                      className={`w-full bg-[#F7FAF8] border rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45] focus:ring-1 focus:ring-[#168A45] transition-all ${
                        errors.studentCount ? 'border-red-400' : 'border-gray-200'
                      }`}
                    />
                    {errors.studentCount && (
                      <p className="text-[11px] text-red-500 mt-1">{errors.studentCount}</p>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Address / Campus Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sarjapur Main Road, Bangalore, Karnataka - 560035"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45] focus:ring-1 focus:ring-[#168A45] transition-all"
                  />
                </div>

                {/* Lead Source, Assigned To, Priority */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Lead Source
                    </label>
                    <select
                      value={formData.leadSource || 'Referral'}
                      onChange={(e) => setFormData({ ...formData, leadSource: e.target.value })}
                      className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45] focus:ring-1 focus:ring-[#168A45] transition-all"
                    >
                      {leadSources.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Assigned To
                    </label>
                    <select
                      value={formData.assignedTo || 'Anand Kumar'}
                      onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                      className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45] focus:ring-1 focus:ring-[#168A45] transition-all"
                    >
                      {users.map((u) => (
                        <option key={u.id} value={u.name}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={formData.priority || 'Medium'}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as LeadPriority })}
                      className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45] focus:ring-1 focus:ring-[#168A45] transition-all"
                    >
                      <option value="High">High Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="Low">Low Priority</option>
                    </select>
                  </div>
                </div>

                {/* Status & Follow-up Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Lead Pipeline Status
                    </label>
                    <select
                      value={formData.status || 'New'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as LeadStatus })}
                      className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45] focus:ring-1 focus:ring-[#168A45] transition-all"
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Follow-up">Follow-up</option>
                      <option value="Qualified">Qualified</option>
                      <option value="Demo Scheduled">Demo Scheduled</option>
                      <option value="Demo Completed">Demo Completed</option>
                      <option value="Send Proposal">Send Proposal</option>
                      <option value="Proposal Sent">Proposal Sent</option>
                      <option value="Negotiation">Negotiation</option>
                      <option value="Won">Won</option>
                      <option value="Lost">Lost</option>
                      <option value="On Hold">On Hold</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Next Follow-up Date
                    </label>
                    <input
                      type="date"
                      value={formData.followUpDate || today}
                      onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                      className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45] focus:ring-1 focus:ring-[#168A45] transition-all"
                    />
                  </div>
                </div>

                {/* Remarks */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Remarks & Discussion Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter institutional requirements, specific modules requested (e.g. Biometrics, ID Cards, Parent App), or meeting feedback..."
                    value={formData.remarks || ''}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45] focus:ring-1 focus:ring-[#168A45] transition-all"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-6 border-t border-gray-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-200 text-sm font-semibold text-slate-500 hover:text-slate-800 hover:bg-[#F7FAF8] rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white text-sm font-bold rounded-lg transition-all shadow-xs active:scale-98"
                >
                  {isEditing ? 'Save Lead Changes' : 'Create Institutional Lead'}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Activity Timeline Sidebar (Visible when editing) */}
          {isEditing && editLead && (
            <div
              className={`lg:col-span-5 h-full overflow-hidden flex flex-col ${
                activeMobileTab === 'timeline' ? 'block' : 'hidden lg:flex'
              }`}
            >
              <LeadActivityTimeline
                key={timelineKey}
                lead={editLead}
                currentUser={currentUser}
                users={users}
                onActivityAdded={() => setTimelineKey((k) => k + 1)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
