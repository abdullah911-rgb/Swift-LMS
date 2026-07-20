import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../constants';
import { adminService, zoomService } from '../../services/portalService';
import {
  IoLogOutOutline,
  IoHomeOutline,
  IoPeopleOutline,
  IoBookOutline,
  IoCheckmarkCircleOutline,
  IoBarChartOutline,
  IoShieldCheckmarkOutline,
  IoPersonOutline,
  IoMegaphoneOutline,
  IoMenuOutline,
  IoCloseOutline,
  IoCardOutline,
  IoCashOutline,
} from 'react-icons/io5';
import AnnouncementBanner from '../common/AnnouncementBanner';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const location = useLocation();

  const fetchPendingCount = useCallback(async () => {
    try {
      const [coursesRes, meetingsRes] = await Promise.all([
        adminService.getPendingCourses(),
        zoomService.getPendingApprovals(),
      ]);
      const courseCount = coursesRes.data?.data?.courses?.length ?? 0;
      const meetingCount = meetingsRes.data?.data?.meetings?.length ?? 0;
      setPendingApprovals(courseCount + meetingCount);
    } catch {
      // Non-critical — badge stays at last known count
    }
  }, []);

  useEffect(() => {
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 60000);
    return () => clearInterval(interval);
  }, [fetchPendingCount, location.pathname]);

  const handleLogout = async () => {
    await logout();
  };

  const navItems = [
    { to: ROUTES.ADMIN_DASHBOARD,    icon: <IoHomeOutline size={18} />,             label: 'Dashboard' },
    { to: '/admin/courses',          icon: <IoBookOutline size={18} />,             label: 'Courses' },
    { to: '/admin/approvals',        icon: <IoCheckmarkCircleOutline size={18} />, label: 'Approvals', badge: pendingApprovals },
    { to: '/admin/instructors',      icon: <IoPersonOutline size={18} />,           label: 'Instructors' },
    { to: '/admin/users',            icon: <IoPeopleOutline size={18} />,           label: 'Users' },
    { to: '/admin/payments',         icon: <IoCardOutline size={18} />,             label: 'Payments' },
    { to: '/admin/revenue',          icon: <IoCashOutline size={18} />,             label: 'Revenue' },
    { to: '/admin/announcements',    icon: <IoMegaphoneOutline size={18} />,        label: 'Announcements' },
    { to: '/admin/enrollments',      icon: <IoBarChartOutline size={18} />,         label: 'Enrollments' },
  ];

  const sidebarContent = (
    <>
      <div className="p-6 border-b border-slate-800/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img src="/Logo1.jpeg" alt="Swift" className="h-9 w-9 object-contain rounded-lg border border-slate-800 shrink-0" />
          <div className="min-w-0">
            <span className="font-heading font-bold text-lg tracking-tight text-slate-100">Swift</span>
            <p className="text-[10px] text-accent-500 font-bold uppercase tracking-widest">System Admin</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close menu"
        >
          <IoCloseOutline size={22} />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-accent-500 text-primary-950 font-bold shadow-md shadow-accent-500/20'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`
            }
          >
            {item.icon}
            <span className="flex-1">{item.label}</span>
            {item.badge > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800/80 space-y-2">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="h-9 w-9 rounded-xl bg-accent-500 text-primary-950 flex items-center justify-center font-heading font-bold text-sm shrink-0 shadow-sm">
            {user?.name?.split(' ').map((n) => n[0]).join('') || 'A'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-200 truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl hover:bg-accent-500/10 text-accent-500 hover:text-accent-400 text-sm font-medium transition-all cursor-pointer"
        >
          <IoLogOutOutline size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 text-white flex flex-col border-r border-slate-800 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:shrink-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 sm:px-8 shrink-0 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
              aria-label="Open menu"
            >
              <IoMenuOutline size={24} />
            </button>
            <IoShieldCheckmarkOutline size={20} className="text-accent-500 shrink-0 hidden sm:block" />
            <h2 className="text-sm sm:text-base font-heading font-bold text-slate-800 truncate">
              System Admin Control Center
            </h2>
          </div>
          <span className="text-xs font-bold text-accent-600 bg-accent-50 border border-accent-200 px-3 py-1.5 rounded-lg shrink-0">
            Role: Admin
          </span>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <AnnouncementBanner />
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
