import React from 'react';
import Card from '../../components/ui/Card';
import { IoPeopleOutline, IoBookOutline, IoRibbonOutline, IoSettingsOutline } from 'react-icons/io5';

const AdminDashboard = () => {
  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-heading font-bold text-slate-800">Admin Control Center</h1>
        <p className="text-sm text-slate-500">Configure global configurations, manage users, and inspect logs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card hover={false} className="bg-white border border-slate-100 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-blue-50 text-blue-600">
            <IoPeopleOutline size={24} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-500">Total Users</h3>
            <p className="text-2xl font-bold text-slate-800">1,280</p>
          </div>
        </Card>

        <Card hover={false} className="bg-white border border-slate-100 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600">
            <IoBookOutline size={24} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-500">Courses</h3>
            <p className="text-2xl font-bold text-slate-800">12</p>
          </div>
        </Card>

        <Card hover={false} className="bg-white border border-slate-100 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600">
            <IoRibbonOutline size={24} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-500">Certificates</h3>
            <p className="text-2xl font-bold text-slate-800">84</p>
          </div>
        </Card>

        <Card hover={false} className="bg-white border border-slate-100 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-red-50 text-red-600">
            <IoSettingsOutline size={24} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-500">Integrations</h3>
            <p className="text-2xl font-bold text-slate-800">Zoom/SMTP</p>
          </div>
        </Card>
      </div>

      <Card hover={false} className="border border-slate-100 bg-white space-y-4">
        <h3 className="text-base font-heading font-bold text-slate-800">Global Settings Overview</h3>
        <p className="text-xs text-slate-400 leading-relaxed">Modify category paths, assign roles (Student to Instructor, etc.), or disable accounts. Access all database tables via Prisma Studio terminal scripts.</p>
      </Card>

    </div>
  );
};

export default AdminDashboard;
