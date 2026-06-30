import React from 'react';
import Card from '../../components/ui/Card';
import { IoBookOutline, IoPeopleOutline, IoCalendarOutline } from 'react-icons/io5';

const InstructorDashboard = () => {
  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-heading font-bold text-slate-800">Instructor Workspace</h1>
        <p className="text-sm text-slate-500">Monitor course registrations, schedule Zoom sessions, and view modules.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card hover={false} className="bg-white border border-slate-100 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-blue-50 text-blue-600">
            <IoBookOutline size={24} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-500">Total Courses</h3>
            <p className="text-2xl font-bold text-slate-800">2</p>
          </div>
        </Card>

        <Card hover={false} className="bg-white border border-slate-100 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600">
            <IoPeopleOutline size={24} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-500">Active Students</h3>
            <p className="text-2xl font-bold text-slate-800">420</p>
          </div>
        </Card>

        <Card hover={false} className="bg-white border border-slate-100 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600">
            <IoCalendarOutline size={24} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-500">Upcoming Live</h3>
            <p className="text-2xl font-bold text-slate-800">1</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card hover={false} className="border border-slate-100 bg-white space-y-4">
          <h3 className="text-base font-heading font-bold text-slate-800">Course Management</h3>
          <div className="space-y-3.5">
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100">
              <span className="text-sm font-bold text-slate-700">Complete React Developer 2024</span>
              <span className="text-xs bg-emerald-105 bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">Published</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100">
              <span className="text-sm font-bold text-slate-700">Python for Data Science Beginners</span>
              <span className="text-xs bg-emerald-105 bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">Published</span>
            </div>
          </div>
        </Card>

        <Card hover={false} className="border border-slate-100 bg-white space-y-4">
          <h3 className="text-base font-heading font-bold text-slate-800">Add Live Session</h3>
          <p className="text-xs text-slate-400 leading-relaxed">Instantly configure a Zoom SDK meeting directly from this workspace. Invite all enrolled students automatically.</p>
        </Card>
      </div>

    </div>
  );
};

export default InstructorDashboard;
