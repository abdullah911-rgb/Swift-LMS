import { getImageUrl } from '../../constants/index';
import React, { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { adminService } from '../../services/portalService';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  IoSchoolOutline,
  IoPersonOutline,
  IoRefreshOutline,
  IoCalendarOutline,
  IoCardOutline,
  IoCashOutline,
  IoCloseOutline,
  IoRibbonOutline,
  IoCheckmarkCircle,
  IoCloseCircle,
} from 'react-icons/io5';

const AdminEnrollments = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Interactive Modal states
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [loadingEval, setLoadingEval] = useState(false);

  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const res = await adminService.getRecentEnrollments();
      if (res.data?.data?.enrollments) setEnrollments(res.data.data.enrollments);
    } catch (err) {
      toast.error('Failed to load enrollments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEnrollments(); }, []);

  const handleToggleCertEligibility = (e, enrId, currentEligible) => {
    e.stopPropagation(); // Prevent row click opening modal
    const newVal = !currentEligible;
    setEnrollments((prev) =>
      prev.map((en) => en.id === enrId ? { ...en, certificateEligible: newVal } : en)
    );
    if (selectedStudent?.id === enrId) {
      setSelectedStudent((prev) => prev ? { ...prev, certificateEligible: newVal } : prev);
    }
    toast.success(newVal ? 'Certificate eligibility marked as Eligible.' : 'Certificate eligibility marked as Ineligible.');
  };

  const handleEnrollmentClick = async (enr) => {
    setSelectedStudent(enr);
    setLoadingEval(true);
    setEvaluation(null);
    try {
      const res = await api.get(`/quiz/course/${enr.courseId}/evaluate`, {
        params: { userId: enr.studentId }
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

  const paymentBadge = (status) => {
    if (!status) return <span className="text-[10px] text-slate-400">—</span>;
    const map = {
      APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      PENDING:  'bg-amber-50  text-amber-700  border-amber-200',
      REJECTED: 'bg-red-50    text-red-700    border-red-200',
    };
    return (
      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${map[status] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-primary-900">Enrollment Reports</h1>
          <p className="text-sm text-slate-500 mt-1">
            {enrollments.length} recent enrollments shown. Track student activity across all courses.
          </p>
        </div>
        <button
          onClick={fetchEnrollments}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-all cursor-pointer"
        >
          <IoRefreshOutline size={14} /> Refresh
        </button>
      </div>

      <Card hover={false} className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-14 bg-slate-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : enrollments.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <IoSchoolOutline size={40} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No enrollments yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/80">
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Course</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Instructor</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Roll #</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Paid (PKR)</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Progress</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Enrolled</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {enrollments.map((enr) => (
                  <tr
                    key={enr.id}
                    onClick={() => handleEnrollmentClick(enr)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >

                    {/* Student */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {enr.student?.avatar ? (
                            <img
                              src={getImageUrl(enr.student.avatar)}
                              alt={enr.student.name}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            enr.student?.name?.split(' ').map((n) => n[0]).join('') || 'S'
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-xs">{enr.student?.name}</p>
                          <p className="text-[10px] text-slate-400">{enr.student?.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Course */}
                    <td className="px-5 py-4">
                      <p className="text-xs font-semibold text-slate-800 line-clamp-1 max-w-[180px]">
                        {enr.course?.title}
                      </p>
                    </td>

                    {/* Instructor */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <IoPersonOutline size={12} />
                        <span>{enr.course?.instructor?.name || '—'}</span>
                      </div>
                    </td>

                    {/* Roll # */}
                    <td className="px-5 py-4">
                      {enr.rollNumber ? (
                        <div className="flex items-center gap-1.5">
                          <IoCardOutline size={12} className="text-primary-500 shrink-0" />
                          <span className="text-[11px] font-mono font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-lg">
                            {enr.rollNumber}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Not assigned</span>
                      )}
                    </td>

                    {/* Paid (PKR) */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        {enr.paymentAmount != null ? (
                          <div className="flex items-center gap-1.5">
                            <IoCashOutline size={12} className="text-emerald-500 shrink-0" />
                            <span className="text-xs font-bold text-emerald-700">
                              PKR {enr.paymentAmount.toLocaleString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No payment</span>
                        )}
                        {paymentBadge(enr.paymentStatus)}
                      </div>
                    </td>

                    {/* Progress */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-500 rounded-full transition-all"
                            style={{ width: `${enr.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-semibold text-slate-600">
                          {enr.progress || 0}%
                        </span>
                      </div>
                    </td>

                    {/* Enrolled Date */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <IoCalendarOutline size={12} />
                        {new Date(enr.enrolledAt).toLocaleDateString()}
                      </div>
                    </td>

                    {/* Certificate Eligibility Toggle */}
                    <td className="px-5 py-4">
                      <button
                        onClick={(e) => handleToggleCertEligibility(e, enr.id, enr.certificateEligible !== false)}
                        title={enr.certificateEligible !== false ? 'Click to revoke eligibility' : 'Click to restore eligibility'}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                          enr.certificateEligible !== false
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {enr.certificateEligible !== false
                          ? <><IoCheckmarkCircle size={12} /> Eligible</>
                          : <><IoCloseCircle size={12} /> Ineligible</>}
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

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
                      <span className="text-slate-550 text-slate-500 font-semibold">{evaluation.breakdown.attendedMeetings} of {evaluation.breakdown.totalMeetings} Classes</span>
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
                      <span className="text-slate-550 text-slate-500 font-semibold">Best Attempt: {evaluation.breakdown.quizPercentage}%</span>
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
                      <span className="text-slate-550 text-slate-500 font-semibold">{evaluation.breakdown.assignmentsSubmitted} of {evaluation.breakdown.assignmentsTotal} Submitted</span>
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
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              {/* Cert eligibility toggle in modal */}
              <button
                onClick={(e) => handleToggleCertEligibility(e, selectedStudent.id, selectedStudent.certificateEligible !== false)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  selectedStudent.certificateEligible !== false
                    ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <IoRibbonOutline size={13} />
                {selectedStudent.certificateEligible !== false ? 'Revoke Certificate Eligibility' : 'Restore Certificate Eligibility'}
              </button>
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

export default AdminEnrollments;
