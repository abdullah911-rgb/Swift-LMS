import React, { useState } from 'react';
import { Outlet, Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../constants';
import {
  IoLogOutOutline,
  IoHomeOutline,
  IoBookOutline,
  IoPersonOutline,
  IoSchoolOutline,
  IoCalendarOutline,
  IoRibbonOutline,
  IoCardOutline,
  IoMenuOutline,
  IoCloseOutline,
} from 'react-icons/io5';
import AnnouncementBanner from '../common/AnnouncementBanner';

const StudentLayout = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const navItems = [
    { to: ROUTES.STUDENT_DASHBOARD,  label: 'Dashboard',       icon: <IoHomeOutline size={18} /> },
    { to: ROUTES.STUDENT_MY_COURSES, label: 'My Courses',      icon: <IoSchoolOutline size={18} /> },
    { to: '/student/certificates',   label: 'Certificates',    icon: <IoRibbonOutline size={18} /> },
    { to: '/student/payments',       label: 'My Payments',     icon: <IoCardOutline size={18} /> },
    { to: ROUTES.STUDENT_CALENDAR,  label: 'Class Calendar',  icon: <IoCalendarOutline size={18} /> },
    { to: ROUTES.COURSES,            label: 'Explore Courses', icon: <IoBookOutline size={18} /> },
    { to: ROUTES.STUDENT_PROFILE,   label: 'My Profile',      icon: <IoPersonOutline size={18} /> },
  ];

  const SidebarContent = () => (
    <>
      {/* Sidebar header */}
      <div className="p-5 border-b border-primary-900 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <img src="/Logo1.jpeg" alt="SWIFT Logo" className="h-8 w-8 object-contain rounded bg-white p-0.5 shrink-0" />
          <Link
            to={ROUTES.HOME}
            className="font-heading font-bold text-lg tracking-tight text-white truncate"
            onClick={() => setSidebarOpen(false)}
          >
            SWIFT<span className="text-accent-400">Student</span>
          </Link>
        </div>
        {/* Close button — only visible on mobile */}
        <button
          className="lg:hidden text-primary-300 hover:text-white p-1 rounded-lg transition-colors"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        >
          <IoCloseOutline size={22} />
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === ROUTES.STUDENT_DASHBOARD}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-accent-500 text-primary-950 font-bold shadow-md shadow-accent-500/10'
                  : 'text-primary-100 hover:bg-primary-900 hover:text-white'
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-primary-900 shrink-0">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-accent-500/10 text-accent-500 hover:text-accent-400 text-sm font-medium transition-all cursor-pointer"
        >
          <IoLogOutOutline size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* ── Mobile Backdrop ─────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ────────────────────────────────────── */}
      {/* On mobile: fixed slide-in panel. On lg+: static column */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-primary-950 text-white
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:translate-x-0 lg:flex lg:shrink-0
        `}
      >
        <SidebarContent />
      </aside>

      {/* ── Main Content ───────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top bar */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0">
          {/* Hamburger — only on mobile/tablet */}
          <button
            className="lg:hidden text-slate-500 hover:text-primary-700 p-1 rounded-lg transition-colors"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <IoMenuOutline size={24} />
          </button>

          <h2 className="text-base sm:text-lg font-heading font-semibold text-primary-900 lg:ml-0 ml-3 truncate">
            Student Workspace
          </h2>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <span className="hidden sm:block text-sm font-medium text-slate-600 truncate max-w-[140px]">
              Welcome, {user?.name}
            </span>
            <div className="h-8 w-8 rounded-full bg-accent-100 text-accent-800 flex items-center justify-center font-heading font-semibold text-sm border border-accent-200 shrink-0">
              {user?.name?.split(' ').map(n => n[0]).join('')}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <AnnouncementBanner />
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;
