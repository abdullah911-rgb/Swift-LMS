import { getImageUrl } from '../../constants/index';
import React, { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { adminService } from '../../services/portalService';
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
} from 'react-icons/io5';

const AdminInstructors = () => {
  const [instructors, setInstructors] = useState([]);
  const [pendingInstructors, setPendingInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [actionId, setActionId] = useState(null);
  const [rejectReasonMap, setRejectReasonMap] = useState({});
  const [showRejectForm, setShowRejectForm] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [instRes, pendRes] = await Promise.all([
        adminService.getInstructors(),
        adminService.getPendingInstructors(),
      ]);
      if (instRes.data?.data?.instructors) {
        // filter out pending ones from the general instructors list if any
        setInstructors(instRes.data.data.instructors.filter(u => u.instructorApproval === 'APPROVED'));
      }
      if (pendRes.data?.data?.instructors) {
        setPendingInstructors(pendRes.data.data.instructors);
      }
    } catch (err) {
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
    if (!window.confirm('Are you sure you want to delete this instructor? This will permanently delete their account and archive all their courses.')) return;
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

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Calculate stats for an instructor
  const getInstructorStats = (inst) => {
    const totalCourses = inst.courses?.length || 0;
    const totalEnrolled = inst.courses?.reduce((sum, c) => sum + (c._count?.enrollments || 0), 0) || 0;
    return { totalCourses, totalEnrolled };
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900">Instructors Management</h1>
          <p className="text-sm text-slate-500 mt-1">Approve pending applications, manage active trainers, and inspect courses.</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-all cursor-pointer"
        >
          <IoRefreshOutline size={14} /> Refresh
        </button>
      </div>

      {/* ── Pending Approvals ── */}
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
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={actionId === inst.id}
                    onClick={() => handleApprove(inst.id)}
                    className="flex items-center gap-1.5 py-1 text-xs"
                  >
                    <IoCheckmarkCircleOutline size={15} /> Approve
                  </Button>

                  {showRejectForm === inst.id ? (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={actionId === inst.id}
                        onClick={() => handleReject(inst.id)}
                        className="flex items-center gap-1.5 text-red-650 bg-red-50 hover:bg-red-100 py-1 text-xs border border-red-200"
                      >
                        Confirm Reject
                      </Button>
                      <button onClick={() => setShowRejectForm(null)} className="text-xs text-slate-450 hover:text-slate-600 px-2">Cancel</button>
                    </>
                  ) : (
                    <button
                      onClick={() => setShowRejectForm(inst.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-550 border border-slate-100 bg-white hover:bg-red-50 hover:text-red-700 rounded-lg transition-all cursor-pointer font-semibold"
                    >
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
        <h3 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-3 mb-4">Working Instructors ({instructors.length})</h3>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : instructors.length === 0 ? (
          <div className="text-center py-12 text-slate-450">
            <IoPersonOutline size={36} className="mx-auto mb-2 opacity-35" />
            <p className="text-sm font-semibold">No approved instructors found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {instructors.map((inst) => {
              const { totalCourses, totalEnrolled } = getInstructorStats(inst);
              const isExpanded = expandedId === inst.id;

              return (
                <div key={inst.id} className="border border-slate-100 rounded-2xl overflow-hidden">
                  {/* Header Row */}
                  <div
                    onClick={() => toggleExpand(inst.id)}
                    className="p-4 bg-slate-50/40 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary-100 text-primary-750 flex items-center justify-center font-bold font-heading shrink-0 border border-primary-200">
                        {inst.avatar ? (
                          <img src={getImageUrl(inst.avatar)} alt={inst.name} className="h-10 w-10 rounded-xl object-cover" />
                        ) : (
                          inst.name?.split(' ').map(n => n[0]).join('') || '?'
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">{inst.name}</h4>
                        <p className="text-xs text-slate-500">{inst.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 self-stretch sm:self-auto justify-between">
                      <div className="flex items-center gap-4 text-xs text-slate-600 font-semibold">
                        <span className="flex items-center gap-1"><IoBookOutline size={14} className="text-slate-450" /> {totalCourses} Courses</span>
                        <span className="flex items-center gap-1"><IoPeopleOutline size={14} className="text-slate-450" /> {totalEnrolled} Students</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(inst.id); }}
                          disabled={actionId === inst.id}
                          className="p-2 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                          title="Delete Instructor Account"
                        >
                          <IoTrashOutline size={15} />
                        </button>
                        {isExpanded ? <IoChevronUpOutline size={16} /> : <IoChevronDownOutline size={16} />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Body: Course List & Enrollment Stats */}
                  {isExpanded && (
                    <div className="p-5 border-t border-slate-100 bg-white space-y-4">
                      {inst.bio && (
                        <div className="text-xs text-slate-500 border-l-2 border-slate-200 pl-3 py-0.5">
                          <strong className="text-slate-700">Bio:</strong> {inst.bio}
                        </div>
                      )}

                      <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Courses Taught</h5>
                      {(!inst.courses || inst.courses.length === 0) ? (
                        <p className="text-xs text-slate-400 italic">No courses created yet.</p>
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
