import { getImageUrl } from '../../constants/index';
import React, { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { adminService } from '../../services/portalService';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  IoPersonOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoBookOutline,
  IoPeopleOutline,
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoRefreshOutline,
  IoTrashOutline,
  IoTimeOutline,
  IoAddCircleOutline,
  IoCloseOutline,
  IoToggleOutline,
  IoLinkOutline,
} from 'react-icons/io5';

const AdminInstructors = () => {
  const [instructors, setInstructors] = useState([]);
  const [pendingInstructors, setPendingInstructors] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [actionId, setActionId] = useState(null);
  const [rejectReasonMap, setRejectReasonMap] = useState({});
  const [showRejectForm, setShowRejectForm] = useState(null);

  // Create instructor modal
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', phone: '', bio: '' });
  const [createLoading, setCreateLoading] = useState(false);

  // Course assignment
  const [assigningFor, setAssigningFor] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [instRes, pendRes, coursesRes] = await Promise.all([
        adminService.getInstructors(),
        adminService.getPendingInstructors(),
        api.get('/admin/courses?limit=200'),
      ]);
      if (instRes.data?.data?.instructors) {
        setInstructors(instRes.data.data.instructors.filter(u => u.instructorApproval === 'APPROVED'));
      }
      if (pendRes.data?.data?.instructors) {
        setPendingInstructors(pendRes.data.data.instructors);
      }
      if (coursesRes.data?.data?.courses) {
        setAllCourses(coursesRes.data.data.courses);
      }
    } catch {
      toast.error('Failed to load instructor accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleApprove = async (id) => {
    setActionId(id);
    try {
      await adminService.approveInstructor(id);
      toast.success('Instructor approved successfully!');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed.');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id) => {
    const reason = rejectReasonMap[id] || '';
    setActionId(id);
    try {
      await adminService.rejectInstructor(id, reason);
      toast.success('Instructor registration rejected.');
      loadData();
      setShowRejectForm(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed.');
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this instructor? This will permanently delete their account.')) return;
    setActionId(id);
    try {
      await adminService.deleteUser(id);
      toast.success('Instructor profile deleted.');
      setInstructors(prev => prev.filter(inst => inst.id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed.');
    } finally {
      setActionId(null);
    }
  };

  const handleToggleActive = async (id, currentActive) => {
    setActionId(id);
    try {
      await adminService.toggleUserActive(id);
      toast.success(`Instructor ${currentActive ? 'deactivated' : 'activated'}.`);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Toggle failed.');
    } finally {
      setActionId(null);
    }
  };

  const handleCreateInstructor = async (e) => {
    e.preventDefault();
    if (!createForm.name || !createForm.email || !createForm.password) {
      toast.error('Name, email, and password are required.');
      return;
    }
    setCreateLoading(true);
    try {
      await adminService.createInstructor(createForm);
      toast.success('Instructor account created! Credentials emailed to instructor.');
      setShowCreateForm(false);
      setCreateForm({ name: '', email: '', password: '', phone: '', bio: '' });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create instructor.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleAssignCourse = async (instructorId) => {
    if (!selectedCourse) { toast.error('Please select a course.'); return; }
    setAssignLoading(true);
    try {
      await adminService.assignCourse(instructorId, selectedCourse);
      toast.success('Course assigned to instructor!');
      setAssigningFor(null);
      setSelectedCourse('');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assignment failed.');
    } finally {
      setAssignLoading(false);
    }
  };

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

  const getInstructorStats = (inst) => {
    const totalCourses = inst.courses?.length || 0;
    const totalEnrolled = inst.courses?.reduce((sum, c) => sum + (c._count?.enrollments || 0), 0) || 0;
    return { totalCourses, totalEnrolled };
  };

  // Courses not yet assigned to this instructor
  const getUnassignedCourses = (inst) => {
    const assignedIds = new Set((inst.courses || []).map(c => c.id));
    return allCourses.filter(c => !assignedIds.has(c.id) && c.status !== 'ARCHIVED');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900">Instructors Management</h1>
          <p className="text-sm text-slate-500 mt-1">Create Instructor Accounts, Assign Courses, and Manage Trainers.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-all cursor-pointer"
          >
            <IoRefreshOutline size={14} /> Refresh
          </button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-1.5 text-xs"
          >
            <IoAddCircleOutline size={16} /> Create Instructor Account
          </Button>
        </div>
      </div>

      {/* ── Create Instructor Modal ── */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Create New Instructor Account</h3>
              <button onClick={() => setShowCreateForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
                <IoCloseOutline size={20} className="text-slate-500" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              The instructor will receive their login credentials by email. They can log in immediately.
            </p>
            <form onSubmit={handleCreateInstructor} className="space-y-4">
              {[
                { label: 'Full Name *', key: 'name', type: 'text', placeholder: 'John Doe' },
                { label: 'Email Address *', key: 'email', type: 'email', placeholder: 'instructor@example.com' },
                { label: 'Password *', key: 'password', type: 'text', placeholder: 'Temporary password' },
                { label: 'Phone (optional)', key: 'phone', type: 'text', placeholder: '+92 300 0000000' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700">{label}</label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={createForm[key]}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                  />
                </div>
              ))}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">Bio (optional)</label>
                <textarea
                  placeholder="Brief instructor bio..."
                  rows={2}
                  value={createForm.bio}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" size="sm" type="button" onClick={() => setShowCreateForm(false)}>Cancel</Button>
                <Button variant="primary" size="sm" type="submit" isLoading={createLoading}>Create Account</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Pending Approvals (Legacy — for any old self-registered instructors) ── */}
      {pendingInstructors.length > 0 && (
        <Card hover={false} className="border border-amber-100 bg-amber-50/20 p-6 space-y-4 rounded-2xl">
          <h3 className="text-sm font-bold text-amber-800 flex items-center gap-2">
            <IoTimeOutline size={18} /> Pending Instructor Approvals ({pendingInstructors.length})
          </h3>
          <div className="space-y-3">
            {pendingInstructors.map((inst) => (
              <div key={inst.id} className="p-4 bg-white border border-slate-100 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{inst.name}</h4>
                  <p className="text-xs text-slate-500">{inst.email} {inst.phone ? `· ${inst.phone}` : ''}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Registered: {new Date(inst.createdAt).toLocaleDateString()}</p>
                </div>
                {showRejectForm === inst.id && (
                  <div className="flex-1 max-w-md mx-2">
                    <input
                      type="text"
                      placeholder="Reason for rejection (optional)..."
                      className="w-full px-3 py-1.5 border border-red-150 rounded-lg text-xs focus:outline-none focus:border-red-400 bg-red-50/30"
                      value={rejectReasonMap[inst.id] || ''}
                      onChange={(e) => setRejectReasonMap(prev => ({ ...prev, [inst.id]: e.target.value }))}
                    />
                  </div>
                )}
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="primary" size="sm" disabled={actionId === inst.id} onClick={() => handleApprove(inst.id)} className="flex items-center gap-1.5 py-1 text-xs">
                    <IoCheckmarkCircleOutline size={15} /> Approve
                  </Button>
                  {showRejectForm === inst.id ? (
                    <>
                      <Button variant="secondary" size="sm" disabled={actionId === inst.id} onClick={() => handleReject(inst.id)} className="flex items-center gap-1.5 text-red-650 bg-red-50 hover:bg-red-100 py-1 text-xs border border-red-200">
                        Confirm Reject
                      </Button>
                      <button onClick={() => setShowRejectForm(null)} className="text-xs text-slate-450 hover:text-slate-600 px-2">Cancel</button>
                    </>
                  ) : (
                    <button onClick={() => setShowRejectForm(inst.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-550 border border-slate-100 bg-white hover:bg-red-50 hover:text-red-700 rounded-lg transition-all cursor-pointer font-semibold">
                      <IoCloseCircleOutline size={15} /> Reject
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Active Trainers List ── */}
      <Card hover={false} className="bg-white border border-slate-100 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-3 mb-4">
          Instructors ({instructors.length})
        </h3>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />)}
          </div>
        ) : instructors.length === 0 ? (
          <div className="text-center py-12 text-slate-450">
            <IoPersonOutline size={36} className="mx-auto mb-2 opacity-35" />
            <p className="text-sm font-semibold">No instructors yet. Create one using the button above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {instructors.map((inst) => {
              const { totalCourses, totalEnrolled } = getInstructorStats(inst);
              const isExpanded = expandedId === inst.id;
              const unassignedCourses = getUnassignedCourses(inst);

              return (
                <div key={inst.id} className="border border-slate-100 rounded-2xl overflow-hidden shadow-xs hover:border-slate-200 transition-colors bg-white">
                  <div
                    onClick={() => toggleExpand(inst.id)}
                    className="p-4 bg-slate-50/40 hover:bg-slate-50 transition-colors grid grid-cols-1 sm:grid-cols-12 items-center gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 col-span-12 sm:col-span-6 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-primary-100 text-primary-750 flex items-center justify-center font-bold font-heading shrink-0 border border-primary-200">
                        {inst.avatar ? (
                          <img src={getImageUrl(inst.avatar)} alt={inst.name} className="h-10 w-10 rounded-xl object-cover" />
                        ) : (
                          inst.name?.split(' ').map(n => n[0]).join('') || '?'
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 truncate">
                          {inst.name}
                          {!inst.isActive && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100 font-semibold shrink-0">Deactivated</span>
                          )}
                        </h4>
                        <p className="text-xs text-slate-500 truncate">{inst.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-600 font-semibold col-span-12 sm:col-span-4 sm:justify-start justify-between w-full sm:w-auto whitespace-nowrap">
                      <span className="flex items-center gap-1.5"><IoBookOutline size={15} className="text-slate-450 shrink-0" /> {totalCourses} Courses</span>
                      <span className="flex items-center gap-1.5"><IoPeopleOutline size={15} className="text-slate-450 shrink-0" /> {totalEnrolled} Students</span>
                    </div>

                    <div className="flex items-center gap-1 col-span-12 sm:col-span-2 justify-end w-full sm:w-auto shrink-0 border-t border-slate-100 sm:border-t-0 pt-3 sm:pt-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleActive(inst.id, inst.isActive); }}
                        disabled={actionId === inst.id}
                        className={`p-2 rounded-xl transition-all cursor-pointer text-xs font-semibold flex items-center gap-1 ${inst.isActive ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-50'}`}
                        title={inst.isActive ? 'Deactivate Instructor' : 'Activate Instructor'}
                      >
                        <IoToggleOutline size={20} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(inst.id); }}
                        disabled={actionId === inst.id}
                        className="p-2 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                        title="Delete Instructor Account"
                      >
                        <IoTrashOutline size={16} />
                      </button>
                      <div className="pl-1 text-slate-400">
                        {isExpanded ? <IoChevronUpOutline size={16} /> : <IoChevronDownOutline size={16} />}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-5 border-t border-slate-100 bg-white space-y-5">
                      {inst.bio && (
                        <div className="text-xs text-slate-500 border-l-2 border-slate-200 pl-3 py-0.5">
                          <strong className="text-slate-700">Bio:</strong> {inst.bio}
                        </div>
                      )}

                      {/* Course Assignment Section */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Assigned Courses</h5>
                          <button
                            onClick={() => { setAssigningFor(assigningFor === inst.id ? null : inst.id); setSelectedCourse(''); }}
                            className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-semibold"
                          >
                            <IoLinkOutline size={14} /> Assign Course
                          </button>
                        </div>

                        {/* Assign course dropdown */}
                        {assigningFor === inst.id && (
                          <div className="flex items-center gap-2 mb-4 p-3 bg-primary-50/40 rounded-xl border border-primary-100">
                            <select
                              className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary-400 bg-white"
                              value={selectedCourse}
                              onChange={(e) => setSelectedCourse(e.target.value)}
                            >
                              <option value="">— Select a course to assign —</option>
                              {unassignedCourses.map(c => (
                                <option key={c.id} value={c.id}>{c.title} ({c.status})</option>
                              ))}
                            </select>
                            <Button
                              variant="primary"
                              size="sm"
                              isLoading={assignLoading}
                              onClick={() => handleAssignCourse(inst.id)}
                              className="text-xs shrink-0"
                            >
                              Assign
                            </Button>
                            <button onClick={() => setAssigningFor(null)} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
                              <IoCloseOutline size={16} className="text-slate-500" />
                            </button>
                          </div>
                        )}

                        {(!inst.courses || inst.courses.length === 0) ? (
                          <p className="text-xs text-slate-400 italic">No courses assigned yet.</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {inst.courses.map((course) => (
                              <div key={course.id} className="p-3 border border-slate-50 rounded-xl bg-slate-50/20 flex justify-between items-center text-xs">
                                <div>
                                  <p className="font-bold text-slate-800">{course.title}</p>
                                  <div className="flex gap-2 mt-1 text-[10px] text-slate-400">
                                    <span>Cat: {course.category?.name}</span>
                                    <span>·</span>
                                    <span className="uppercase">{course.status}</span>
                                  </div>
                                </div>
                                <span className="shrink-0 font-bold text-[10px] bg-primary-50 text-primary-750 px-2 py-0.5 rounded-full border border-primary-100">
                                  {course._count?.enrollments || 0} Students
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminInstructors;
