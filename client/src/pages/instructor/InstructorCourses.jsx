import { getImageUrl } from '../../constants/index';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import { instructorService } from '../../services/portalService';
import { IoBookOutline, IoPeopleOutline, IoLayersOutline, IoInformationCircleOutline, IoSettingsOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';

const InstructorCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = async () => {
    try {
      const res = await instructorService.getMyCourses();
      if (res.data?.data?.courses) {
        setCourses(res.data.data.courses);
      }
    } catch {
      toast.error('Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourses(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-primary-900">My Assigned Courses</h1>
          <p className="text-sm text-slate-500">Courses assigned to you by the administrator.</p>
        </div>
      </div>

      {/* Info notice */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
        <IoInformationCircleOutline size={20} className="shrink-0 mt-0.5" />
        <p>
          Courses are assigned to you by the admin. You can manage class sessions, view enrolled students, and track attendance for your assigned courses.
          Contact the administrator if you need a course added or updated.
        </p>
      </div>

      {courses.length === 0 ? (
        <Card hover={false} className="text-center py-16 bg-white border border-slate-100 rounded-2xl p-8 shadow-sm">
          <IoBookOutline size={40} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 font-semibold mb-1">No courses assigned yet.</p>
          <p className="text-xs text-slate-400">Please contact the administrator to get courses assigned to you.</p>
        </Card>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Course Info</th>
                  <th className="px-6 py-4">Category / Level</th>
                  <th className="px-6 py-4">Syllabus Structure</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {course.thumbnail ? (
                          <img
                            src={getImageUrl(course.thumbnail)}
                            alt={course.title}
                            className="h-10 w-14 object-cover rounded-lg border border-slate-100"
                          />
                        ) : (
                          <div className="h-10 w-14 bg-primary-700 text-white rounded-lg flex items-center justify-center font-bold text-[9px]">
                            SWIFT
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 line-clamp-1">{course.title}</p>
                          <span className="text-[10px] text-slate-400 font-medium">
                            Assigned: {new Date(course.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-slate-700">{course.category?.name}</p>
                        <p className="text-[10px] text-slate-400 capitalize">{course.level?.toLowerCase()}</p>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex items-center gap-4 text-xs font-semibold">
                        <span className="flex items-center gap-1">
                          <IoLayersOutline size={14} className="text-primary-600" />
                          {course._count?.modules || 0} Modules
                        </span>
                        <span className="flex items-center gap-1">
                          <IoPeopleOutline size={14} className="text-accent-500" />
                          {course._count?.enrollments || 0} Students
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-bold text-slate-800">
                      {course.isFree ? 'Free' : `PKR ${course.price}`}
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        course.status === 'PUBLISHED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : course.status === 'DRAFT'
                          ? 'bg-slate-50 text-slate-500 border border-slate-150'
                          : 'bg-red-50 text-red-700 border border-red-100'
                      }`}>
                        {course.status}
                      </span>
                    </td>

                    {/* Manage Button */}
                    <td className="px-6 py-4">
                      <Link
                        to={`/instructor/courses/${course.id}/manage`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl transition-all"
                      >
                        <IoSettingsOutline size={13} />
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorCourses;
