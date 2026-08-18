import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { enrollmentService, assignmentService, certificateService } from '../../services/portalService';
import api from '../../services/api';
import { ROUTES } from '../../constants';
import { 
  IoChevronBackOutline, 
  IoPlayCircleOutline, 
  IoDocumentTextOutline, 
  IoFileTrayFullOutline, 
  IoVideocamOutline, 
  IoMegaphoneOutline,
  IoCheckmarkCircleSharp, 
  IoCheckmarkCircleOutline, 
  IoDownloadOutline,
  IoDesktopOutline,
  IoClipboardOutline,
  IoCloudUploadOutline,
  IoDocumentOutline,
  IoCheckmarkDoneOutline,
  IoTimeOutline,
  IoAlertCircleOutline,
  IoStatsChartOutline,
} from 'react-icons/io5';
import toast from 'react-hot-toast';

const StudentCourseView = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [activeTab, setActiveTab] = useState('CONTENT'); // 'CONTENT', 'MEETINGS', 'ANNOUNCEMENTS', 'ASSIGNMENTS', 'QUIZ', 'PERFORMANCE'
  const [completedLessonIds, setCompletedLessonIds] = useState(new Set());
  const [claimingCert, setClaimingCert] = useState(false);

  // Performance evaluation states
  const [evaluation, setEvaluation] = useState(null);
  const [loadingEval, setLoadingEval] = useState(false);

  // Assignments state
  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [submittingAssignId, setSubmittingAssignId] = useState(null);
  const [submitFile, setSubmitFile] = useState(null);
  const [submitFileName, setSubmitFileName] = useState('');
  const [submitNote, setSubmitNote] = useState('');

  const fetchCourseAccess = async (autoSelect = false) => {
    try {
      const res = await enrollmentService.getCourseAccess(courseId);
      if (res.data?.data?.enrollment) {
        const enrollData = res.data.data.enrollment;
        setEnrollment(enrollData);
        
        // Extract completed lessons
        const completedSet = new Set(
          enrollData.lessonProgress
            ?.filter((p) => p.isCompleted)
            ?.map((p) => p.lessonId) || []
        );
        setCompletedLessonIds(completedSet);

        // Auto select first lesson or first incomplete lesson
        if (autoSelect || !currentLesson) {
          let selected = null;
          // Find first incomplete lesson
          for (const m of enrollData.course.modules || []) {
            for (const l of m.lessons || []) {
              if (!completedSet.has(l.id)) {
                selected = l;
                break;
              }
            }
            if (selected) break;
          }
          // Fallback to first lesson
          if (!selected && enrollData.course.modules?.[0]?.lessons?.[0]) {
            selected = enrollData.course.modules[0].lessons[0];
          }
          setCurrentLesson(selected);
        }
      }
    } catch (err) {
      console.error('Error fetching course access:', err);
      toast.error('Failed to load course contents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseAccess(true);
  }, [courseId]);

  const fetchAssignments = async () => {
    setLoadingAssignments(true);
    try {
      const res = await assignmentService.getStudentAssignments(courseId);
      if (res.data?.data?.assignments) {
        setAssignments(res.data.data.assignments);
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
    } finally {
      setLoadingAssignments(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ASSIGNMENTS') {
      fetchAssignments();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'PERFORMANCE') {
      const fetchEval = async () => {
        setLoadingEval(true);
        try {
          const res = await api.get(`/quiz/course/${courseId}/evaluate`);
          if (res.data?.data?.evaluation) {
            setEvaluation(res.data.data.evaluation);
          }
        } catch (err) {
          console.error('Failed to load performance metrics:', err);
          toast.error('Failed to load evaluation data.');
        } finally {
          setLoadingEval(false);
        }
      };
      fetchEval();
    }
  }, [activeTab, courseId]);

  const handleLessonSelect = (lesson) => {
    setCurrentLesson(lesson);
    setActiveTab('CONTENT');
  };

  const handleMarkComplete = async () => {
    if (!currentLesson) return;
    try {
      const res = await enrollmentService.completeLesson(courseId, currentLesson.id);
      if (res.data?.success) {
        toast.success('Lesson marked complete!');
        // Update local set
        setCompletedLessonIds((prev) => {
          const next = new Set(prev);
          next.add(currentLesson.id);
          return next;
        });
        // Refresh enrollment data (to update progress percent and checkmarks)
        await fetchCourseAccess(false);
      }
    } catch (err) {
      console.error('Error completing lesson:', err);
      toast.error('Failed to update progress.');
    }
  };

  const handleClaimCertificate = async () => {
    setClaimingCert(true);
    try {
      await certificateService.getCertificate(courseId);
      toast.success('🎓 Certificate issued! Redirecting...');
      setTimeout(() => navigate('/student/certificates'), 800);
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not issue certificate.';
      toast.error(msg);
    } finally {
      setClaimingCert(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-slate-500 font-medium">Enrollment not found or unauthorized.</p>
        <Link to={ROUTES.STUDENT_MY_COURSES}>
          <Button variant="primary" size="sm">Back to My Courses</Button>
        </Link>
      </div>
    );
  }

  const { course } = enrollment;

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to={ROUTES.STUDENT_MY_COURSES} className="p-2 rounded-xl bg-white border border-slate-100 hover:bg-slate-50 text-slate-600 transition-all">
          <IoChevronBackOutline size={18} />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-primary-900">{course.title}</h1>
          <div className="flex items-center gap-4 mt-1 flex-wrap">
            <p className="text-xs text-slate-400 font-semibold">Instructor: {course.instructor?.name}</p>
            <span className="text-[10px] font-bold text-accent-700 bg-accent-50 px-2 py-0.5 rounded border border-accent-100 uppercase">
              {enrollment.progress}% Complete
            </span>
            {enrollment.progress >= 80 && course.certificate && (
              <button
                onClick={handleClaimCertificate}
                disabled={claimingCert}
                className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase hover:bg-emerald-100 transition-colors disabled:opacity-60 cursor-pointer"
              >
                {claimingCert ? '⏳ Generating...' : '🎓 Claim Certificate'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Viewer & Tabs (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main Viewer Card */}
          <Card hover={false} className="bg-white border border-slate-100 overflow-hidden p-0 rounded-2xl">
            {/* Viewer Navbar Tabs */}
            <div className="flex overflow-x-auto whitespace-nowrap border-b border-slate-100 bg-slate-50/50 scrollbar-none select-none">
              <button
                onClick={() => setActiveTab('CONTENT')}
                className={`py-3.5 px-5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all border-b-2 cursor-pointer shrink-0 ${
                  activeTab === 'CONTENT'
                    ? 'border-primary-600 text-primary-700 bg-white'
                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
              >
                <IoPlayCircleOutline size={18} />
                <span>Lesson Viewer</span>
              </button>
              <button
                onClick={() => setActiveTab('MEETINGS')}
                className={`py-3.5 px-5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all border-b-2 cursor-pointer shrink-0 ${
                  activeTab === 'MEETINGS'
                    ? 'border-primary-600 text-primary-700 bg-white'
                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
              >
                <IoVideocamOutline size={18} />
                <span>Live Zoom Classes ({course.zoomMeetings?.length || 0})</span>
              </button>
              <button
                onClick={() => setActiveTab('ANNOUNCEMENTS')}
                className={`py-3.5 px-5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all border-b-2 cursor-pointer shrink-0 ${
                  activeTab === 'ANNOUNCEMENTS'
                    ? 'border-primary-600 text-primary-700 bg-white'
                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
              >
                <IoMegaphoneOutline size={18} />
                <span>Announcements ({course.announcements?.length || 0})</span>
              </button>
              <button
                onClick={() => setActiveTab('ASSIGNMENTS')}
                className={`py-3.5 px-5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all border-b-2 cursor-pointer shrink-0 ${
                  activeTab === 'ASSIGNMENTS'
                    ? 'border-primary-600 text-primary-700 bg-white'
                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
              >
                <IoClipboardOutline size={18} />
                <span>Assignments</span>
              </button>
              <button
                onClick={() => setActiveTab('QUIZ')}
                className={`py-3.5 px-5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all border-b-2 cursor-pointer shrink-0 ${
                  activeTab === 'QUIZ'
                    ? 'border-primary-600 text-primary-700 bg-white'
                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
              >
                <IoClipboardOutline size={18} />
                <span>Final Quiz</span>
              </button>
              <button
                onClick={() => setActiveTab('PERFORMANCE')}
                className={`py-3.5 px-5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all border-b-2 cursor-pointer shrink-0 ${
                  activeTab === 'PERFORMANCE'
                    ? 'border-primary-600 text-primary-700 bg-white'
                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
              >
                <IoStatsChartOutline size={18} />
                <span>Grades & Graphs</span>
              </button>
            </div>


            {/* Tab Contents */}
            <div className="p-6">
              {activeTab === 'CONTENT' && (
                <div className="space-y-6">
                  {currentLesson ? (
                    <>
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className="text-[10px] font-bold text-accent-600 uppercase tracking-widest">{currentLesson.type} Lecture</span>
                          <h2 className="text-lg font-bold text-primary-900 mt-1">{currentLesson.title}</h2>
                          {currentLesson.description && (
                            <p className="text-sm text-slate-500 mt-2 leading-relaxed">{currentLesson.description}</p>
                          )}
                        </div>

                        {/* Completed Status Checkmark */}
                        <div>
                          {completedLessonIds.has(currentLesson.id) ? (
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                              <IoCheckmarkCircleSharp size={16} /> Completed
                            </span>
                          ) : (
                            <Button variant="primary" size="sm" onClick={handleMarkComplete}>
                              Mark Complete
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Video Player or Document Content */}
                      <div className="border border-slate-100 rounded-2xl bg-slate-50 overflow-hidden">
                        {currentLesson.type === 'VIDEO' && currentLesson.videoUrl && (
                          <div className="aspect-video w-full">
                            <iframe
                              src={currentLesson.videoUrl}
                              title={currentLesson.title}
                              className="w-full h-full border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            ></iframe>
                          </div>
                        )}

                        {currentLesson.type === 'PDF' && currentLesson.content && (
                          <div className="p-6 flex flex-col items-center text-center space-y-4">
                            <IoDocumentTextOutline size={48} className="text-accent-500" />
                            <div>
                              <h3 className="font-bold text-slate-800">Syllabus PDF / Manual</h3>
                              <p className="text-xs text-slate-500 mt-1">Open the manual file linked below to read content details.</p>
                            </div>
                            <a href={currentLesson.content} target="_blank" rel="noreferrer">
                              <Button variant="outline" size="sm" className="flex items-center gap-2">
                                <IoDesktopOutline /> View Document
                              </Button>
                            </a>
                          </div>
                        )}

                        {currentLesson.type === 'TEXT' && (
                          <div className="p-6 text-sm text-slate-700 leading-relaxed bg-white prose max-w-none">
                            {currentLesson.content || <p className="text-slate-400">No content text specified for this lesson.</p>}
                          </div>
                        )}
                      </div>

                      {/* Lesson Materials / Resources Download */}
                      {currentLesson.resources?.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Downloadable Class Materials</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {currentLesson.resources.map((res) => (
                              <div key={res.id} className="p-3 border border-slate-100 rounded-xl flex items-center justify-between gap-3 bg-white">
                                <div className="flex items-center gap-2.5">
                                  <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
                                    <IoFileTrayFullOutline size={16} />
                                  </div>
                                  <div className="text-left leading-tight">
                                    <p className="text-xs font-bold text-slate-700 line-clamp-1">{res.name}</p>
                                    <p className="text-[10px] text-slate-400 capitalize mt-0.5">{res.fileType}</p>
                                  </div>
                                </div>
                                <a href={res.fileUrl} download target="_blank" rel="noreferrer" className="text-slate-400 hover:text-primary-600 p-1.5 hover:bg-slate-50 rounded-lg">
                                  <IoDownloadOutline size={18} />
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      Select a syllabus lecture from the sidebar outline to begin.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'MEETINGS' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-bold text-primary-900">Virtual Classrooms & Zoom Portal</h2>
                    <p className="text-xs text-slate-500 mt-1">Access scheduled sessions and connect with Swift trainers live.</p>
                  </div>

                  {(!course.zoomMeetings || course.zoomMeetings.length === 0) ? (
                    <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-sm">
                      No active Zoom sessions scheduled for this course.
                    </div>
                  ) : (
                    <div className="space-y-3">
                  {course.zoomMeetings.map((meeting) => {
                        const mStatus = (() => {
                          const s = meeting.status;
                          if (s !== 'LIVE' && s !== 'SCHEDULED') return s;
                          const start = new Date(meeting.startTime);
                          const end = new Date(start.getTime() + (meeting.duration || 60) * 60 * 1000);
                          return new Date() > end ? 'ENDED' : s;
                        })();
                        return (
                        <div key={meeting.id} className="p-4 border border-slate-100 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white hover:border-primary-100">
                          <div className="space-y-1">
                            <span className={`inline-block text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full ${
                              mStatus === 'LIVE'
                                ? 'bg-red-100 text-red-700'
                                : mStatus === 'SCHEDULED'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {mStatus === 'LIVE' ? '🔴 LIVE' : mStatus}
                            </span>
                            <h4 className="text-sm font-bold text-slate-800">{meeting.topic}</h4>
                            <p className="text-[11px] text-slate-500">
                              Date: {new Date(meeting.startTime).toLocaleString()} ({meeting.duration} Mins duration)
                            </p>
                            {meeting.agenda && <p className="text-xs text-slate-400 mt-1">{meeting.agenda}</p>}
                          </div>
                          {mStatus === 'LIVE' ? (
                            <Link to={`/zoom-classroom/${meeting.meetingId}?courseId=${course.id}`}>
                              <Button variant="primary" size="sm" className="flex items-center gap-2">
                                <IoVideocamOutline size={16} /> Join Live Class
                              </Button>
                            </Link>
                          ) : (
                            <Button variant="secondary" size="sm" disabled className="flex items-center gap-2 opacity-50 cursor-not-allowed">
                              <IoVideocamOutline size={16} />
                              {mStatus === 'ENDED' ? 'Class Ended' : 'Not Live Yet'}
                            </Button>
                          )}
                        </div>
                        );
                      })}

                    </div>
                  )}
                </div>
              )}

              {activeTab === 'ANNOUNCEMENTS' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-bold text-primary-900">Course Board Announcements</h2>
                    <p className="text-xs text-slate-500 mt-1">Important notifications and notes published by your course trainer.</p>
                  </div>

                  {(!course.announcements || course.announcements.length === 0) ? (
                    <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-sm">
                      No announcements posted yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {course.announcements.map((ann) => (
                        <div key={ann.id} className="p-5 border border-slate-100 rounded-2xl bg-white space-y-2">
                          <div className="flex justify-between items-start gap-4">
                            <h4 className="text-sm font-bold text-slate-800">{ann.title}</h4>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              {new Date(ann.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{ann.body}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'ASSIGNMENTS' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-bold text-primary-900">Course Assignments</h2>
                    <p className="text-xs text-slate-500 mt-1">Download assignments from your instructor, complete them, and upload your work here.</p>
                  </div>

                  {loadingAssignments ? (
                    <div className="text-center py-10 text-slate-400 text-sm animate-pulse">Loading assignments...</div>
                  ) : assignments.length === 0 ? (
                    <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center space-y-2">
                      <IoClipboardOutline size={36} className="mx-auto text-slate-300" />
                      <p className="text-sm text-slate-400">No assignments posted yet.</p>
                      <p className="text-xs text-slate-300">Your instructor hasn't posted any assignments for this course.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {assignments.map((assignment) => {
                        const mySubmission = assignment.submissions?.[0];
                        const isSubmitting = submittingAssignId === assignment.id;
                        const isPastDue = assignment.dueDate && new Date(assignment.dueDate) < new Date();

                        return (
                          <div
                            key={assignment.id}
                            className={`p-5 border rounded-2xl space-y-4 transition-colors ${
                              mySubmission
                                ? mySubmission.status === 'GRADED'
                                  ? 'border-emerald-200 bg-emerald-50/30'
                                  : 'border-blue-100 bg-blue-50/20'
                                : 'border-amber-100 bg-amber-50/20'
                            }`}
                          >
                            {/* Header row */}
                            <div className="flex justify-between items-start gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="text-sm font-bold text-slate-800">{assignment.title}</h3>
                                  {mySubmission ? (
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                      mySubmission.status === 'GRADED' ? 'bg-emerald-100 text-emerald-700' :
                                      mySubmission.status === 'REVIEWED' ? 'bg-blue-100 text-blue-700' :
                                      'bg-green-100 text-green-700'
                                    }`}>
                                      ✓ {mySubmission.status}
                                    </span>
                                  ) : (
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                      isPastDue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                    }`}>
                                      {isPastDue ? '⚠ Overdue' : '⏳ Pending'}
                                    </span>
                                  )}
                                </div>
                                {assignment.description && (
                                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{assignment.description}</p>
                                )}
                                <div className="flex items-center gap-3 mt-2 flex-wrap">
                                  {assignment.dueDate && (
                                    <span className={`text-[10px] flex items-center gap-1 font-semibold ${
                                      isPastDue && !mySubmission ? 'text-red-500' : 'text-slate-400'
                                    }`}>
                                      <IoTimeOutline size={11} />
                                      Due: {new Date(assignment.dueDate).toLocaleString()}
                                    </span>
                                  )}
                                  <span className="text-[10px] text-slate-400">
                                    Posted: {new Date(assignment.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>

                              {/* Download assignment file */}
                              {assignment.fileUrl && (
                                <a
                                  href={`${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000'}${assignment.fileUrl}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl transition-all shrink-0"
                                >
                                  <IoDownloadOutline size={14} /> Download
                                </a>
                              )}
                            </div>

                            {/* My Submission display */}
                            {mySubmission && (
                              <div className="space-y-3 pt-2 border-t border-slate-200/60">
                                <div className="flex items-center gap-2 p-3 bg-white border border-slate-100 rounded-xl">
                                  <IoDocumentOutline size={16} className="text-primary-600 shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-slate-700 truncate">
                                      {mySubmission.fileName || 'Your submission'}
                                    </p>
                                    <p className="text-[10px] text-slate-400">
                                      Submitted: {new Date(mySubmission.submittedAt).toLocaleString()}
                                    </p>
                                  </div>
                                  <a
                                    href={`${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000'}${mySubmission.fileUrl}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] font-bold text-primary-600 hover:underline flex items-center gap-0.5"
                                  >
                                    <IoDownloadOutline size={12} /> View
                                  </a>
                                </div>

                                {/* Instructor feedback / grade */}
                                {(mySubmission.feedback || mySubmission.grade) && (
                                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl space-y-1">
                                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Instructor Feedback</p>
                                    {mySubmission.grade && (
                                      <p className="text-sm font-bold text-emerald-800">Grade: {mySubmission.grade}</p>
                                    )}
                                    {mySubmission.feedback && (
                                      <p className="text-xs text-emerald-800 leading-relaxed">{mySubmission.feedback}</p>
                                    )}
                                  </div>
                                )}

                                {/* Re-submit option */}
                                {mySubmission.status === 'SUBMITTED' && (
                                  <p className="text-[10px] text-slate-400 italic">Awaiting instructor review. You can re-submit below if needed.</p>
                                )}
                              </div>
                            )}

                            {/* Upload / Re-submit form */}
                            {isSubmitting ? (
                              <div className="space-y-3 pt-2 border-t border-slate-200/60">
                                <p className="text-xs font-bold text-slate-600">
                                  {mySubmission ? 'Re-submit Your Work' : 'Submit Your Work'}
                                </p>

                                <div>
                                  <input
                                    type="file"
                                    id={`submit-file-${assignment.id}`}
                                    className="hidden"
                                    onChange={(e) => {
                                      const f = e.target.files[0];
                                      if (f) { setSubmitFile(f); setSubmitFileName(f.name); }
                                    }}
                                  />
                                  <label
                                    htmlFor={`submit-file-${assignment.id}`}
                                    className="block w-full px-4 py-3 rounded-xl border-2 border-dashed border-primary-200 hover:border-primary-400 bg-primary-50/50 text-xs font-semibold text-primary-700 cursor-pointer text-center transition-colors"
                                  >
                                    {submitFileName ? (
                                      <span className="flex items-center justify-center gap-2">
                                        <IoDocumentOutline size={16} /> {submitFileName}
                                      </span>
                                    ) : (
                                      <span className="flex items-center justify-center gap-2">
                                        <IoCloudUploadOutline size={18} /> Click to select your file
                                      </span>
                                    )}
                                  </label>
                                </div>

                                <textarea
                                  value={submitNote}
                                  onChange={(e) => setSubmitNote(e.target.value)}
                                  rows={2}
                                  placeholder="Optional note to your instructor..."
                                  className="w-full px-4 py-2.5 rounded-xl border border-slate-100 focus:outline-none focus:border-primary-600 text-xs resize-none"
                                />

                                <div className="flex gap-2">
                                  <button
                                    disabled={!submitFile}
                                    onClick={async () => {
                                      if (!submitFile) return toast.error('Please select a file to submit.');
                                      try {
                                        const fd = new FormData();
                                        fd.append('file', submitFile);
                                        if (submitNote) fd.append('note', submitNote);
                                        await assignmentService.submitAssignment(assignment.id, fd);
                                        toast.success('Assignment submitted successfully!');
                                        setSubmittingAssignId(null);
                                        setSubmitFile(null);
                                        setSubmitFileName('');
                                        setSubmitNote('');
                                        fetchAssignments();
                                      } catch (err) {
                                        toast.error(err.response?.data?.message || 'Failed to submit assignment.');
                                      }
                                    }}
                                    className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                                  >
                                    <IoCheckmarkDoneOutline size={14} className="inline mr-1" />
                                    {mySubmission ? 'Re-Submit Assignment' : 'Submit Assignment'}
                                  </button>
                                  <button
                                    onClick={() => { setSubmittingAssignId(null); setSubmitFile(null); setSubmitFileName(''); setSubmitNote(''); }}
                                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setSubmittingAssignId(assignment.id);
                                  setSubmitFile(null);
                                  setSubmitFileName('');
                                  setSubmitNote('');
                                }}
                                className={`w-full py-2.5 border text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                  mySubmission
                                    ? 'border-slate-200 hover:border-primary-300 text-slate-500 hover:text-primary-700 hover:bg-primary-50'
                                    : 'border-primary-300 bg-primary-50 hover:bg-primary-100 text-primary-700'
                                }`}
                              >
                                <IoCloudUploadOutline size={15} />
                                {mySubmission ? 'Re-Submit Work' : 'Submit My Work'}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'QUIZ' && (
                <div className="space-y-6 text-center py-8">
                  <div className="h-16 w-16 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <IoClipboardOutline size={30} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base font-extrabold text-slate-800">Final Assessment Quiz</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Complete this course by taking the final quiz. To pass the course and lock in your completion certificate, you must satisfy attendance, assignments and quiz criteria.
                    </p>
                  </div>
                  <div className="pt-2">
                    <Link
                      to={`/student/course/${courseId}/quiz`}
                      className="inline-flex items-center gap-2 px-5 py-3 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl shadow-md shadow-primary-600/10 transition-all cursor-pointer"
                    >
                      <span>Go to Final Quiz Screen</span>
                      <IoChevronForwardOutline size={14} />
                    </Link>
                  </div>
                </div>
              )}

              {activeTab === 'PERFORMANCE' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-heading font-bold text-primary-900">Your Grades & Performance Graphs</h3>
                    <p className="text-xs text-slate-500 mt-1">Real-time compilation of your attendance records, quizzes, and assignment scores.</p>
                  </div>

                  {loadingEval ? (
                    <div className="flex flex-col items-center justify-center py-16 space-y-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                      <p className="text-xs text-slate-400 font-semibold font-sans">Compiling your performance graphs...</p>
                    </div>
                  ) : evaluation ? (
                    <>
                      {/* Summary score card */}
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Final Score</p>
                          <p className="text-xl font-heading font-black text-slate-800 mt-0.5">{evaluation.breakdown.finalMarks}/100</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Status</p>
                          <span className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full mt-1 border uppercase ${
                            evaluation.eligible 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {evaluation.eligible ? 'Eligible for Certificate' : 'Ineligible'}
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">MCQ Passed</p>
                          <span className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full mt-1.5 border uppercase ${
                            evaluation.breakdown.quizPassed 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-slate-50 text-slate-500 border-slate-200'
                          }`}>
                            {evaluation.breakdown.quizPassed ? 'Passed' : 'No / Failed'}
                          </span>
                        </div>
                      </div>

                      {/* Attendance Graph */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-700">⏱️ Attendance Chart</span>
                          <span className="text-slate-500 font-semibold">{evaluation.breakdown.attendedMeetings} of {evaluation.breakdown.totalMeetings} Classes</span>
                        </div>
                        <div className="h-6 bg-slate-100 rounded-lg overflow-hidden relative">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all flex items-center justify-end pr-2.5 text-[10px] font-black text-white"
                            style={{ width: `${evaluation.breakdown.attendancePercentage}%` }}
                          >
                            {evaluation.breakdown.attendancePercentage}%
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">Earned Score: <span className="font-bold text-slate-700">{evaluation.breakdown.attendanceMarks}/20 Marks</span> (Requires min 80% attendance)</p>
                      </div>

                      {/* Quiz Progress Graph */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-700">🧠 Final MCQ Assessment</span>
                          <span className="text-slate-500 font-semibold">Best Attempt: {evaluation.breakdown.quizPercentage}%</span>
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
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span> Attendance (Max 20)</span>
                          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent-500 inline-block"></span> Assignments (Max 20)</span>
                          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary-500 inline-block"></span> MCQ Quiz (Max 60)</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-10 text-slate-400 text-xs">No academic records found yet.</div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Side: Syllabus Outline / Lessons Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <Card hover={false} className="bg-white border border-slate-100 p-6 rounded-2xl space-y-4">
            <h3 className="text-base font-heading font-bold text-primary-900 pb-2 border-b border-slate-50">
              Syllabus Outline
            </h3>
            
            {(!course.modules || course.modules.length === 0) ? (
              <p className="text-xs text-slate-400">No content modules published for this course.</p>
            ) : (
              <div className="space-y-4 overflow-y-auto max-h-[500px] pr-1">
                {course.modules.map((module) => (
                  <div key={module.id} className="space-y-2">
                    <h4 className="text-xs font-bold text-primary-800 uppercase tracking-wide bg-primary-50/70 p-2 rounded-lg">
                      Module {module.order}: {module.title}
                    </h4>
                    
                    <div className="space-y-1 pl-1">
                      {module.lessons?.map((lesson) => {
                        const isCurrent = currentLesson?.id === lesson.id;
                        const isCompleted = completedLessonIds.has(lesson.id);

                        return (
                          <button
                            key={lesson.id}
                            onClick={() => handleLessonSelect(lesson)}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all text-xs cursor-pointer ${
                              isCurrent
                                ? 'bg-primary-600 text-white font-semibold'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="shrink-0">
                                {lesson.type === 'VIDEO' ? (
                                  <IoPlayCircleOutline size={16} className={isCurrent ? 'text-white' : 'text-primary-600'} />
                                ) : (
                                  <IoDocumentTextOutline size={16} className={isCurrent ? 'text-white' : 'text-accent-500'} />
                                )}
                              </span>
                              <span className="truncate">{lesson.title}</span>
                            </div>
                            
                            <span className="shrink-0 ml-2">
                              {isCompleted ? (
                                <IoCheckmarkCircleSharp size={16} className={isCurrent ? 'text-white' : 'text-emerald-500'} />
                              ) : (
                                <IoCheckmarkCircleOutline size={16} className="text-slate-300" />
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
};

export default StudentCourseView;
