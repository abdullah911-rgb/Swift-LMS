import { getImageUrl } from '../../constants/index';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { enrollmentService } from '../../services/portalService';
import { ROUTES } from '../../constants';
import { IoBookOutline, IoTimeOutline, IoRibbonOutline, IoCalendarOutline, IoChevronForwardOutline } from 'react-icons/io5';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await enrollmentService.getMyEnrollments();
        if (res.data?.data?.enrollments) {
          setEnrollments(res.data.data.enrollments);
        }
      } catch (err) {
        console.error('Error fetching student dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const totalCourses = enrollments.length;
  const completedCourses = enrollments.filter((e) => e.progress === 100).length;
  const avgProgress = totalCourses > 0
    ? Math.round(enrollments.reduce((acc, curr) => acc + curr.progress, 0) / totalCourses)
    : 0;

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
          <h1 className="text-2xl font-heading font-bold text-primary-900">Welcome back, {user?.name}!</h1>
          <p className="text-sm text-slate-500">Track your learning progress and certification status.</p>
        </div>
        <Link to={ROUTES.COURSES}>
          <Button variant="primary" size="md">
            Find New Courses
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card hover={false} className="bg-white border border-slate-100 flex items-center gap-4 p-5">
          <div className="p-3.5 rounded-2xl bg-primary-50 text-primary-600">
            <IoBookOutline size={24} />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Enrolled Courses</h3>
            <p className="text-2xl font-bold text-primary-900">{totalCourses}</p>
          </div>
        </Card>

        <Card hover={false} className="bg-white border border-slate-100 flex items-center gap-4 p-5">
          <div className="p-3.5 rounded-2xl bg-accent-50 text-accent-700">
            <IoTimeOutline size={24} />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Progress</h3>
            <p className="text-2xl font-bold text-primary-900">{avgProgress}%</p>
          </div>
        </Card>

        <Card hover={false} className="bg-white border border-slate-100 flex items-center gap-4 p-5">
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600">
            <IoRibbonOutline size={24} />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Certificates Earned</h3>
            <p className="text-2xl font-bold text-primary-900">{completedCourses}</p>
          </div>
        </Card>
      </div>

      {/* Course List / Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card hover={false} className="lg:col-span-2 border border-slate-100 bg-white space-y-4 p-6">
          <div className="flex justify-between items-center pb-2">
            <h3 className="text-base font-heading font-bold text-primary-900">Your Enrolled Courses</h3>
            {totalCourses > 0 && (
              <Link to={ROUTES.STUDENT_MY_COURSES} className="text-xs font-bold text-accent-600 hover:text-accent-700 flex items-center gap-1">
                View All <IoChevronForwardOutline />
              </Link>
            )}
          </div>

          {totalCourses === 0 ? (
            <div className="text-center py-12 space-y-4">
              <p className="text-sm text-slate-400">You are not enrolled in any courses yet.</p>
              <Link to={ROUTES.COURSES}>
                <Button variant="secondary" size="sm">Explore SWIFT Catalog</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {enrollments.slice(0, 3).map((item) => (
                <div key={item.id} className="p-4 rounded-2xl border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-primary-100 transition-all">
                  <div className="flex items-center gap-3">
                    {item.course.thumbnail ? (
                      <img
                        src={getImageUrl(item.course.thumbnail)}
                        alt={item.course.title}
                        className="h-12 w-16 object-cover rounded-lg border border-slate-100"
                      />
                    ) : (
                      <div className="h-12 w-16 bg-primary-700 text-white rounded-lg flex items-center justify-center font-bold text-[10px]">
                        SWIFT
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{item.course.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">Category: {item.course.category?.name || 'Safety & Technology'}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-0 pt-3 sm:pt-0">
                    <div className="text-left sm:text-right space-y-1">
                      <span className="text-xs font-bold text-primary-900">{item.progress}% Done</span>
                      <div className="w-28 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-accent-500 h-full" style={{ width: `${item.progress}%` }}></div>
                      </div>
                    </div>
                    <Link to={`/student/course/${item.courseId}`}>
                      <Button variant="outline" size="sm">
                        {item.progress === 100 ? 'Review' : 'Continue'}
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Sidebar Info/Quick Access Card */}
        <Card hover={false} className="border border-slate-100 bg-white space-y-4 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-heading font-bold text-primary-900 mb-3">Live Class Hub</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Join active Zoom classes scheduled by SWIFT trainers. Download manuals and complete modules to prepare for exams.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-primary-50 border border-primary-100 text-center space-y-3">
            <div className="mx-auto h-10 w-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center shadow-inner">
              <IoCalendarOutline size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-primary-900">Virtual Classrooms</h4>
              <p className="text-[10px] text-slate-500 mt-1">Check scheduled meetings inside each course portal.</p>
            </div>
            <Link to={ROUTES.STUDENT_MY_COURSES} className="block w-full">
              <Button variant="primary" size="sm" className="w-full">
                Enter Class Portal
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
