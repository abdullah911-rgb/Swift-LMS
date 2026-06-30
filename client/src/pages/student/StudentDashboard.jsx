import React, { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { IoBookOutline, IoTimeOutline, IoRibbonOutline } from 'react-icons/io5';

const StudentDashboard = () => {
  const { user } = useAuth();
  
  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-heading font-bold text-slate-800">Student Dashboard</h1>
        <p className="text-sm text-slate-500">Track your enrolled courses, syllabus progress, and live sessions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card hover={false} className="bg-white border border-slate-100 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-blue-50 text-blue-600">
            <IoBookOutline size={24} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-500">Enrolled Courses</h3>
            <p className="text-2xl font-bold text-slate-800">1</p>
          </div>
        </Card>

        <Card hover={false} className="bg-white border border-slate-100 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600">
            <IoTimeOutline size={24} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-500">Active Progress</h3>
            <p className="text-2xl font-bold text-slate-800">25%</p>
          </div>
        </Card>

        <Card hover={false} className="bg-white border border-slate-100 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600">
            <IoRibbonOutline size={24} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-500">Certificates Earned</h3>
            <p className="text-2xl font-bold text-slate-800">0</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card hover={false} className="lg:col-span-2 border border-slate-100 bg-white space-y-4">
          <h3 className="text-base font-heading font-bold text-slate-800">Enrolled Syllabus Progress</h3>
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-slate-100 flex items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-700">Python for Data Science Beginners</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Category: Data Science</p>
              </div>
              <div className="text-right space-y-1">
                <span className="text-xs font-semibold text-slate-600">25% Done</span>
                <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: '25%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card hover={false} className="border border-slate-100 bg-white space-y-4">
          <h3 className="text-base font-heading font-bold text-slate-800">Upcoming Live Session</h3>
          <div className="p-4 rounded-xl bg-primary-50/50 border border-primary-100 text-center space-y-2">
            <span className="inline-block text-[10px] font-bold text-primary-700 bg-primary-100 px-2 py-0.5 rounded-full uppercase tracking-wider">Scheduled Zoom</span>
            <h4 className="text-xs font-bold text-slate-800">Introduction to Python Variables</h4>
            <p className="text-[10px] text-slate-500">Starts in 3 hours • Instructor John</p>
            <Button variant="primary" size="sm" className="w-full">Join Class</Button>
          </div>
        </Card>
      </div>

    </div>
  );
};

export default StudentDashboard;
