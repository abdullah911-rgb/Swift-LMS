import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../constants';
import Button from '../ui/Button';
import { IoLogOutOutline, IoHomeOutline, IoBookOutline, IoPersonOutline } from 'react-icons/io5';

const StudentLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.HOME);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <Link to={ROUTES.HOME} className="font-heading font-bold text-xl tracking-tight">
            LMS<span className="text-primary-400">Student</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link to={ROUTES.STUDENT_DASHBOARD} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 text-sm font-medium transition-all">
            <IoHomeOutline size={18} />
            <span>Dashboard</span>
          </Link>
          <Link to={ROUTES.COURSES} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 text-sm font-medium transition-all">
            <IoBookOutline size={18} />
            <span>Explore Courses</span>
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-red-950/30 text-red-400 text-sm font-medium transition-all cursor-pointer">
            <IoLogOutOutline size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8">
          <h2 className="text-lg font-heading font-semibold text-slate-800">Student Workspace</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-600">Welcome, {user?.name}</span>
            <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-heading font-semibold text-sm">
              {user?.name?.split(' ').map(n => n[0]).join('')}
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;
