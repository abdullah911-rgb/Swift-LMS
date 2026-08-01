import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import { quizService } from '../../services/portalService';
import toast from 'react-hot-toast';
import {
  IoClipboardOutline,
  IoStatsChartOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoTimeOutline,
  IoEyeOutline,
  IoListOutline
} from 'react-icons/io5';

export default function AdminQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedCourseTitle, setSelectedCourseTitle] = useState('');
  const [stats, setStats] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const res = await quizService.adminGetAll();
      setQuizzes(res.data?.data?.quizzes || []);
    } catch {
      toast.error('Failed to load quizzes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleSelectQuiz = async (courseId, title) => {
    setSelectedCourseId(courseId);
    setSelectedCourseTitle(title);
    setLoadingDetails(true);
    setStats(null);
    setAttempts([]);
    try {
      const res = await quizService.getStats(courseId);
      setStats(res.data?.data?.stats || null);
      setAttempts(res.data?.data?.attempts || []);
    } catch {
      toast.error('Failed to load quiz statistics.');
    } finally {
      setLoadingDetails(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 m-0">Quiz & MCQ Assessments</h1>
          <p className="text-xs text-slate-500 mt-1 m-0">
            Monitor and review student final evaluation attempts across all courses.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: List of Quizzes */}
        <div className="lg:col-span-5 space-y-4">
          <Card hover={false} className="bg-white border border-slate-100 p-5 rounded-2xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pb-3 border-b border-slate-50 m-0 mb-4 flex items-center gap-2">
              <IoListOutline size={16} /> Course Quiz Registry
            </h3>

            {quizzes.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No quizzes configured yet.</p>
            ) : (
              <div className="space-y-2">
                {quizzes.map((q) => {
                  const isSelected = selectedCourseId === q.courseId;
                  return (
                    <button
                      key={q.id}
                      onClick={() => handleSelectQuiz(q.courseId, q.course?.title)}
                      className={`w-full p-4 rounded-xl text-left border transition-all flex flex-col gap-2 cursor-pointer ${
                        isSelected
                          ? 'border-primary-600 bg-primary-50/30'
                          : 'border-slate-100 hover:border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-3 w-full">
                        <span className="text-xs font-bold text-slate-800 line-clamp-1 flex-1">
                          {q.course?.title}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          q.isPublished ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {q.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 w-full font-medium">
                        <span>Instructor: {q.course?.instructor?.name}</span>
                        <span>Questions: {q._count?.questions || 0}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Quiz Performance & Logs */}
        <div className="lg:col-span-7">
          {selectedCourseId ? (
            <div className="space-y-6">
              {loadingDetails ? (
                <div className="flex justify-center items-center py-16 bg-white border border-slate-100 rounded-2xl">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <>
                  {/* Aggregates Card */}
                  {stats && (
                    <Card hover={false} className="bg-white border border-slate-100 p-5 rounded-2xl space-y-4 shadow-sm">
                      <h3 className="text-xs font-bold text-slate-800 tracking-wide m-0">
                        Quiz Stats: {selectedCourseTitle}
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                        <div className="p-3 border border-slate-50 bg-slate-50/50 rounded-xl">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Attempts</span>
                          <span className="text-lg font-extrabold text-slate-800 block mt-1">{stats.totalAttempts}</span>
                        </div>
                        <div className="p-3 border border-slate-50 bg-slate-50/50 rounded-xl">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Students</span>
                          <span className="text-lg font-extrabold text-slate-800 block mt-1">{stats.uniqueStudents}</span>
                        </div>
                        <div className="p-3 border border-slate-50 bg-slate-50/50 rounded-xl">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Pass Rate</span>
                          <span className="text-lg font-extrabold text-emerald-600 block mt-1">{stats.passRate}%</span>
                        </div>
                        <div className="p-3 border border-slate-50 bg-slate-50/50 rounded-xl">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Avg Score</span>
                          <span className="text-lg font-extrabold text-primary-600 block mt-1">{stats.avgScore}%</span>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Individual Logs */}
                  <Card hover={false} className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pb-3 border-b border-slate-50 m-0 mb-4 flex items-center gap-2">
                      <IoEyeOutline size={16} /> Attempt History Records
                    </h3>

                    {attempts.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center">No student attempts recorded.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              <th className="pb-3">Student</th>
                              <th className="pb-3">Attempt</th>
                              <th className="pb-3">Marks</th>
                              <th className="pb-3">Quiz Score</th>
                              <th className="pb-3">Status</th>
                              <th className="pb-3">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {attempts.map((att) => (
                              <tr key={att.id} className="text-xs">
                                <td className="py-3">
                                  <p className="font-bold text-slate-800 m-0">{att.user?.name}</p>
                                  <span className="text-[9px] text-slate-400">{att.user?.email}</span>
                                </td>
                                <td className="py-3 font-semibold text-slate-500">#{att.attemptNumber}</td>
                                <td className="py-3 font-bold text-slate-700">{att.mcqMarks.toFixed(1)}/60</td>
                                <td className="py-3 font-bold text-primary-600">{att.score}%</td>
                                <td className="py-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                    att.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                  }`}>
                                    {att.passed ? 'Passed' : 'Failed'}
                                  </span>
                                </td>
                                <td className="py-3 text-slate-400">
                                  {new Date(att.completedAt).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-2xl shadow-xs text-center p-6">
              <IoClipboardOutline size={48} className="text-slate-300 mb-3 animate-bounce" />
              <h3 className="text-sm font-bold text-slate-600 m-0">No Course Selected</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                Choose a course from the registry on the left to display its final MCQ configuration, student scores, and aggregates.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
