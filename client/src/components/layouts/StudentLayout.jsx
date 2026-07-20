import React from 'react';
import { Outlet, Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../constants';
import { IoLogOutOutline, IoHomeOutline, IoBookOutline, IoPersonOutline, IoSchoolOutline, IoCalendarOutline, IoRibbonOutline, IoCardOutline } from 'react-icons/io5';
import AnnouncementBanner from '../common/AnnouncementBanner';

const StudentLayout = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const navItems = [
    { to: ROUTES.STUDENT_DASHBOARD,    label: 'Dashboard',       icon: <IoHomeOutline size={18} /> },
    { to: ROUTES.STUDENT_MY_COURSES,   label: 'My Courses',      icon: <IoSchoolOutline size={18} /> },
    { to: '/student/certificates',     label: 'Certificates',    icon: <IoRibbonOutline size={18} /> },
    { to: '/student/payments',         label: 'My Payments',     icon: <IoCardOutline size={18} /> },
    { to: ROUTES.STUDENT_CALENDAR,    label: 'Class Calendar',  icon: <IoCalendarOutline size={18} /> },
    { to: ROUTES.COURSES,              label: 'Explore Courses', icon: <IoBookOutline size={18} /> },
    { to: ROUTES.STUDENT_PROFILE,     label: 'My Profile',      icon: <IoPersonOutline size={18} /> },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-primary-950 text-white flex flex-col">
        <div className="p-6 border-b border-primary-900 flex items-center gap-3">
          <img src="/Logo1.jpeg" alt="SWIFT Logo" className="h-8 w-8 object-contain rounded bg-white p-0.5" />
          <Link to={ROUTES.HOME} className="font-heading font-bold text-lg tracking-tight text-white">
            SWIFT<span className="text-accent-400">Student</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === ROUTES.STUDENT_DASHBOARD}
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
        <div className="p-4 border-t border-primary-900">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-accent-500/10 text-accent-500 hover:text-accent-400 text-sm font-medium transition-all cursor-pointer">
            <IoLogOutOutline size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8">
          <h2 className="text-lg font-heading font-semibold text-primary-900">Student Workspace</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-600">Welcome, {user?.name}</span>
            <div className="h-8 w-8 rounded-full bg-accent-100 text-accent-800 flex items-center justify-center font-heading font-semibold text-sm border border-accent-200">
              {user?.name?.split(' ').map(n => n[0]).join('')}
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 overflow-y-auto p-8">
          <AnnouncementBanner />
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;
