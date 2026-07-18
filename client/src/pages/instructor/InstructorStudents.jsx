import { getImageUrl } from '../../constants/index';
import React, { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import { instructorService } from '../../services/portalService';
import { IoPeopleOutline, IoBookOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';

const InstructorStudents = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [enrollments, setEnrollments] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await instructorService.getMyCourses();
        if (res.data?.data?.courses) {
          const myCourses = res.data.data.courses;
          setCourses(myCourses);
          if (myCourses.length > 0) {
            setSelectedCourseId(myCourses[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching courses for student list:', err);
        toast.error('Failed to load courses.');
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    if (!selectedCourseId) return;
    const fetchStudents = async () => {
      setLoadingStudents(true);
      try {
        const res = await instructorService.getCourseStudents(selectedCourseId);
        if (res.data?.data?.enrollments) {
          setEnrollments(res.data.data.enrollments);
        }
      } catch (err) {
        console.error('Error fetching students:', err);
        toast.error('Failed to load enrolled student details.');
      } finally {
        setLoadingStudents(false);
      }
    };
    fetchStudents();
  }, [selectedCourseId]);

  if (loadingCourses) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-heading font-bold text-primary-900">Enrolled Students View</h1>
        <p className="text-sm text-slate-500">Monitor overall progress percentages and enrollment registrations for your classes.</p>
      </div>

      <Card hover={false} className="bg-white border border-slate-100 p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <IoBookOutline size={18} className="text-primary-700" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Course Catalogue</span>
          </div>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-100 bg-white focus:outline-none focus:border-primary-600 text-sm w-full sm:w-72"
          >
            {courses.length === 0 ? (
              <option value="">No courses created</option>
            ) : (
              courses.map((course) => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))
            )}
          </select>
        </div>
      </Card>

      {loadingStudents ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
        </div>
      ) : enrollments.length === 0 ? (
        <Card hover={false} className="text-center py-16 bg-white border border-slate-100 rounded-2xl p-8 shadow-sm">
          <p className="text-slate-400 text-sm">No student registrations found for this course yet.</p>
        </Card>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-sm font-bold text-primary-900 flex items-center gap-2">
              <IoPeopleOutline size={18} className="text-accent-500" />
              <span>Registered Students ({enrollments.length})</span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Student Details</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Enrollment Date</th>
                  <th className="px-6 py-4">Syllabus Completion</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="hover:bg-slate-50/30 transition-colors">
                    {/* Student Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {enrollment.student.avatar ? (
                          <img
                            src={getImageUrl(enrollment.student.avatar)}
                            alt={enrollment.student.name}
                            className="h-8 w-8 rounded-full object-cover border border-slate-100"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-heading font-bold text-xs uppercase border border-primary-200">
                            {enrollment.student.name.split(' ').map(n => n[0]).join('')}
                          </div>
                        )}
                        <span className="font-bold text-slate-800">{enrollment.student.name}</span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4 text-slate-600">
                      {enrollment.student.email}
                    </td>

                    {/* Enrollment Date */}
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(enrollment.enrolledAt).toLocaleDateString()}
                    </td>

                    {/* Completion bar */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 max-w-[200px]">
                        <span className="font-bold text-slate-800 shrink-0">{enrollment.progress}%</span>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-accent-500 h-full" style={{ width: `${enrollment.progress}%` }}></div>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        enrollment.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : enrollment.status === 'ACTIVE'
                          ? 'bg-primary-50 text-primary-750 border border-primary-100'
                          : 'bg-red-50 text-red-750 border border-red-100'
                      }`}>
                        {enrollment.status}
                      </span>
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

export default InstructorStudents;
