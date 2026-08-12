import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { quizService, certificateService } from '../../services/portalService';
import toast from 'react-hot-toast';
import {
  IoTimeOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoChevronForwardOutline,
  IoAlertCircleOutline,
  IoRibbonOutline,
  IoRefreshOutline,
  IoBookOutline,
  IoLockClosedOutline
} from 'react-icons/io5';

export default function FinalQuiz() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [eligibility, setEligibility] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [quizInfo, setQuizInfo] = useState(null);

  // Active quiz taking states
  const [inQuiz, setInQuiz] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [totalTimeRemaining, setTotalTimeRemaining] = useState(0);
  const [timerRemaining, setTimerRemaining] = useState(60);

  // Results state
  const [results, setResults] = useState(null);
  const [claimingCert, setClaimingCert] = useState(false);

  const timerRef = useRef(null);


  // Check eligibility and load history
  const checkStatus = async () => {
    setLoading(true);
    try {
      const eligRes = await quizService.checkEligibility(courseId);
      setEligibility(eligRes.data?.data || null);

      if (eligRes.data?.data?.quiz) {
        setQuizInfo(eligRes.data.data.quiz);
      }

      // Fetch attempts — silently ignore 404 (quiz not set up yet for this course)
      try {
        const attemptsRes = await quizService.getAttempts(courseId);
        setAttempts(attemptsRes.data?.data?.attempts || []);
      } catch (attErr) {
        // 404 = no quiz configured yet — not an error worth showing
        if (attErr.response?.status !== 404) {
          console.warn('Attempts fetch error:', attErr.response?.data?.message);
        }
        setAttempts([]);
      }
    } catch (err) {
      // Only show toast for unexpected errors (not eligibility denied)
      if (err.response?.status !== 403 && err.response?.status !== 404) {
        toast.error(err.response?.data?.message || 'Failed to load quiz status.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [courseId]);

  // Timer logic for active question
  useEffect(() => {
    if (inQuiz && !results) {
      if (timerRemaining <= 0) {
        handleTimeExpired();
      } else {
        const t = setTimeout(() => {
          setTimerRemaining((prev) => prev - 1);
          setTotalTimeRemaining((prev) => Math.max(0, prev - 1));
        }, 1000);
        return () => clearTimeout(t);
      }
    }
  }, [timerRemaining, inQuiz, results]);

  const handleTimeExpired = () => {
    toast.error('Time expired for this question! Saving and moving forward...', { duration: 2500 });
    handleNextQuestion();
  };

  const handleStartQuiz = async () => {
    if (!window.confirm('Are you ready to begin? The timer will start immediately. You cannot go back or refresh.')) return;
    setLoading(true);
    try {
      const res = await quizService.startQuiz(courseId);
      const data = res.data?.data;

      setSessionId(data.sessionId);
      setAttemptId(data.attemptId);
      setAttemptNumber(data.attemptNumber);
      setCurrentQuestion(data.question);
      setCurrentIndex(data.currentIndex);
      setTotalQuestions(data.totalQuestions);
      setTotalTimeRemaining(data.totalTimeRemaining);
      setTimerRemaining(data.timePerQuestion || 60);

      setSelectedOption(null);
      setResults(null);
      setInQuiz(true);
      toast.success('Assessment started. Good luck!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start quiz attempt.');
      checkStatus();
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setLoading(true);

    try {
      const res = await quizService.submitAnswer(attemptId, {
        questionId: currentQuestion.id,
        selectedOptionId: selectedOption,
      });

      const data = res.data?.data;
      if (data.isLast) {
        // Last question answered, trigger final submit automatically
        await handleSubmitQuiz();
      } else {
        // Load next question
        setCurrentQuestion(data.nextQuestion);
        setCurrentIndex(data.currentIndex);
        setSelectedOption(null);
        setTimerRemaining(quizInfo?.timePerQuestion || 60);
      }
    } catch (err) {
      if (err.response?.status === 408) {
        toast.error('Quiz session expired.');
        setInQuiz(false);
        checkStatus();
      } else {
        toast.error('Failed to save answer.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuiz = async () => {
    setLoading(true);
    try {
      const res = await quizService.submitQuiz(attemptId, {
        finalAnswer: {
          questionId: currentQuestion.id,
          selectedOptionId: selectedOption,
        },
      });

      setResults(res.data?.data || null);
      setInQuiz(false);
      toast.success('Assessment evaluated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit quiz.');
      setInQuiz(false);
      checkStatus();
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (optId) => {
    setSelectedOption(optId);
  };

  const handleViewCertificate = async () => {
    setClaimingCert(true);
    try {
      await certificateService.getCertificate(courseId);
      toast.success('🎓 Certificate issued! Redirecting...');
      setTimeout(() => navigate('/student/certificates'), 800);
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not issue certificate.';
      toast.error(msg);
      navigate('/student/certificates');
    } finally {
      setClaimingCert(false);
    }
  };

  if (loading && !inQuiz) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // No quiz configured yet — show friendly message
  if (!eligibility && !loading) {
    return (
      <div className="max-w-3xl mx-auto py-6">
        <div className="flex items-center gap-2 mb-4">
          <Link to={`/student/course/${courseId}`} className="text-slate-500 hover:text-slate-800 transition-colors">
            <IoBookOutline size={20} />
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Course Final Quiz</span>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center space-y-4">
          <div className="h-16 w-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto">
            <IoAlertCircleOutline size={32} />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-800">No Quiz Available Yet</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              The instructor has not uploaded a quiz for this course yet. Please check back later.
            </p>
          </div>
          <Link
            to={`/student/course/${courseId}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl transition-all"
          >
            ← Back to Course
          </Link>
        </div>
      </div>
    );
  }

  // Active Quiz Taker UI
  if (inQuiz && currentQuestion) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <Card hover={false} className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xl space-y-6">
          {/* Header Progress */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Question {currentIndex + 1} of {totalQuestions}
              </span>
              <h3 className="text-sm font-bold text-slate-800 m-0 mt-0.5">Final Assessment MCQ</h3>
            </div>
            {/* Timer */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 text-xs font-bold">
                <IoTimeOutline size={16} />
                <span>Question: {timerRemaining}s</span>
              </div>
              <div className="text-xs font-semibold text-slate-400">
                Total remaining: {Math.floor(totalTimeRemaining / 60)}m {totalTimeRemaining % 60}s
              </div>
            </div>
          </div>

          {/* Progress & Timer Bars */}
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-slate-450 uppercase tracking-wider">
              <span>Overall Progress</span>
              <span>Question Timer</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Overall Progress Bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
                />
              </div>
              {/* Question Countdown Timer Bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    timerRemaining <= 15 ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'
                  }`}
                  style={{ width: `${(timerRemaining / (quizInfo?.timePerQuestion || 60)) * 100}%` }}
                />
              </div>
            </div>
          </div>


          {/* Question Text */}
          <div className="space-y-4">
            <h4 className="text-base font-extrabold text-slate-800 leading-snug">
              {currentQuestion.question}
            </h4>

            {/* Options List */}
            <div className="grid grid-cols-1 gap-3">
              {Array.isArray(currentQuestion.options) && currentQuestion.options.map((opt) => {
                const isSelected = selectedOption === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleOptionSelect(opt.id)}
                    className={`flex items-center gap-4 w-full p-4 rounded-xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary-600 bg-primary-50 text-primary-950 font-bold'
                        : 'border-slate-100 hover:border-slate-200 text-slate-700 bg-slate-50/50'
                    }`}
                  >
                    <span className={`uppercase font-bold h-6 w-6 shrink-0 flex items-center justify-center rounded-full border text-xs ${
                      isSelected ? 'bg-primary-600 text-white border-transparent' : 'bg-white text-slate-400 border-slate-200'
                    }`}>
                      {opt.id}
                    </span>
                    <span className="text-xs">{opt.text}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="flex justify-between items-center pt-6 border-t border-slate-100">
            <span className="text-xs text-slate-400 italic">No skipping allowed. Skipping triggers time decay.</span>
            <Button
              onClick={handleNextQuestion}
              disabled={loading || selectedOption === null}
              className="flex items-center gap-1 cursor-pointer"
            >
              <span>{currentIndex === totalQuestions - 1 ? 'Submit Assessment' : 'Next Question'}</span>
              <IoChevronForwardOutline size={16} />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Quiz Results UI
  if (results) {
    const isPassed = results.passed;
    const certElig = results.certificateStatus;

    return (
      <div className="max-w-3xl mx-auto py-6 space-y-6">
        <Card hover={false} className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xl text-center space-y-4">
          <div className="flex justify-center">
            {isPassed ? (
              <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-md">
                <IoCheckmarkCircleOutline size={36} />
              </div>
            ) : (
              <div className="h-16 w-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center shadow-md">
                <IoCloseCircleOutline size={36} />
              </div>
            )}
          </div>

          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Assessment Completed</span>
            <h2 className="text-xl font-extrabold text-slate-800 mt-1">
              You {isPassed ? 'Passed' : 'Failed'} the Quiz!
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Quiz attempt #{results.attemptNumber} is completed. Passing score threshold is {results.passMark}%.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 border border-slate-100 p-4 rounded-xl bg-slate-50 max-w-md mx-auto">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider m-0">Percentage</p>
              <p className={`text-lg font-extrabold m-0 mt-1 ${isPassed ? 'text-emerald-600' : 'text-rose-600'}`}>
                {results.score}%
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider m-0">Correct</p>
              <p className="text-lg font-extrabold text-slate-800 m-0 mt-1">
                {results.correctAnswers} / {results.totalQuestions}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider m-0">MCQ Marks</p>
              <p className="text-lg font-extrabold text-primary-600 m-0 mt-1">
                {results.mcqMarks} / 60
              </p>
            </div>
          </div>

          {/* Certificate status */}
          {certElig && (
            <div className={`p-5 rounded-2xl border text-left space-y-3 ${
              certElig.eligible
                ? 'bg-emerald-50/50 border-emerald-100'
                : 'bg-amber-50/50 border-amber-100'
            }`}>
              <div className="flex items-center gap-2">
                <IoRibbonOutline size={20} className={certElig.eligible ? 'text-emerald-600' : 'text-amber-600'} />
                <span className="font-bold text-xs text-slate-800">Certificate Status</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed m-0">
                {certElig.eligible
                  ? 'Congratulations! You have completed all criteria successfully. Your certificate has been unlocked.'
                  : `Certificate is currently locked. Reason: ${certElig.reason}`}
              </p>

              {/* Marks breakdown details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
                <div className="p-2 border border-slate-100 rounded-lg bg-white">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Attendance</span>
                  <span className="font-extrabold text-slate-700">{certElig.breakdown.attendanceMarks} / 20</span>
                  <span className="text-[9px] text-slate-400 block">({certElig.breakdown.attendancePercentage}%)</span>
                </div>
                <div className="p-2 border border-slate-100 rounded-lg bg-white">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Assignments</span>
                  <span className="font-extrabold text-slate-700">{certElig.breakdown.assignmentMarks} / 20</span>
                  <span className="text-[9px] text-slate-400 block">({certElig.breakdown.assignmentsSubmitted}/{certElig.breakdown.assignmentsTotal} subm)</span>
                </div>
                <div className="p-2 border border-slate-100 rounded-lg bg-white">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Quiz MCQ</span>
                  <span className="font-extrabold text-slate-700">{certElig.breakdown.mcqMarks} / 60</span>
                  <span className="text-[9px] text-slate-400 block">({certElig.breakdown.quizPercentage.toFixed(1)}%)</span>
                </div>
                <div className="p-2 border border-slate-100 rounded-lg bg-white">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Final Marks</span>
                  <span className="font-extrabold text-primary-600">{certElig.breakdown.finalMarks} / 100</span>
                  <span className="text-[9px] text-slate-400 block">({certElig.breakdown.finalMarks >= 60 ? 'Passing' : 'Failing'})</span>
                </div>
              </div>

              {certElig.eligible && (
                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleViewCertificate}
                    disabled={claimingCert}
                    className="inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    {claimingCert ? '⏳ Generating...' : '🎓 View Certificate'}
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-center gap-3 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setResults(null);
                checkStatus();
              }}
              className="cursor-pointer"
            >
              Back to Course Quiz Panel
            </Button>
            <Link
              to={`/student/course/${courseId}`}
              className="inline-block px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-semibold transition-colors cursor-pointer"
            >
              Go to Classroom
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // Pre-Quiz Eligibility Screening Page
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Link to={`/student/course/${courseId}`} className="text-slate-500 hover:text-slate-800 transition-colors">
          <IoBookOutline size={20} />
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Course Final Quiz</span>
      </div>

      <Card hover={false} className="bg-white border border-slate-100 p-6 rounded-2xl space-y-6">
        <div>
          <h3 className="text-base font-extrabold text-slate-800 m-0">Course Evaluation & Final Quiz</h3>
          <p className="text-xs text-slate-500 mt-1 m-0">
            Before generating your completion certificate, you must attempt the course-level final assessment quiz.
          </p>
        </div>

        {/* Eligibility box */}
        {eligibility && (
          <div className={`p-4 rounded-xl border flex gap-3 ${
            eligibility.eligible
              ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800'
              : 'bg-amber-50/50 border-amber-100 text-amber-800'
          }`}>
            <div className="shrink-0 mt-0.5">
              {eligibility.eligible ? (
                <IoCheckmarkCircleOutline size={20} className="text-emerald-600" />
              ) : (
                <IoLockClosedOutline size={20} className="text-amber-600" />
              )}
            </div>
            <div>
              <p className="text-xs font-bold m-0">
                {eligibility.eligible ? 'Quiz Access Unlocked' : 'Quiz Access Locked'}
              </p>
              <p className="text-xs text-slate-600 mt-0.5 m-0 leading-relaxed">
                {eligibility.eligible
                  ? `You are eligible to start the quiz. You have ${eligibility.remainingAttempts} attempt(s) remaining out of ${eligibility.maxAttempts}.`
                  : eligibility.reason}
              </p>
            </div>
          </div>
        )}

        {/* Quiz details */}
        {quizInfo && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 border border-slate-100 rounded-xl bg-slate-50 text-center">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Passing Grade</span>
              <p className="text-base font-extrabold text-slate-800 mt-1 m-0">{quizInfo.passMark}%</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time Limit</span>
              <p className="text-base font-extrabold text-slate-800 mt-1 m-0">{quizInfo.timePerQuestion}s / Q</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Max Attempts</span>
              <p className="text-base font-extrabold text-slate-800 mt-1 m-0">{quizInfo.maxAttempts}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Questions</span>
              <p className="text-base font-extrabold text-primary-600 mt-1 m-0">{quizInfo._count?.questions || 0}</p>
            </div>
          </div>
        )}

        {/* Start button */}
        {eligibility?.eligible && (
          <div className="flex justify-end pt-2 border-t border-slate-50">
            <Button onClick={handleStartQuiz} className="cursor-pointer">
              🚀 Start Final Assessment
            </Button>
          </div>
        )}
      </Card>

      {/* Attempt History Accordion */}
      <Card hover={false} className="bg-white border border-slate-100 p-6 rounded-2xl space-y-4">
        <h4 className="text-sm font-bold text-slate-800 m-0">Your Quiz Attempt Log</h4>

        {attempts.length === 0 ? (
          <p className="text-xs text-slate-400 m-0">No quiz attempts recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {attempts.map((att) => (
              <div key={att.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 hover:border-slate-200 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <span className="text-xs font-bold text-slate-700">Attempt #{att.attemptNumber}</span>
                  <span className="text-[10px] text-slate-400 ml-2">
                    {new Date(att.completedAt).toLocaleString()}
                  </span>
                  <p className="text-xs text-slate-500 m-0 mt-1">
                    Correct answers: {att.rawScore} | Duration: {att.timeTaken ? `${Math.floor(att.timeTaken / 60)}m ${att.timeTaken % 60}s` : 'N/A'}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <span className="text-[9px] font-bold text-slate-400 block">MCQ Marks</span>
                    <span className="text-xs font-extrabold text-primary-600">{att.mcqMarks.toFixed(1)} / 60</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-bold text-slate-400 block">Score</span>
                    <span className={`text-xs font-extrabold ${att.passed ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {att.score}%
                    </span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    att.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {att.passed ? 'Passed' : 'Failed'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
