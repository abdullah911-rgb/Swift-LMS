import React from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../constants';
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
} from 'react-icons/io5';
import AnnouncementBanner from '../common/AnnouncementBanner';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.HOME);
  };

  const navItems = [
    { to: ROUTES.ADMIN_DASHBOARD, icon: <IoHomeOutline size={18} />, label: 'Dashboard' },
    { to: '/admin/courses', icon: <IoBookOutline size={18} />, label: 'Courses' },
    { to: '/admin/approvals', icon: <IoCheckmarkCircleOutline size={18} />, label: 'Approvals' },
    { to: '/admin/instructors', icon: <IoPersonOutline size={18} />, label: 'Instructors' },
    { to: '/admin/users', icon: <IoPeopleOutline size={18} />, label: 'Users' },
    { to: '/admin/announcements', icon: <IoMegaphoneOutline size={18} />, label: 'Announcements' },
    { to: '/admin/enrollments', icon: <IoBarChartOutline size={18} />, label: 'Enrollments' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Sidebar - Distinct authoritative styling using deep slate / charcoal & red accents */}
      <aside className="w-64 bg-slate-950 text-white flex flex-col shrink-0 border-r border-slate-800">
        {/* Brand */}
        <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
          <img src="/Logo.jpeg" alt="Swift" className="h-9 w-9 object-contain rounded-lg border border-slate-800" />
          <div>
            <span className="font-heading font-bold text-lg tracking-tight text-slate-100">Swift</span>
            <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">System Admin</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-red-650 bg-red-600 text-white font-bold shadow-md shadow-red-900/30'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="p-4 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="h-9 w-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-heading font-bold text-sm shrink-0 shadow-sm">
              {user?.name?.split(' ').map((n) => n[0]).join('') || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-200 truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl hover:bg-red-950/40 text-red-400 hover:text-red-300 text-sm font-medium transition-all cursor-pointer"
          >
            <IoLogOutOutline size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2">
            <IoShieldCheckmarkOutline size={20} className="text-red-600" />
            <h2 className="text-base font-heading font-bold text-slate-800">System Admin Control Center</h2>
          </div>
          <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 px-3 py-1.5 rounded-lg">
            Role: Admin
          </span>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <AnnouncementBanner />
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
