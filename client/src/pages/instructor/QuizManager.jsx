import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { quizService } from '../../services/portalService';
import toast from 'react-hot-toast';
import {
  IoSettingsOutline,
  IoCloudUploadOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoTrashOutline,
  IoListOutline,
  IoStatsChartOutline,
  IoEyeOutline,
  IoAddOutline,
  IoCloseOutline
} from 'react-icons/io5';

export default function QuizManager({ courseId }) {
  const [activeSubTab, setActiveSubTab] = useState('SETTINGS'); // 'SETTINGS', 'QUESTIONS', 'IMPORT', 'STATS'
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState(null);

  // Quiz Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [passMark, setPassMark] = useState(60);
  const [timePerQuestion, setTimePerQuestion] = useState(60);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [savingSettings, setSavingSettings] = useState(false);

  // Questions List
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Import fields
  const [importText, setImportText] = useState('');
  const [importErrors, setImportErrors] = useState([]);
  const [previewQuestions, setPreviewQuestions] = useState([]);
  const [previewing, setPreviewing] = useState(false);
  const [importing, setImporting] = useState(false);

  // Stats fields
  const [stats, setStats] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);

  const fetchQuizData = async () => {
    setLoading(true);
    try {
      const res = await quizService.getQuiz(courseId);
      if (res.data?.data?.quiz) {
        const q = res.data.data.quiz;
        setQuiz(q);
        setTitle(q.title || '');
        setDescription(q.description || '');
        setPassMark(q.passMark || 60);
        setTimePerQuestion(q.timePerQuestion || 60);
        setMaxAttempts(q.maxAttempts || 3);
      }
    } catch (err) {
      // 404 is expected if quiz doesn't exist yet
      if (err.response?.status !== 404) {
        toast.error('Failed to load quiz settings.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizData();
  }, [courseId]);

  useEffect(() => {
    if (quiz) {
      if (activeSubTab === 'QUESTIONS') {
        fetchQuestions();
      } else if (activeSubTab === 'STATS') {
        fetchStats();
      }
    }
  }, [activeSubTab, quiz]);

  const fetchQuestions = async () => {
    if (!quiz) return;
    setLoadingQuestions(true);
    try {
      const res = await quizService.getQuestions(quiz.id);
      setQuestions(res.data?.data?.questions || []);
    } catch {
      toast.error('Failed to load quiz questions.');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await quizService.getStats(courseId);
      setStats(res.data?.data?.stats || null);
      setAttempts(res.data?.data?.attempts || []);
    } catch {
      toast.error('Failed to load quiz statistics.');
    } finally {
      setLoadingStats(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const data = {
        title,
        description,
        passMark: parseInt(passMark),
        timePerQuestion: parseInt(timePerQuestion),
        maxAttempts: parseInt(maxAttempts),
      };
      const res = await quizService.upsertQuiz(courseId, data);
      setQuiz(res.data?.data?.quiz);
      toast.success('Quiz settings saved successfully.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!quiz) return;
    try {
      const res = await quizService.togglePublish(quiz.id);
      setQuiz(res.data?.data?.quiz);
      toast.success(res.data?.message || 'Status updated.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const handlePreviewImport = async () => {
    if (!importText.trim()) {
      toast.error('Please paste some questions first.');
      return;
    }
    setPreviewing(true);
    setImportErrors([]);
    setPreviewQuestions([]);
    try {
      const res = await quizService.previewImport(quiz.id, importText);
      setPreviewQuestions(res.data?.data?.questions || []);
      setImportErrors(res.data?.data?.errors || []);
      if (res.data?.data?.errors?.length === 0) {
        toast.success('Validation passed. Ready to import.');
      } else {
        toast.warn('Errors found in parsing.');
      }
    } catch (err) {
      toast.error('Failed to preview import.');
    } finally {
      setPreviewing(false);
    }
  };

  const handleSaveImport = async () => {
    if (!quiz) return;
    setImporting(true);
    try {
      await quizService.importQuestions(quiz.id, importText, true);
      toast.success('Questions imported and saved successfully!');
      setImportText('');
      setPreviewQuestions([]);
      setImportErrors([]);
      setActiveSubTab('QUESTIONS');
    } catch (err) {
      const errMsgs = err.response?.data?.errors;
      if (Array.isArray(errMsgs) && errMsgs.length > 0) {
        setImportErrors(errMsgs);
        toast.error('Failed to save questions due to errors.');
      } else {
        toast.error(err.response?.data?.message || 'Import failed.');
      }
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await quizService.deleteQuestion(qId);
      toast.success('Question deleted.');
      fetchQuestions();
    } catch {
      toast.error('Failed to delete question.');
    }
  };

  const handleDeleteQuiz = async () => {
    if (!window.confirm('WARNING: Are you sure you want to delete this quiz? This will delete all attempts and questions.')) return;
    try {
      await quizService.deleteQuiz(quiz.id);
      toast.success('Quiz deleted.');
      setQuiz(null);
      setTitle('');
      setDescription('');
      setActiveSubTab('SETTINGS');
    } catch {
      toast.error('Failed to delete quiz.');
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <div>
          <h4 className="text-sm font-bold text-slate-800 m-0">Final Quiz & MCQ Assessment</h4>
          <p className="text-xs text-slate-500 m-0 mt-0.5">
            Configure the final evaluation quiz for this course. Score weights are structured out of 60.
          </p>
        </div>
        {quiz && (
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              quiz.isPublished ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
            }`}>
              {quiz.isPublished ? 'Published' : 'Draft / Unpublished'}
            </span>
            <Button
              variant={quiz.isPublished ? 'secondary' : 'primary'}
              size="xs"
              onClick={handleTogglePublish}
              className="cursor-pointer"
            >
              {quiz.isPublished ? 'Unpublish' : 'Publish Quiz'}
            </Button>
            <button
              onClick={handleDeleteQuiz}
              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Delete Quiz"
            >
              <IoTrashOutline size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Sub Tabs */}
      {quiz && (
        <div className="flex border-b border-slate-100 pb-px gap-2">
          {[
            { id: 'SETTINGS', label: 'Settings', icon: <IoSettingsOutline /> },
            { id: 'QUESTIONS', label: `Questions (${quiz._count?.questions || 0})`, icon: <IoListOutline /> },
            { id: 'IMPORT', label: 'Bulk Question Import', icon: <IoCloudUploadOutline /> },
            { id: 'STATS', label: 'Performance & Statistics', icon: <IoStatsChartOutline /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-t-xl border-t border-x -mb-px transition-all cursor-pointer ${
                activeSubTab === tab.id
                  ? 'border-slate-100 bg-white text-primary-700 font-extrabold shadow-sm'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Tab content */}
      {activeSubTab === 'SETTINGS' && (
        <Card className="bg-white p-6 border border-slate-100 rounded-2xl">
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <IoSettingsOutline className="text-primary-700" /> Quiz Settings
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quiz Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Course Final Assessment"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-100 text-sm focus:outline-none focus:border-primary-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Passing Score (%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={passMark}
                  onChange={(e) => setPassMark(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-100 text-sm focus:outline-none focus:border-primary-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Time Limit per Question (seconds)</label>
                <input
                  type="number"
                  min="10"
                  max="300"
                  required
                  value={timePerQuestion}
                  onChange={(e) => setTimePerQuestion(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-100 text-sm focus:outline-none focus:border-primary-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Maximum Attempts allowed</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  required
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-100 text-sm focus:outline-none focus:border-primary-600"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description (optional)</label>
                <textarea
                  placeholder="Instructions for students before they start the quiz."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-100 text-sm focus:outline-none focus:border-primary-600"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-50">
              <Button type="submit" disabled={savingSettings} size="sm" className="cursor-pointer">
                {savingSettings ? 'Saving...' : quiz ? 'Update Quiz Settings' : 'Create Quiz & Setup'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {activeSubTab === 'QUESTIONS' && (
        <Card className="bg-white p-6 border border-slate-100 rounded-2xl">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-bold text-slate-800 m-0">Question Bank</h4>
            <Button size="xs" onClick={() => setActiveSubTab('IMPORT')} className="flex items-center gap-1 cursor-pointer">
              <IoAddOutline size={16} /> Import Questions
            </Button>
          </div>

          {loadingQuestions ? (
            <div className="text-center py-6 text-slate-400">Loading questions...</div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <div className="text-2xl mb-1">📝</div>
              <h5 className="text-slate-700 font-bold mb-1">No questions added yet</h5>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Paste your question sheet in our bulk importer to parse and populate the assessment automatically.
              </p>
              <Button size="sm" onClick={() => setActiveSubTab('IMPORT')} className="cursor-pointer">
                Go to Importer
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={q.id} className="p-4 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors bg-white relative group">
                  <div className="flex justify-between items-start gap-4 pr-10">
                    <div>
                      <span className="text-xs font-bold text-primary-600">Question {idx + 1}</span>
                      <p className="text-sm font-bold text-slate-800 mt-1 mb-2">{q.question}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Question"
                    >
                      <IoTrashOutline size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {Array.isArray(q.options) && q.options.map((opt) => {
                      const isCorrect = Array.isArray(q.correctAnswer)
                        ? q.correctAnswer.includes(opt.id)
                        : q.correctAnswer === opt.id;
                      return (
                        <div
                          key={opt.id}
                          className={`flex items-center gap-2 p-2 px-3 rounded-lg text-xs border ${
                            isCorrect
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-100 font-semibold'
                              : 'bg-slate-50 text-slate-600 border-slate-100'
                          }`}
                        >
                          <span className={`uppercase font-bold shrink-0 flex items-center justify-center h-5 w-5 rounded-full border ${
                            isCorrect ? 'bg-emerald-600 text-white border-transparent' : 'bg-white text-slate-400 border-slate-200'
                          }`}>
                            {opt.id}
                          </span>
                          <span>{opt.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeSubTab === 'IMPORT' && (
        <Card className="bg-white p-6 border border-slate-100 rounded-2xl">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-2">
            <IoCloudUploadOutline className="text-primary-700" /> Bulk Question Import
          </h4>
          <p className="text-xs text-slate-500 mb-4">
            Copy and paste your MCQ sheet below. Use numbered question blocks, options beginning with letters and brackets, and a correct key line.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Paste Questions Sheet</label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  rows="12"
                  placeholder={`1. What is HTML?
a) Programming Language
b) Markup Language
c) Database
d) Operating System
Correct: b

2. Which option is a styling framework?
a) React
b) TailwindCSS
Correct: a,b`}
                  className="w-full p-3 border border-slate-100 rounded-xl text-xs font-mono focus:outline-none focus:border-primary-600 bg-slate-50"
                />
              </div>

              <div className="flex gap-2">
                <Button variant="secondary" onClick={handlePreviewImport} disabled={previewing} size="sm" className="cursor-pointer">
                  {previewing ? 'Parsing...' : 'Parse & Preview'}
                </Button>
                {previewQuestions.length > 0 && importErrors.length === 0 && (
                  <Button onClick={handleSaveImport} disabled={importing} size="sm" className="cursor-pointer">
                    {importing ? 'Saving Questions...' : `Import ${previewQuestions.length} Question(s)`}
                  </Button>
                )}
              </div>
            </div>

            <div className="lg:col-span-5 border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-4 h-[440px] overflow-y-auto">
              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider m-0">Live Parser Review</h5>

              {importErrors.length > 0 && (
                <div className="space-y-2">
                  <Alert variant="danger" title="Validation Errors Found">
                    <ul className="list-disc pl-4 text-xs space-y-1 mt-1">
                      {importErrors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </Alert>
                </div>
              )}

              {previewQuestions.length > 0 && (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg p-2 flex items-center gap-1.5">
                    <IoCheckmarkCircleOutline size={16} /> Successfully parsed {previewQuestions.length} questions.
                  </div>

                  <div className="space-y-3">
                    {previewQuestions.map((pq) => (
                      <div key={pq.questionNum} className="p-3 bg-white border border-slate-100 rounded-xl text-xs space-y-1.5">
                        <p className="font-bold text-slate-800 m-0">
                          {pq.questionNum}. {pq.question}
                        </p>
                        <div className="space-y-1">
                          {pq.options.map((opt) => {
                            const isCorrect = pq.correctAnswer.includes(opt.id);
                            return (
                              <div key={opt.id} className={`flex items-center gap-1.5 px-2 py-0.5 rounded ${
                                isCorrect ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'text-slate-500'
                              }`}>
                                <span className="uppercase font-bold shrink-0">{opt.id})</span>
                                <span>{opt.text}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {previewQuestions.length === 0 && importErrors.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Paste questions and click parse to display the syntax audit here.
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {activeSubTab === 'STATS' && (
        <div className="space-y-6">
          {loadingStats ? (
            <div className="text-center py-6 text-slate-400">Loading stats...</div>
          ) : !stats ? (
            <div className="text-center py-6 text-slate-400">No attempts recorded yet.</div>
          ) : (
            <>
              {/* Aggregates */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-white p-4 border border-slate-100 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Attempt Count</span>
                  <span className="text-2xl font-extrabold text-slate-800 mt-2">{stats.totalAttempts}</span>
                </Card>
                <Card className="bg-white p-4 border border-slate-100 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unique Student Count</span>
                  <span className="text-2xl font-extrabold text-slate-800 mt-2">{stats.uniqueStudents}</span>
                </Card>
                <Card className="bg-white p-4 border border-slate-100 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pass Rate Percentage</span>
                  <span className="text-2xl font-extrabold text-emerald-600 mt-2">{stats.passRate}%</span>
                </Card>
                <Card className="bg-white p-4 border border-slate-100 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Attempt Score</span>
                  <span className="text-2xl font-extrabold text-primary-600 mt-2">{stats.avgScore}%</span>
                </Card>
              </div>

              {/* Student attempts table */}
              <Card className="bg-white p-6 border border-slate-100 rounded-2xl">
                <h4 className="text-sm font-bold text-slate-800 mb-4">Individual Assessment Logs</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Student</th>
                        <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Attempt No</th>
                        <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Marks (out of 60)</th>
                        <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Quiz Score</th>
                        <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                        <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Time Taken</th>
                        <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Date Submitted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {attempts.map((att) => (
                        <tr key={att.id} className="text-xs">
                          <td className="py-3">
                            <p className="font-bold text-slate-800 m-0">{att.user?.name}</p>
                            <span className="text-[10px] text-slate-400">{att.user?.email}</span>
                          </td>
                          <td className="py-3 font-semibold text-slate-600">Attempt #{att.attemptNumber}</td>
                          <td className="py-3 font-bold text-slate-700">{att.mcqMarks.toFixed(1)} / 60</td>
                          <td className="py-3 font-bold text-primary-600">{att.score}%</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-full font-bold ${
                              att.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {att.passed ? 'Passed' : 'Failed'}
                            </span>
                          </td>
                          <td className="py-3 text-slate-500">
                            {att.timeTaken ? `${Math.floor(att.timeTaken / 60)}m ${att.timeTaken % 60}s` : 'N/A'}
                          </td>
                          <td className="py-3 text-slate-400">
                            {new Date(att.completedAt).toLocaleDateString('en-PK', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
}
