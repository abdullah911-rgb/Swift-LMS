import React, { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import { adminService } from '../../services/portalService';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  IoRefreshOutline,
  IoPeopleOutline,
  IoWarningOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
} from 'react-icons/io5';

const AdminAttendance = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [attendance, setAttendance] = useState(null);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [reactivatingId, setReactivatingId] = useState(null);

  useEffect(() => {
    api.get('/admin/courses?limit=200').then((res) => {
      if (res.data?.data?.courses) setCourses(res.data.data.courses);
    }).catch(() => toast.error('Failed to load courses.')).finally(() => setLoadingCourses(false));
  }, []);

  const loadAttendance = async (courseId) => {
    if (!courseId) return;
    setLoadingAttendance(true);
    setAttendance(null);
    try {
      const res = await adminService.getCourseAttendance(courseId);
      setAttendance(res.data?.data);
    } catch {
      toast.error('Failed to load attendance data.');
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleCourseChange = (e) => {
    setSelectedCourse(e.target.value);
    loadAttendance(e.target.value);
  };

  const handleReactivate = async (studentId, courseId) => {
    setReactivatingId(studentId);
    try {
      await api.patch(`/admin/enrollments/${studentId}/${courseId}/reactivate`);
      toast.success('Enrollment reactivated.');
      loadAttendance(courseId);
    } catch {
      toast.error('Failed to reactivate enrollment.');
    } finally {
      setReactivatingId(null);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900">Attendance Management</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor student attendance per course. Students below 80% are auto-deactivated.</p>
        </div>
      </div>

      {/* Course Selector */}
      <Card hover={false} className="bg-white border border-slate-100 rounded-2xl p-6">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">Select Course</label>
        {loadingCourses ? (
          <div className="h-10 bg-slate-100 rounded-lg animate-pulse w-64" />
        ) : (
          <select
            className="w-full max-w-md px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-primary-400 bg-white"
            value={selectedCourse}
            onChange={handleCourseChange}
          >
            <option value="">— Select a course to view attendance —</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        )}
      </Card>

      {/* Attendance Table */}
      {loadingAttendance && (
        <div className="flex items-center justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      )}

      {attendance && !loadingAttendance && (
        <Card hover={false} className="bg-white border border-slate-100 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">
              Attendance Report — {attendance.totalMeetings} Total Classes
            </h3>
            <button onClick={() => loadAttendance(selectedCourse)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 cursor-pointer">
              <IoRefreshOutline size={14} /> Refresh
            </button>
          </div>

          {attendance.students.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <IoPeopleOutline size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No active enrollments for this course.</p>
            </div>
          ) : (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-4 mb-5">
                <div className="p-3 rounded-xl bg-slate-50 text-center">
                  <p className="text-xs text-slate-500 mb-1">Total Students</p>
                  <p className="text-2xl font-bold text-slate-800">{attendance.students.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-green-50 text-center">
                  <p className="text-xs text-slate-500 mb-1">Above 80%</p>
                  <p className="text-2xl font-bold text-green-700">
                    {attendance.students.filter(s => !s.belowThreshold).length}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-red-50 text-center">
                  <p className="text-xs text-slate-500 mb-1">Below 80%</p>
                  <p className="text-2xl font-bold text-red-700">
                    {attendance.students.filter(s => s.belowThreshold).length}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-bold">
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Classes Attended</th>
                      <th className="px-4 py-3">Attendance %</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendance.students.map((s) => (
                      <tr key={s.studentId} className={`hover:bg-slate-50/50 ${s.belowThreshold ? 'bg-red-50/30' : ''}`}>
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-800">{s.name}</p>
                          <p className="text-[10px] text-slate-400">{s.email}</p>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-700">
                          {s.attended} / {s.totalMeetings}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${s.percentage >= 80 ? 'bg-green-500' : s.percentage >= 50 ? 'bg-amber-400' : 'bg-red-500'}`}
                                style={{ width: `${s.percentage}%` }}
                              />
                            </div>
                            <span className={`font-bold ${s.percentage >= 80 ? 'text-green-700' : 'text-red-600'}`}>
                              {s.percentage}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {s.belowThreshold ? (
                            <span className="flex items-center gap-1 text-red-600 font-semibold">
                              <IoWarningOutline size={14} /> Below Threshold
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-green-600 font-semibold">
                              <IoCheckmarkCircleOutline size={14} /> Good Standing
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {s.belowThreshold && (
                            <button
                              onClick={() => handleReactivate(s.studentId, selectedCourse)}
                              disabled={reactivatingId === s.studentId}
                              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-primary-50 text-primary-700 border border-primary-100 rounded-lg hover:bg-primary-100 transition-all cursor-pointer disabled:opacity-50"
                            >
                              <IoCloseCircleOutline size={14} />
                              Reactivate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
};

export default AdminAttendance;
