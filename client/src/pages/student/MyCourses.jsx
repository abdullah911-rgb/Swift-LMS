import { getImageUrl } from '../../constants/index';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { enrollmentService } from '../../services/portalService';
import { ROUTES } from '../../constants';
import { IoBookOutline, IoTimeOutline, IoRibbonOutline } from 'react-icons/io5';

const MyCourses = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // 'ALL', 'IN_PROGRESS', 'COMPLETED'

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const res = await enrollmentService.getMyEnrollments();
        if (res.data?.data?.enrollments) {
          setEnrollments(res.data.data.enrollments);
        }
      } catch (err) {
        console.error('Error fetching student enrollments:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEnrollments();
  }, []);

  const filteredEnrollments = enrollments.filter((e) => {
    if (filter === 'IN_PROGRESS') return e.progress < 100;
    if (filter === 'COMPLETED') return e.progress === 100;
    return true;
  });

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
          <h1 className="text-2xl font-heading font-bold text-primary-900">My Enrolled Courses</h1>
          <p className="text-sm text-slate-500">Access your online learning content, classes, and certificates.</p>
        </div>
        <Link to={ROUTES.COURSES}>
          <Button variant="primary" size="md">
            Explore Courses
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 border-b border-slate-100 pb-px">
        {['ALL', 'IN_PROGRESS', 'COMPLETED'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              filter === type
                ? 'border-accent-500 text-primary-700 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {type.replace('_', ' ')} ({enrollments.filter(e => {
              if (type === 'IN_PROGRESS') return e.progress < 100;
              if (type === 'COMPLETED') return e.progress === 100;
              return true;
            }).length})
          </button>
        ))}
      </div>

      {filteredEnrollments.length === 0 ? (
        <Card hover={false} className="text-center py-16 bg-white border border-slate-100 rounded-2xl p-8 shadow-sm">
          <p className="text-slate-400 mb-4">No courses found matching this category.</p>
          <Link to={ROUTES.COURSES}>
            <Button variant="secondary" size="sm">Explore Available Programs</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEnrollments.map((item) => (
            <Card key={item.id} hover={true} className="flex flex-col h-full overflow-hidden p-0 rounded-2xl bg-white border border-slate-100 group">
              {/* Thumbnail */}
              <div className="aspect-video w-full bg-slate-100 relative overflow-hidden">
                {item.course.thumbnail ? (
                  <img
                    src={getImageUrl(item.course.thumbnail)}
                    alt={item.course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-700 to-accent-500 text-white font-heading font-bold text-lg">
                    SWIFT
                  </div>
                )}
                <span className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-white/90 backdrop-blur text-slate-800 border border-white/50">
                  {item.course.level}
                </span>
              </div>

              {/* Body */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-accent-600 uppercase tracking-wider">
                    {item.course.category?.name || 'Safety & Technology'}
                  </span>
                  <h3 className="font-heading font-bold text-slate-800 text-base hover:text-primary-700 transition-colors line-clamp-1">
                    {item.course.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Instructor: {item.course.instructor?.name}</p>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Syllabus Progress</span>
                    <span className="text-primary-900 font-bold">{item.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-accent-500 h-full transition-all duration-500" style={{ width: `${item.progress}%` }}></div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link to={`/student/course/${item.courseId}`} className="block w-full">
                    <Button variant={item.progress === 100 ? 'secondary' : 'primary'} size="sm" className="w-full">
                      {item.progress === 100 ? 'Review Materials' : 'Resume Lectures'}
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCourses;
