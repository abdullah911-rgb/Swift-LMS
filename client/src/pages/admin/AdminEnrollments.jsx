import { getImageUrl } from '../../constants/index';
import React, { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import { adminService } from '../../services/portalService';
import toast from 'react-hot-toast';
import {
  IoSchoolOutline,
  IoPersonOutline,
  IoBookOutline,
  IoRefreshOutline,
  IoCalendarOutline,
  IoStatsChartOutline,
} from 'react-icons/io5';

const AdminEnrollments = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const res = await adminService.getRecentEnrollments();
      if (res.data?.data?.enrollments) setEnrollments(res.data.data.enrollments);
    } catch (err) {
      toast.error('Failed to load enrollments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEnrollments(); }, []);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-primary-900">Enrollment Reports</h1>
          <p className="text-sm text-slate-500 mt-1">
            {enrollments.length} recent enrollments shown. Track student activity across all courses.
          </p>
        </div>
        <button
          onClick={fetchEnrollments}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-all cursor-pointer"
        >
          <IoRefreshOutline size={14} /> Refresh
        </button>
      </div>

      <Card hover={false} className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-14 bg-slate-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : enrollments.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <IoSchoolOutline size={40} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No enrollments yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/80">
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Course</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Instructor</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Progress</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Enrolled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {enrollments.map((enr) => (
                  <tr key={enr.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {enr.student?.avatar ? (
                            <img
                              src={getImageUrl(enr.student.avatar)}
                              alt={enr.student.name}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            enr.student?.name?.split(' ').map((n) => n[0]).join('') || 'S'
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-xs">{enr.student?.name}</p>
                          <p className="text-[10px] text-slate-400">{enr.student?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs font-semibold text-slate-800 line-clamp-1 max-w-[200px]">
                        {enr.course?.title}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <IoPersonOutline size={12} />
                        <span>{enr.course?.instructor?.name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-500 rounded-full transition-all"
                            style={{ width: `${enr.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-semibold text-slate-600">
                          {enr.progress || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <IoCalendarOutline size={12} />
                        {new Date(enr.enrolledAt).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminEnrollments;
