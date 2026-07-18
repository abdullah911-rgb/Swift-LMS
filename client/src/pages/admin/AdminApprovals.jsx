import { getImageUrl } from '../../constants/index';
import React, { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { adminService, zoomService } from '../../services/portalService';
import toast from 'react-hot-toast';
import {
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoTimeOutline,
  IoLayersOutline,
  IoPersonOutline,
  IoRefreshOutline,
  IoVideocamOutline,
} from 'react-icons/io5';

const AdminApprovals = () => {
  const [activeTab, setActiveTab] = useState('courses');
  const [courses, setCourses] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [rejectReasonMap, setRejectReasonMap] = useState({});
  const [showRejectForm, setShowRejectForm] = useState(null);

  const fetchPendingCourses = async () => {
    try {
      const res = await adminService.getPendingCourses();
      if (res.data?.data?.courses) setCourses(res.data.data.courses);
    } catch {
      toast.error('Failed to load pending courses.');
    }
  };

  const fetchPendingMeetings = async () => {
    try {
      const res = await zoomService.getPendingApprovals();
      if (res.data?.data?.meetings) setMeetings(res.data.data.meetings);
    } catch {
      toast.error('Failed to load pending class requests.');
    }
  };

  const fetchPending = async () => {
    setLoading(true);
    await Promise.all([fetchPendingCourses(), fetchPendingMeetings()]);
    setLoading(false);
  };

  useEffect(() => { fetchPending(); }, []);

  const handleApproveCourse = async (id) => {
    setActionId(id);
    try {
      await adminService.approveCourse(id);
      toast.success('Course approved and published!');
      setCourses((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed.');
    } finally {
      setActionId(null);
    }
  };

  const handleRejectCourse = async (id) => {
    const reason = rejectReasonMap[id] || '';
    setActionId(id);
    try {
      await adminService.rejectCourse(id, reason);
      toast.success('Course rejected.');
      setCourses((prev) => prev.filter((c) => c.id !== id));
      setShowRejectForm(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed.');
    } finally {
      setActionId(null);
    }
  };

  const handleApproveMeeting = async (id) => {
    setActionId(id);
    try {
      await zoomService.approveMeeting(id);
      toast.success('Class request approved!');
      setMeetings((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed.');
    } finally {
      setActionId(null);
    }
  };

  const handleRejectMeeting = async (id) => {
    const reason = rejectReasonMap[id] || '';
    setActionId(id);
    try {
      await zoomService.rejectMeeting(id, reason);
      toast.success('Class request rejected.');
      setMeetings((prev) => prev.filter((m) => m.id !== id));
      setShowRejectForm(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed.');
    } finally {
      setActionId(null);
    }
  };

  const rejectKey = (type, id) => `${type}-${id}`;

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-primary-900">Approvals</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review instructor course submissions and live class requests.
          </p>
        </div>
        <button
          onClick={fetchPending}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-all cursor-pointer"
        >
          <IoRefreshOutline size={14} /> Refresh
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('courses')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'courses'
              ? 'bg-primary-600 text-white'
              : 'bg-white border border-slate-100 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Courses {courses.length > 0 && `(${courses.length})`}
        </button>
        <button
          onClick={() => setActiveTab('classes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'classes'
              ? 'bg-primary-600 text-white'
              : 'bg-white border border-slate-100 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Live Classes {meetings.length > 0 && `(${meetings.length})`}
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white border border-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : activeTab === 'courses' ? (
        courses.length === 0 ? (
          <Card hover={false} className="bg-white border border-slate-100 p-16 text-center">
            <IoCheckmarkCircleOutline size={48} className="mx-auto mb-3 text-emerald-300" />
            <h3 className="text-base font-bold text-slate-700">All clear!</h3>
            <p className="text-sm text-slate-400 mt-1">No courses are pending approval right now.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {courses.map((course) => (
              <Card key={course.id} hover={false} className="bg-white border border-slate-100 p-6 rounded-2xl space-y-4">
                <div className="flex items-start gap-4">
                  <div className="shrink-0">
                    {course.thumbnail ? (
                      <img
                        src={getImageUrl(course.thumbnail)}
                        alt={course.title}
                        className="h-16 w-24 object-cover rounded-xl border border-slate-100"
                      />
                    ) : (
                      <div className="h-16 w-24 bg-primary-50 rounded-xl flex items-center justify-center">
                        <IoLayersOutline size={24} className="text-primary-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-heading font-bold text-slate-900 leading-tight">{course.title}</h3>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{course.shortDescription || course.description}</p>
                      </div>
                      <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">
                        <IoTimeOutline size={12} /> Pending
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <IoPersonOutline size={13} />
                        <strong className="text-slate-700">{course.instructor?.name}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <IoLayersOutline size={13} />
                        {course._count?.modules} modules
                      </span>
                    </div>
                  </div>
                </div>

                {showRejectForm === rejectKey('course', course.id) && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl space-y-2">
                    <label className="text-xs font-bold text-red-700 uppercase tracking-wider">Rejection Reason (optional)</label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-red-100 focus:outline-none focus:border-red-300 text-xs resize-none bg-white"
                      placeholder="Provide feedback to the instructor..."
                      value={rejectReasonMap[rejectKey('course', course.id)] || ''}
                      onChange={(e) => setRejectReasonMap((prev) => ({ ...prev, [rejectKey('course', course.id)]: e.target.value }))}
                    />
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2 border-t border-slate-50">
                  <Button variant="primary" size="sm" onClick={() => handleApproveCourse(course.id)} disabled={actionId === course.id}>
                    <IoCheckmarkCircleOutline size={16} />
                    {actionId === course.id ? 'Processing...' : 'Approve & Publish'}
                  </Button>
                  {showRejectForm === rejectKey('course', course.id) ? (
                    <Button variant="secondary" size="sm" onClick={() => handleRejectCourse(course.id)} disabled={actionId === course.id}>
                      Confirm Reject
                    </Button>
                  ) : (
                    <button onClick={() => setShowRejectForm(rejectKey('course', course.id))} className="text-xs font-bold text-red-500 px-4 py-2 border border-red-100 rounded-xl cursor-pointer">
                      Reject
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )
      ) : meetings.length === 0 ? (
        <Card hover={false} className="bg-white border border-slate-100 p-16 text-center">
          <IoCheckmarkCircleOutline size={48} className="mx-auto mb-3 text-emerald-300" />
          <h3 className="text-base font-bold text-slate-700">All clear!</h3>
          <p className="text-sm text-slate-400 mt-1">No live class requests are pending approval.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {meetings.map((meeting) => (
            <Card key={meeting.id} hover={false} className="bg-white border border-slate-100 p-6 rounded-2xl space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-heading font-bold text-slate-900">{meeting.topic}</h3>
                  {meeting.agenda && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{meeting.agenda}</p>}
                </div>
                <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">
                  <IoVideocamOutline size={12} /> Pending
                </span>
              </div>

              <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <IoPersonOutline size={13} />
                  <strong className="text-slate-700">{meeting.instructor?.name}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <IoLayersOutline size={13} />
                  {meeting.course?.title}
                </span>
                <span className="flex items-center gap-1">
                  <IoTimeOutline size={13} />
                  {new Date(meeting.startTime).toLocaleString()}
                </span>
                <span>{meeting.duration} min</span>
              </div>

              {showRejectForm === rejectKey('meeting', meeting.id) && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl space-y-2">
                  <label className="text-xs font-bold text-red-700 uppercase tracking-wider">Rejection Reason (optional)</label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-red-100 focus:outline-none focus:border-red-300 text-xs resize-none bg-white"
                    placeholder="Provide feedback to the instructor..."
                    value={rejectReasonMap[rejectKey('meeting', meeting.id)] || ''}
                    onChange={(e) => setRejectReasonMap((prev) => ({ ...prev, [rejectKey('meeting', meeting.id)]: e.target.value }))}
                  />
                </div>
              )}

              <div className="flex items-center gap-3 pt-2 border-t border-slate-50">
                <Button variant="primary" size="sm" onClick={() => handleApproveMeeting(meeting.id)} disabled={actionId === meeting.id}>
                  <IoCheckmarkCircleOutline size={16} />
                  {actionId === meeting.id ? 'Processing...' : 'Approve Class'}
                </Button>
                {showRejectForm === rejectKey('meeting', meeting.id) ? (
                  <Button variant="secondary" size="sm" onClick={() => handleRejectMeeting(meeting.id)} disabled={actionId === meeting.id}>
                    Confirm Reject
                  </Button>
                ) : (
                  <button onClick={() => setShowRejectForm(rejectKey('meeting', meeting.id))} className="text-xs font-bold text-red-500 px-4 py-2 border border-red-100 rounded-xl cursor-pointer">
                    Reject
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminApprovals;
