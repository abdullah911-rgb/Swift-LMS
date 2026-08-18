import { getImageUrl } from '../../constants/index';
import React, { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { instructorService } from '../../services/portalService';
import api from '../../services/api';
import {
  IoPeopleOutline,
  IoBookOutline,
  IoCalendarOutline,
  IoCheckmarkCircle,
  IoCloseCircle,
  IoWarning,
  IoCloseOutline,
} from 'react-icons/io5';
import toast from 'react-hot-toast';

// Attendance badge colour based on percentage
const getAttendanceBadge = (pct) => {
  if (pct === null)
    return { bg: 'bg-slate-50 border-slate-100 text-slate-400', label: 'No sessions yet' };
  if (pct >= 80)
    return { bg: 'bg-emerald-50 border-emerald-100 text-emerald-700', label: `${pct}%` };
  if (pct >= 50)
    return { bg: 'bg-amber-50 border-amber-100 text-amber-700', label: `${pct}%` };
  return { bg: 'bg-red-50 border-red-100 text-red-700', label: `${pct}%` };
};

// Attendance progress bar colour
const getBarColor = (pct) => {
  if (pct === null) return 'bg-slate-200';
  if (pct >= 80) return 'bg-emerald-500';
  if (pct >= 50) return 'bg-amber-400';
  return 'bg-red-500';
};

const InstructorStudents = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [enrollments, setEnrollments] = useState([]);
  const [totalMeetings, setTotalMeetings] = useState(0);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Performance Modal states
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [loadingEval, setLoadingEval] = useState(false);

  const handleEnrollmentClick = async (enrollment) => {
    setSelectedStudent(enrollment);
    setLoadingEval(true);
    setEvaluation(null);
    try {
      const res = await api.get(`/quiz/course/${selectedCourseId}/evaluate`, {
        params: { userId: enrollment.studentId }
      });
      if (res.data?.data?.evaluation) {
        setEvaluation(res.data.data.evaluation);
      } else {
        toast.error('Failed to load performance metrics.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error compiling student metrics.');
    } finally {
      setLoadingEval(false);
    }
  };

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
          setTotalMeetings(res.data.data.totalMeetings ?? 0);
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

  // Summary stats for the selected course
  const attended80Plus = enrollments.filter(
    (e) => e.attendance?.percentage !== null && e.attendance?.percentage >= 80
  ).length;
  const attendedBelow80 = enrollments.filter(
    (e) => e.attendance?.percentage !== null && e.attendance?.percentage < 80
  ).length;

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-heading font-bold text-primary-900">Enrolled Students View</h1>
        <p className="text-sm text-slate-500">
          Monitor Attendance, Progress, and Enrollment Status for Your Classes.
        </p>
      </div>

      {/* Course Selector */}
      <Card hover={false} className="bg-white border border-slate-100 p-6 rounded-2xl" style={{ overflow: 'visible' }}>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <IoBookOutline size={18} className="text-primary-700" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Select Course Catalogue
            </span>
          </div>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-100 bg-white focus:outline-none focus:border-primary-600 text-sm w-full max-w-sm"
          >
            {courses.length === 0 ? (
              <option value="">No courses created</option>
            ) : (
              courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))
            )}
          </select>
        </div>
      </Card>

      {/* Attendance Summary Cards */}
      {!loadingStudents && enrollments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total sessions held */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
            <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
              <IoCalendarOutline size={20} className="text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">
                Total Sessions
              </p>
              <p className="text-2xl font-heading font-bold text-primary-900">{totalMeetings}</p>
            </div>
          </div>
          {/* Students ≥ 80% attendance */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <IoCheckmarkCircle size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">
                Attendance ≥ 80%
              </p>
              <p className="text-2xl font-heading font-bold text-emerald-700">{attended80Plus}</p>
            </div>
          </div>
          {/* Students < 80% attendance */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
            <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
              <IoWarning size={20} className="text-red-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">
                Below 80% Attendance
              </p>
              <p className="text-2xl font-heading font-bold text-red-600">{attendedBelow80}</p>
            </div>
          </div>
        </div>
      )}

      {/* Student Table */}
      {loadingStudents ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
        </div>
      ) : enrollments.length === 0 ? (
        <Card
          hover={false}
          className="text-center py-16 bg-white border border-slate-100 rounded-2xl p-8 shadow-sm"
        >
          <p className="text-slate-400 text-sm">
            No student registrations found for this course yet.
          </p>
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
                <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="px-6 py-4">Student Details</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Enrolled</th>
                  <th className="px-6 py-4">Attendance</th>
                  <th className="px-6 py-4">Syllabus</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enrollments.map((enrollment) => {
                  const att = enrollment.attendance ?? { attended: 0, total: totalMeetings, percentage: null };
                  const badge = getAttendanceBadge(att.percentage);
                  const barColor = getBarColor(att.percentage);
                  const barWidth = att.percentage !== null ? att.percentage : 0;

                  return (
                    <tr
                      key={enrollment.id}
                      onClick={() => handleEnrollmentClick(enrollment)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      {/* Student Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {enrollment.student.avatar ? (
                            <img
                              src={getImageUrl(enrollment.student.avatar)}
                              alt={enrollment.student.name}
                              className="h-8 w-8 rounded-full object-cover border border-slate-100 shrink-0"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-heading font-bold text-xs uppercase border border-primary-200 shrink-0">
                              {enrollment.student.name.split(' ').map((n) => n[0]).join('')}
                            </div>
                          )}
                          <span className="font-bold text-slate-800 whitespace-nowrap">
                            {enrollment.student.name}
                          </span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 text-slate-600 max-w-[180px] truncate">
                        {enrollment.student.email}
                      </td>

                      {/* Enrollment Date */}
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                        {new Date(enrollment.enrolledAt).toLocaleDateString()}
                      </td>

                      {/* Attendance */}
                      <td className="px-6 py-4 min-w-[180px]">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-3">
                            {/* Badge */}
                            <span
                              className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}
                            >
                              {badge.label}
                            </span>
                            {/* Sessions count */}
                            {att.total > 0 && (
                              <span className="text-[11px] text-slate-400 whitespace-nowrap">
                                {att.attended}/{att.total} sessions
                              </span>
                            )}
                          </div>
                          {/* Progress bar */}
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`${barColor} h-full rounded-full transition-all duration-500`}
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Completion bar */}
                      <td className="px-6 py-4 min-w-[140px]">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-800 shrink-0">
                            {enrollment.progress}%
                          </span>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-accent-500 h-full"
                              style={{ width: `${enrollment.progress}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Enrollment Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            enrollment.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : enrollment.status === 'ACTIVE'
                              ? 'bg-primary-50 text-primary-750 border border-primary-100'
                              : 'bg-red-50 text-red-750 border border-red-100'
                          }`}
                        >
                          {enrollment.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Student Performance Registry Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <Card hover={false} className="bg-white border border-slate-100 rounded-3xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden p-0">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded uppercase tracking-wider">
                  Academic Performance Charts
                </span>
                <h3 className="text-lg font-heading font-bold text-slate-900 mt-1">
                  {selectedStudent.student?.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedStudent.course?.title}
                </p>
              </div>
              <button
                onClick={() => { setSelectedStudent(null); setEvaluation(null); }}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
              >
                <IoCloseOutline size={22} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {loadingEval ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  <p className="text-xs text-slate-400 font-semibold">Compiling performance graphs...</p>
                </div>
              ) : evaluation ? (
                <>
                  {/* Summary score card */}
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[10px] text-slate-455 text-slate-400 font-bold uppercase">Final Mark</p>
                      <p className="text-xl font-heading font-black text-slate-800 mt-0.5">{evaluation.breakdown.finalMarks}/100</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-455 text-slate-400 font-bold uppercase">Status</p>
                      <span className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full mt-1 border uppercase ${
                        evaluation.eligible 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {evaluation.eligible ? 'Eligible' : 'Ineligible'}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-455 text-slate-400 font-bold uppercase">Roll Number</p>
                      <p className="text-xs font-mono font-bold text-slate-600 mt-1">{selectedStudent.rollNumber || '—'}</p>
                    </div>
                  </div>

                  {/* Attendance Graph */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700">⏱️ Attendance Chart</span>
                      <span className="text-slate-555 text-slate-500 font-semibold">{evaluation.breakdown.attendedMeetings} of {evaluation.breakdown.totalMeetings} Classes</span>
                    </div>
                    <div className="h-6 bg-slate-100 rounded-lg overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all flex items-center justify-end pr-2.5 text-[10px] font-black text-white"
                        style={{ width: `${evaluation.breakdown.attendancePercentage}%` }}
                      >
                        {evaluation.breakdown.attendancePercentage}%
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">Earned Score: <span className="font-bold text-slate-700">{evaluation.breakdown.attendanceMarks}/20 Marks</span></p>
                  </div>

                  {/* Quiz Progress Graph */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700">🧠 Final MCQ Assessment</span>
                      <span className="text-slate-555 text-slate-500 font-semibold">Best Attempt: {evaluation.breakdown.quizPercentage}%</span>
                    </div>
                    <div className="h-6 bg-slate-100 rounded-lg overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all flex items-center justify-end pr-2.5 text-[10px] font-black text-white"
                        style={{ width: `${evaluation.breakdown.quizPercentage}%` }}
                      >
                        {evaluation.breakdown.quizPercentage}%
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">Earned Score: <span className="font-bold text-slate-700">{evaluation.breakdown.mcqMarks}/60 Marks</span></p>
                  </div>

                  {/* Assignments Progress Graph */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700">📝 Graded Assignments</span>
                      <span className="text-slate-555 text-slate-500 font-semibold">{evaluation.breakdown.assignmentsSubmitted} of {evaluation.breakdown.assignmentsTotal} Submitted</span>
                    </div>
                    <div className="h-6 bg-slate-100 rounded-lg overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-accent-400 to-accent-500 transition-all flex items-center justify-end pr-2.5 text-[10px] font-black text-slate-800"
                        style={{ width: `${evaluation.breakdown.assignmentsTotal > 0 ? (evaluation.breakdown.assignmentsSubmitted / evaluation.breakdown.assignmentsTotal) * 100 : 0}%` }}
                      >
                        {Math.round(evaluation.breakdown.assignmentsTotal > 0 ? (evaluation.breakdown.assignmentsSubmitted / evaluation.breakdown.assignmentsTotal) * 100 : 0)}%
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">Earned Score: <span className="font-bold text-slate-700">{evaluation.breakdown.assignmentMarks}/20 Marks</span></p>
                  </div>

                  {/* Composite Score Breakdown Chart */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">🏆 Composite Mark Distribution</h4>
                    <div className="h-8 bg-slate-100 rounded-xl overflow-hidden flex text-[10px] font-bold text-white relative">
                      {evaluation.breakdown.attendanceMarks > 0 && (
                        <div 
                          className="bg-emerald-500 h-full flex items-center justify-center transition-all"
                          style={{ width: `${evaluation.breakdown.attendanceMarks}%` }}
                          title={`Attendance: ${evaluation.breakdown.attendanceMarks}`}
                        >
                          Att: {evaluation.breakdown.attendanceMarks}
                        </div>
                      )}
                      {evaluation.breakdown.assignmentMarks > 0 && (
                        <div 
                          className="bg-accent-500 h-full flex items-center justify-center text-slate-900 transition-all"
                          style={{ width: `${evaluation.breakdown.assignmentMarks}%` }}
                          title={`Assignments: ${evaluation.breakdown.assignmentMarks}`}
                        >
                          Asg: {evaluation.breakdown.assignmentMarks}
                        </div>
                      )}
                      {evaluation.breakdown.mcqMarks > 0 && (
                        <div 
                          className="bg-primary-500 h-full flex items-center justify-center transition-all"
                          style={{ width: `${evaluation.breakdown.mcqMarks}%` }}
                          title={`MCQ: ${evaluation.breakdown.mcqMarks}`}
                        >
                          MCQ: {evaluation.breakdown.mcqMarks}
                        </div>
                      )}
                      {!evaluation.breakdown.attendanceMarks && !evaluation.breakdown.assignmentMarks && !evaluation.breakdown.mcqMarks && (
                        <div className="w-full text-slate-400 flex items-center justify-center italic">No marks recorded yet</div>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                      <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span> Attendance (Max 20)</span>
                      <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent-500 inline-block"></span> Assignments (Max 20)</span>
                      <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary-500 inline-block"></span> MCQ Quiz (Max 60)</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-10 text-slate-400 text-xs">Failed to load academic records.</div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => { setSelectedStudent(null); setEvaluation(null); }}
              >
                Close Registry
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default InstructorStudents;

