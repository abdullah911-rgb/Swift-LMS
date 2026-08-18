import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import { adminService } from '../../services/portalService';
import {
  IoPeopleOutline,
  IoBookOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoStatsChartOutline,
  IoSchoolOutline,
  IoPersonOutline,
  IoRefreshOutline,
} from 'react-icons/io5';

const StatCard = ({ icon, label, value, color, sub }) => (
  <Card hover={false} className="bg-white border border-slate-100 flex items-center gap-3 sm:gap-4 p-4 sm:p-5 min-w-0">
    <div className={`p-3 rounded-2xl shrink-0 ${color}`}>{icon}</div>
    <div className="min-w-0">
      <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wide leading-tight">{label}</p>
      <p className="text-xl sm:text-2xl font-heading font-bold text-slate-900 mt-0.5">{value ?? '—'}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </Card>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [pendingCourses, setPendingCourses] = useState([]);
  const [recentEnrollments, setRecentEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, pendingRes, enrollRes] = await Promise.all([
        adminService.getStats(),
        adminService.getPendingCourses(),
        adminService.getRecentEnrollments(),
      ]);
      if (statsRes.data?.data?.stats) setStats(statsRes.data.data.stats);
      if (pendingRes.data?.data?.courses) setPendingCourses(pendingRes.data.data.courses.slice(0, 5));
      if (enrollRes.data?.data?.enrollments) setRecentEnrollments(enrollRes.data.data.enrollments.slice(0, 8));
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-primary-900">Admin Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Full Platform Overview — Users, Courses, and Enrollments.</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-all cursor-pointer"
        >
          <IoRefreshOutline size={14} /> Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={<IoPeopleOutline size={22} />}
          label="Total Users"
          value={stats?.totalUsers}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={<IoSchoolOutline size={22} />}
          label="Students"
          value={stats?.totalStudents}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          icon={<IoPersonOutline size={22} />}
          label="Instructors"
          value={stats?.totalInstructors}
          color="bg-violet-50 text-violet-600"
        />
        <StatCard
          icon={<IoBookOutline size={22} />}
          label="Published Courses"
          value={stats?.publishedCourses}
          sub={`${stats?.totalCourses ?? 0} total`}
          color="bg-primary-50 text-primary-600"
        />
        <StatCard
          icon={<IoTimeOutline size={22} />}
          label="Pending Approvals"
          value={stats?.pendingCourses}
          color="bg-amber-50 text-amber-600"
        />
        <StatCard
          icon={<IoStatsChartOutline size={22} />}
          label="Total Enrollments"
          value={stats?.totalEnrollments}
          color="bg-rose-50 text-rose-600"
        />
        <StatCard
          icon={<IoCheckmarkCircleOutline size={22} />}
          label="Live Courses"
          value={stats?.publishedCourses}
          color="bg-teal-50 text-teal-600"
        />

      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <Card hover={false} className="bg-white border border-slate-100 p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-heading font-bold text-primary-900 flex items-center gap-2">
              <IoTimeOutline size={16} className="text-amber-500" /> Pending Approvals
            </h3>
            <Link to="/admin/approvals" className="text-xs font-bold text-primary-600 hover:text-primary-700">
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : pendingCourses.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              <IoCheckmarkCircleOutline size={32} className="mx-auto mb-2 opacity-40" />
              No pending approvals. All caught up!
            </div>
          ) : (
            <div className="space-y-2">
              {pendingCourses.map((course) => (
                <div key={course.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-amber-100 transition-colors">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{course.title}</p>
                    <p className="text-[10px] text-slate-400">{course.instructor?.name} · {course._count?.modules} modules</p>
                  </div>
                  <Link
                    to="/admin/approvals"
                    className="shrink-0 ml-3 px-3 py-1 text-[10px] font-bold bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-all"
                  >
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Enrollments */}
        <Card hover={false} className="bg-white border border-slate-100 p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-heading font-bold text-primary-900 flex items-center gap-2">
              <IoSchoolOutline size={16} className="text-emerald-500" /> Recent Enrollments
            </h3>
            <Link to="/admin/enrollments" className="text-xs font-bold text-primary-600 hover:text-primary-700">
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-slate-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : recentEnrollments.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">No enrollments yet.</div>
          ) : (
            <div className="space-y-2">
              {recentEnrollments.map((enr) => (
                <div key={enr.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-heading font-bold text-xs shrink-0">
                    {enr.student?.name?.split(' ').map((n) => n[0]).join('') || 'S'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 truncate">{enr.student?.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{enr.course?.title}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(enr.enrolledAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
