import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { instructorService } from '../../services/portalService';
import { ROUTES } from '../../constants';
import { IoBookOutline, IoPeopleOutline, IoLayersOutline, IoAddOutline, IoEyeOutline } from 'react-icons/io5';

const InstructorDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await instructorService.getMyCourses();
        if (res.data?.data?.courses) {
          setCourses(res.data.data.courses);
        }
      } catch (err) {
        console.error('Error fetching instructor dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const totalCourses = courses.length;
  const totalStudents = courses.reduce((acc, curr) => acc + (curr._count?.enrollments || 0), 0);
  const totalModules = courses.reduce((acc, curr) => acc + (curr._count?.modules || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-primary-900">Instructor Dashboard</h1>
          <p className="text-sm text-slate-500">Monitor registrations, design courses, and review enrolled students.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card hover={false} className="bg-white border border-slate-100 flex items-center gap-4 p-5">
          <div className="p-3.5 rounded-2xl bg-primary-50 text-primary-600">
            <IoBookOutline size={24} />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Your Courses</h3>
            <p className="text-2xl font-bold text-primary-900">{totalCourses}</p>
          </div>
        </Card>

        <Card hover={false} className="bg-white border border-slate-100 flex items-center gap-4 p-5">
          <div className="p-3.5 rounded-2xl bg-accent-50 text-accent-700">
            <IoPeopleOutline size={24} />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Enrolled Students</h3>
            <p className="text-2xl font-bold text-primary-900">{totalStudents}</p>
          </div>
        </Card>

        <Card hover={false} className="bg-white border border-slate-100 flex items-center gap-4 p-5">
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600">
            <IoLayersOutline size={24} />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Course Modules</h3>
            <p className="text-2xl font-bold text-primary-900">{totalModules}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course List Card */}
        <Card hover={false} className="lg:col-span-2 border border-slate-100 bg-white space-y-4 p-6">
          <div className="flex justify-between items-center pb-2">
            <h3 className="text-base font-heading font-bold text-primary-900">Recent Courses</h3>
            {totalCourses > 0 && (
              <Link to={ROUTES.INSTRUCTOR_COURSES} className="text-xs font-bold text-accent-600 hover:text-accent-700">
                Manage All
              </Link>
            )}
          </div>

          {totalCourses === 0 ? (
            <div className="text-center py-12 space-y-2">
              <p className="text-sm text-slate-400">No courses assigned to your account yet.</p>
              <p className="text-xs text-slate-350">Please contact the system administrator to assign your courses.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {courses.slice(0, 4).map((course) => (
                <div key={course.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:border-primary-100 transition-all">
                  <div className="space-y-1 pr-4 min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{course.title}</h4>
                    <p className="text-[11px] text-slate-400">Category: {course.category?.name} • Level: {course.level}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      course.status === 'PUBLISHED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : course.status === 'DRAFT'
                        ? 'bg-slate-50 text-slate-500 border border-slate-150'
                        : 'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                      {course.status}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">{course._count?.enrollments || 0} Students</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Quick Links Card */}
        <Card hover={false} className="border border-slate-100 bg-white p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-heading font-bold text-primary-900 mb-3">Quick Actions</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Quickly draft new training modules, view registered students, or review existing curriculums. Swift's creator workspace makes course authoring simple.
            </p>
          </div>
          <div className="space-y-3">
            <Link to={ROUTES.INSTRUCTOR_COURSES} className="block w-full">
              <Button variant="outline" size="sm" className="w-full flex items-center justify-center gap-2">
                <IoBookOutline size={16} /> Manage Courses
              </Button>
            </Link>
            <Link to={ROUTES.INSTRUCTOR_STUDENTS} className="block w-full">
              <Button variant="secondary" size="sm" className="w-full flex items-center justify-center gap-2">
                <IoPeopleOutline size={16} /> View Enrolled Students
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default InstructorDashboard;
