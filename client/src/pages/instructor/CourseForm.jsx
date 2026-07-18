import { getImageUrl } from '../../constants/index';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { instructorService, moduleService, lessonService, zoomService, resourceService } from '../../services/portalService';
import api from '../../services/api';
import { ROUTES } from '../../constants';
import { 
  IoChevronBackOutline, 
  IoBookOutline, 
  IoLayersOutline, 
  IoAddOutline, 
  IoTrashOutline,
  IoSettingsOutline, 
  IoDocumentTextOutline,
  IoPlayCircleOutline,
  IoCreateOutline,
  IoVideocamOutline,
  IoCloudUploadOutline,
  IoDocumentOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline
} from 'react-icons/io5';
import toast from 'react-hot-toast';

const CourseForm = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!courseId;

  // General course state
  const [categories, setCategories] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [level, setLevel] = useState('BEGINNER');
  const [price, setPrice] = useState('0');
  const [isFree, setIsFree] = useState(true);
  const [language, setLanguage] = useState('English');
  const [certificate, setCertificate] = useState(true);
  const [durationInMonths, setDurationInMonths] = useState(2);
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [savingCourse, setSavingCourse] = useState(false);

  // Edit-only tab state
  const [activeTab, setActiveTab] = useState('DETAILS'); // 'DETAILS', 'SYLLABUS', 'ZOOM'
  const [modules, setModules] = useState([]);

  // Zoom Meetings state
  const [meetings, setMeetings] = useState([]);
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [zoomTopic, setZoomTopic] = useState('');
  const [zoomAgenda, setZoomAgenda] = useState('');
  const [zoomDuration, setZoomDuration] = useState('60');
  const [zoomStartTime, setZoomStartTime] = useState('');
  const [startingClass, setStartingClass] = useState(false);

  // Course approval state
  const [courseApprovalStatus, setCourseApprovalStatus] = useState({ pendingApproval: false, status: 'DRAFT' });
  const [submittingApproval, setSubmittingApproval] = useState(false);

  // File resources state
  const [resources, setResources] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const fetchMeetings = async (cId) => {
    setLoadingMeetings(true);
    try {
      const res = await zoomService.getByCourse(cId);
      if (res.data?.data?.meetings) {
        setMeetings(res.data.data.meetings);
      }
    } catch (err) {
      console.error('Error fetching meetings:', err);
    } finally {
      setLoadingMeetings(false);
    }
  };

  useEffect(() => {
    if (isEditMode && activeTab === 'ZOOM') {
      fetchMeetings(courseId);
    }
  }, [activeTab, courseId, isEditMode]);

  // Syllabus management state (modals / forms)
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDesc, setModuleDesc] = useState('');
  const [editingModuleId, setEditingModuleId] = useState(null);

  const [showLessonForm, setShowLessonForm] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDesc, setLessonDesc] = useState('');
  const [lessonType, setLessonType] = useState('VIDEO'); // 'VIDEO', 'PDF', 'TEXT'
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonDuration, setLessonDuration] = useState('0');
  const [lessonIsFree, setLessonIsFree] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState(null);

  // Load categories and edit data
  useEffect(() => {
    const initData = async () => {
      try {
        const catRes = await instructorService.getCategories();
        if (catRes.data?.data?.categories) {
          setCategories(catRes.data.data.categories);
        }

        if (isEditMode) {
          // Fetch course details
          const courseRes = await api.get(`/courses/stats`); // we can load stats or getOne course
          // Wait, getOne is /api/courses/:slug, let's load from public course detail endpoint but using getOne course id / slug?
          // Let's load the course details directly using standard API path if we have it or a direct GET /api/courses/stats/detail?
          // Let's query by getOne course slug or let's inspect the courseController.getOne
          // In courseController, getOne is GET /api/courses/:slug. Wait! How do we edit if we only have the ID?
          // Let's check courseController routes:
          // router.get('/:slug', optionalAuth, courseController.getOne);
          // Wait, can we fetch the course detail using getOne or do we need to search it? Let's check all GET courses endpoints.
          // Let's fetch all courses from instructor courses list and find the matches
          const myCoursesRes = await instructorService.getMyCourses();
          const match = myCoursesRes.data?.data?.courses?.find(c => c.id === courseId);
          if (match) {
            setTitle(match.title || '');
            setDescription(match.description || '');
            setShortDescription(match.shortDescription || '');
            setCategoryId(match.categoryId || '');
            setLevel(match.level || 'BEGINNER');
            setPrice(match.price?.toString() || '0');
            setIsFree(match.isFree);
            setLanguage(match.language || 'English');
            setCertificate(match.certificate);
            setDurationInMonths(match.durationInMonths || 2);
            setCourseApprovalStatus({ pendingApproval: match.pendingApproval, status: match.status });
            if (match.thumbnail) {
              setThumbnailPreview(match.thumbnail.startsWith('/') ? `http://localhost:5000${match.thumbnail}` : match.thumbnail);
            }
            
            // Now load modules
            fetchModules(courseId);
          } else {
            toast.error('Course not found or unauthorized.');
            navigate(ROUTES.INSTRUCTOR_COURSES);
          }
        }
      } catch (err) {
        console.error('Error initializing form:', err);
        toast.error('Failed to load initial data.');
      }
    };
    initData();
  }, [courseId, isEditMode]);

  const fetchModules = async (cId) => {
    try {
      const res = await moduleService.getByCourse(cId);
      if (res.data?.data?.modules) {
        setModules(res.data.data.modules);
      }
    } catch (err) {
      console.error('Error fetching modules:', err);
    }
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnail(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    setSavingCourse(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('shortDescription', shortDescription);
      formData.append('categoryId', categoryId);
      formData.append('level', level);
      formData.append('price', price);
      formData.append('isFree', isFree.toString());
      formData.append('language', language);
      formData.append('certificate', certificate.toString());
      formData.append('durationInMonths', durationInMonths.toString());
      if (thumbnail) {
        formData.append('thumbnail', thumbnail);
      }

      if (isEditMode) {
        const res = await instructorService.updateCourse(courseId, formData);
        if (res.data?.success) {
          toast.success('Changes submitted for admin approval!');
          setCourseApprovalStatus((p) => ({ ...p, pendingApproval: true }));
        }
      } else {
        const res = await instructorService.createCourse(formData);
        if (res.data?.success) {
          toast.success('Course created! Now build the syllabus and submit for approval.');
          navigate(`/instructor/courses/${res.data.data.course.id}/edit`);
        }
      }
    } catch (err) {
      console.error('Error saving course:', err);
      toast.error(err.response?.data?.message || 'Failed to save course details.');
    } finally {
      setSavingCourse(false);
    }
  };

  const handleSubmitForApproval = async () => {
    setSubmittingApproval(true);
    try {
      await instructorService.submitForApproval(courseId);
      toast.success('Course submitted to admin for review!');
      setCourseApprovalStatus({ pendingApproval: true, status: 'DRAFT' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit for approval.');
    } finally {
      setSubmittingApproval(false);
    }
  };

  const fetchResources = async (cId) => {
    try {
      const res = await resourceService.getByCourse(cId);
      if (res.data?.data?.resources) setResources(res.data.data.resources);
    } catch (_) {
      // ignore
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploadingFiles(true);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('files', f));
      const res = await resourceService.upload(courseId, formData);
      if (res.data?.success) {
        toast.success(`${files.length} file(s) uploaded!`);
        fetchResources(courseId);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'File upload failed.');
    } finally {
      setUploadingFiles(false);
      e.target.value = '';
    }
  };

  const handleDeleteResource = async (id) => {
    try {
      await resourceService.delete(id);
      toast.success('File removed.');
      setResources((r) => r.filter((x) => x.id !== id));
    } catch (err) {
      toast.error('Failed to delete file.');
    }
  };

  // Module actions
  const handleSaveModule = async (e) => {
    e.preventDefault();
    try {
      if (editingModuleId) {
        await moduleService.update(editingModuleId, { title: moduleTitle, description: moduleDesc });
        toast.success('Module updated.');
      } else {
        await moduleService.create(courseId, { title: moduleTitle, description: moduleDesc });
        toast.success('Module added.');
      }
      setModuleTitle('');
      setModuleDesc('');
      setEditingModuleId(null);
      setShowModuleForm(false);
      fetchModules(courseId);
    } catch (err) {
      console.error('Error saving module:', err);
      toast.error('Failed to save module.');
    }
  };

  const handleEditModule = (mod) => {
    setEditingModuleId(mod.id);
    setModuleTitle(mod.title);
    setModuleDesc(mod.description || '');
    setShowModuleForm(true);
  };

  const handleDeleteModule = async (modId) => {
    if (!window.confirm('Delete this module and all its lectures?')) return;
    try {
      await moduleService.delete(modId);
      toast.success('Module deleted.');
      fetchModules(courseId);
    } catch (err) {
      console.error('Error deleting module:', err);
      toast.error('Failed to delete module.');
    }
  };

  // Lesson actions
  const handleSaveLesson = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: lessonTitle,
        description: lessonDesc,
        type: lessonType,
        videoUrl: lessonVideoUrl,
        content: lessonContent,
        duration: lessonDuration,
        isFree: lessonIsFree
      };

      if (editingLessonId) {
        await lessonService.update(editingLessonId, payload);
        toast.success('Lecture updated.');
      } else {
        await lessonService.create(selectedModuleId, payload);
        toast.success('Lecture created.');
      }
      
      // Reset lesson states
      setLessonTitle('');
      setLessonDesc('');
      setLessonType('VIDEO');
      setLessonVideoUrl('');
      setLessonContent('');
      setLessonDuration('0');
      setLessonIsFree(false);
      setEditingLessonId(null);
      setShowLessonForm(false);
      fetchModules(courseId);
    } catch (err) {
      console.error('Error saving lesson:', err);
      toast.error('Failed to save lecture.');
    }
  };

  const handleAddLessonSetup = (modId) => {
    setSelectedModuleId(modId);
    setEditingLessonId(null);
    setLessonTitle('');
    setLessonDesc('');
    setLessonType('VIDEO');
    setLessonVideoUrl('');
    setLessonContent('');
    setLessonDuration('0');
    setLessonIsFree(false);
    setShowLessonForm(true);
  };

  const handleEditLesson = (lesson) => {
    setEditingLessonId(lesson.id);
    setLessonTitle(lesson.title);
    setLessonDesc(lesson.description || '');
    setLessonType(lesson.type);
    setLessonVideoUrl(lesson.videoUrl || '');
    setLessonContent(lesson.content || '');
    setLessonDuration(lesson.duration?.toString() || '0');
    setLessonIsFree(lesson.isFree);
    setShowLessonForm(true);
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm('Delete this lecture?')) return;
    try {
      await lessonService.delete(lessonId);
      toast.success('Lecture deleted.');
      fetchModules(courseId);
    } catch (err) {
      console.error('Error deleting lesson:', err);
      toast.error('Failed to delete lecture.');
    }
  };

  const handleStartLiveClass = async (e) => {
    e.preventDefault();
    setStartingClass(true);
    try {
      const payload = {
        topic: zoomTopic || `${title} - Live Class`,
        agenda: zoomAgenda,
        duration: zoomDuration
      };
      if (zoomStartTime) {
        payload.startTime = new Date(zoomStartTime).toISOString();
      }

      const res = await zoomService.create(courseId, payload);
      if (res.data?.success) {
        const newMeeting = res.data.data.meeting;
        setZoomTopic('');
        setZoomAgenda('');
        setZoomDuration('60');
        setZoomStartTime('');

        if (newMeeting.status === 'PENDING_APPROVAL') {
          toast.success(res.data.message || 'Class request submitted. Awaiting admin approval.');
          fetchMeetings(courseId);
        } else if (newMeeting.status === 'LIVE') {
          toast.success('Live class started! Entering classroom…');
          navigate(`/zoom-classroom/${newMeeting.meetingId}?courseId=${courseId}`);
        } else {
          toast.success('Live class scheduled successfully!');
          fetchMeetings(courseId);
        }
      }
    } catch (err) {
      console.error('Error starting live class:', err);
      toast.error('Failed to start live class.');
    } finally {
      setStartingClass(false);
    }
  };

  const handleEndLiveClass = async (meetingId) => {
    if (!window.confirm('Are you sure you want to end this live class?')) return;
    try {
      const res = await zoomService.endClass(meetingId);
      if (res.data?.success) {
        toast.success('Class session ended successfully.');
        fetchMeetings(courseId);
      }
    } catch (err) {
      console.error('Error ending class session:', err);
      toast.error('Failed to end class session.');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to={ROUTES.INSTRUCTOR_COURSES} className="p-2 rounded-xl bg-white border border-slate-100 hover:bg-slate-50 text-slate-600 transition-all">
          <IoChevronBackOutline size={18} />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-primary-900">
            {isEditMode ? 'Edit Course Curriculums' : 'Create Course'}
          </h1>
          <p className="text-sm text-slate-500">
            {isEditMode ? 'Design layout, add video lectures, and write guides.' : 'Configure general details to launch.'}
          </p>
        </div>
      </div>

      {/* Approval Status Banner */}
      {isEditMode && (
        <div className={`rounded-xl px-4 py-3 flex items-center justify-between gap-4 text-sm ${
          courseApprovalStatus.status === 'PUBLISHED'
            ? 'bg-green-50 border border-green-100 text-green-700'
            : courseApprovalStatus.pendingApproval
            ? 'bg-amber-50 border border-amber-100 text-amber-700'
            : 'bg-slate-50 border border-slate-100 text-slate-600'
        }`}>
          <div className="flex items-center gap-2">
            {courseApprovalStatus.status === 'PUBLISHED' ? (
              <IoCheckmarkCircleOutline size={18} />
            ) : courseApprovalStatus.pendingApproval ? (
              <IoTimeOutline size={18} />
            ) : (
              <IoDocumentOutline size={18} />
            )}
            <span className="font-semibold text-xs">
              {courseApprovalStatus.status === 'PUBLISHED'
                ? 'This course is live and visible to students.'
                : courseApprovalStatus.pendingApproval
                ? 'Pending admin approval — changes will go live once approved.'
                : 'This course is a draft. Submit for admin review to publish.'}
            </span>
          </div>
          {!courseApprovalStatus.pendingApproval && courseApprovalStatus.status !== 'PUBLISHED' && (
            <button
              onClick={handleSubmitForApproval}
              disabled={submittingApproval}
              className="shrink-0 px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50 cursor-pointer"
            >
              {submittingApproval ? 'Submitting...' : 'Submit for Approval'}
            </button>
          )}
        </div>
      )}

      {isEditMode && (
        <div className="flex border-b border-slate-100 pb-px gap-1">
          <button
            onClick={() => setActiveTab('DETAILS')}
            className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'DETAILS'
                ? 'border-primary-600 text-primary-700 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <IoSettingsOutline className="inline mr-1" /> General Details
          </button>
          <button
            onClick={() => setActiveTab('SYLLABUS')}
            className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'SYLLABUS'
                ? 'border-primary-600 text-primary-700 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <IoLayersOutline className="inline mr-1" /> Syllabus Builder ({modules.length})
          </button>
          <button
            onClick={() => { setActiveTab('ZOOM'); }}
            className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'ZOOM'
                ? 'border-primary-600 text-primary-700 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <IoVideocamOutline className="inline mr-1" /> Live Classes
          </button>
          <button
            onClick={() => { setActiveTab('RESOURCES'); fetchResources(courseId); }}
            className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'RESOURCES'
                ? 'border-primary-600 text-primary-700 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <IoCloudUploadOutline className="inline mr-1" /> Files ({resources.length})
          </button>
        </div>
      )}

      {/* Tab 1: DETAILS */}
      {activeTab === 'DETAILS' && (
        <form onSubmit={handleCourseSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <Card hover={false} className="lg:col-span-2 bg-white border border-slate-100 p-6 rounded-2xl space-y-6">
            <h3 className="text-base font-bold text-slate-800 pb-2 border-b border-slate-50 flex items-center gap-2">
              <IoBookOutline size={18} className="text-primary-700" /> Course Information
            </h3>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Course Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Safety Management Certificate"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-100 focus:outline-none focus:border-primary-600 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Short Description</label>
                <input
                  type="text"
                  required
                  placeholder="Brief 1-sentence summary"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-100 focus:outline-none focus:border-primary-600 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Description</label>
                <textarea
                  required
                  rows={6}
                  placeholder="Comprehensive description of topics, objectives, modules, and goals..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-100 focus:outline-none focus:border-primary-600 text-sm resize-none"
                ></textarea>
              </div>
            </div>
          </Card>

          {/* Right Side Info Panels */}
          <div className="space-y-6">
            {/* Classification & Level */}
            <Card hover={false} className="bg-white border border-slate-100 p-6 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-primary-700">Classification</h3>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Category</label>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-100 bg-white focus:outline-none focus:border-primary-600 text-sm"
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Level</label>
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-100 bg-white focus:outline-none focus:border-primary-600 text-sm"
                    >
                      <option value="BEGINNER">Beginner</option>
                      <option value="INTERMEDIATE">Intermediate</option>
                      <option value="ADVANCED">Advanced</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Language</label>
                    <input
                      type="text"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-100 focus:outline-none focus:border-primary-600 text-sm"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Pricing Card */}
            <Card hover={false} className="bg-white border border-slate-100 p-6 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-accent-700">Pricing & Status</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Free Course</span>
                  <input
                    type="checkbox"
                    checked={isFree}
                    onChange={(e) => {
                      setIsFree(e.target.checked);
                      if (e.target.checked) setPrice('0');
                    }}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
                  />
                </div>

                {!isFree && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Price ($USD)</label>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-100 focus:outline-none focus:border-primary-600 text-sm"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Offer Certificate</span>
                  <input
                    type="checkbox"
                    checked={certificate}
                    onChange={(e) => setCertificate(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-50">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Course Duration</label>
                  <select
                    value={durationInMonths}
                    onChange={(e) => setDurationInMonths(parseInt(e.target.value, 10))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-100 focus:outline-none focus:border-primary-600 text-sm bg-white cursor-pointer"
                  >
                    <option value={2}>2 Months Course</option>
                    <option value={4}>4 Months Course</option>
                    <option value={6}>6 Months Course</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Thumbnail Upload */}
            <Card hover={false} className="bg-white border border-slate-100 p-6 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Course Poster</h3>
              
              <div className="space-y-3">
                {thumbnailPreview && (
                  <img src={thumbnailPreview} alt="Preview" className="w-full aspect-video object-cover rounded-xl border border-slate-100" />
                )}
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="hidden"
                  id="thumbnail-upload"
                />
                <label
                  htmlFor="thumbnail-upload"
                  className="block text-center w-full py-2 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
                >
                  {thumbnailPreview ? 'Change Image' : 'Upload Cover Image'}
                </label>
              </div>
            </Card>

            <Button type="submit" variant="primary" size="md" className="w-full" disabled={savingCourse}>
              {savingCourse ? 'Saving Course...' : isEditMode ? 'Update Course Details' : 'Create Course & Proceed'}
            </Button>
          </div>
        </form>
      )}

      {/* Tab 2: SYLLABUS */}
      {isEditMode && activeTab === 'SYLLABUS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Syllabus Workspace (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <Card hover={false} className="bg-white border border-slate-100 p-6 rounded-2xl space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                <h3 className="text-base font-bold text-primary-900 flex items-center gap-2">
                  <IoLayersOutline size={18} className="text-primary-700" /> Syllabus Modules
                </h3>
                <Button variant="primary" size="sm" onClick={() => { setEditingModuleId(null); setModuleTitle(''); setModuleDesc(''); setShowModuleForm(true); }}>
                  <IoAddOutline size={16} className="inline mr-1" /> Add Module
                </Button>
              </div>

              {modules.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Create syllabus modules to break down your course chapters.
                </div>
              ) : (
                <div className="space-y-4">
                  {modules.map((mod) => (
                    <div key={mod.id} className="p-5 border border-slate-100 rounded-2xl space-y-4 bg-slate-50/50">
                      {/* Module Title bar */}
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="text-sm font-bold text-primary-950 uppercase tracking-wide">
                            Module {mod.order}: {mod.title}
                          </h4>
                          {mod.description && <p className="text-xs text-slate-400 mt-1">{mod.description}</p>}
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleEditModule(mod)} className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-slate-100 rounded-lg">
                            <IoCreateOutline size={16} />
                          </button>
                          <button onClick={() => handleDeleteModule(mod.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer">
                            <IoTrashOutline size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Lectures in Module */}
                      <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-100/50">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lectures & Guides</span>
                          <button onClick={() => handleAddLessonSetup(mod.id)} className="text-[10px] font-bold text-accent-600 hover:text-accent-700 flex items-center gap-0.5">
                            <IoAddOutline size={14} /> Add Lecture
                          </button>
                        </div>

                        {(!mod.lessons || mod.lessons.length === 0) ? (
                          <p className="text-xs text-slate-400 py-3 text-center italic">No lectures in this module.</p>
                        ) : (
                          <div className="space-y-1.5">
                            {mod.lessons.map((lesson) => (
                              <div key={lesson.id} className="p-2.5 rounded-xl border border-slate-50 flex items-center justify-between gap-3 text-xs bg-slate-50/20 hover:border-slate-100">
                                <div className="flex items-center gap-2">
                                  {lesson.type === 'VIDEO' ? (
                                    <IoPlayCircleOutline className="text-primary-600 shrink-0" size={16} />
                                  ) : (
                                    <IoDocumentTextOutline className="text-accent-500 shrink-0" size={16} />
                                  )}
                                  <span className="font-bold text-slate-700">{lesson.title}</span>
                                  <span className="text-[10px] text-slate-400">({lesson.type.toLowerCase()})</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button onClick={() => handleEditLesson(lesson)} className="text-slate-400 hover:text-primary-600 p-1 hover:bg-white rounded-lg">
                                    <IoCreateOutline size={14} />
                                  </button>
                                  <button onClick={() => handleDeleteLesson(lesson.id)} className="text-slate-400 hover:text-red-600 p-1 hover:bg-red-50 rounded-lg cursor-pointer">
                                    <IoTrashOutline size={14} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar Area: Forms Modal-like panel (1 col) */}
          <div className="space-y-6">
            {/* Add/Edit Module Form */}
            {showModuleForm && (
              <Card hover={false} className="bg-white border border-primary-100 p-6 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-primary-900 border-b border-slate-50 pb-2">
                  {editingModuleId ? 'Edit Module' : 'Create Module'}
                </h3>
                <form onSubmit={handleSaveModule} className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Module Title</label>
                    <input
                      type="text"
                      required
                      value={moduleTitle}
                      onChange={(e) => setModuleTitle(e.target.value)}
                      placeholder="e.g. Chapter 1: Safety Operations"
                      className="w-full px-4 py-2 rounded-xl border border-slate-100 focus:outline-none focus:border-primary-600 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Module Description</label>
                    <textarea
                      value={moduleDesc}
                      onChange={(e) => setModuleDesc(e.target.value)}
                      rows={3}
                      placeholder="Summary of module chapters..."
                      className="w-full px-4 py-2 rounded-xl border border-slate-100 focus:outline-none focus:border-primary-600 text-xs resize-none"
                    ></textarea>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="text" size="sm" onClick={() => setShowModuleForm(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" size="sm">
                      Save Module
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Add/Edit Lesson Form */}
            {showLessonForm && (
              <Card hover={false} className="bg-white border border-primary-100 p-6 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-primary-900 border-b border-slate-50 pb-2">
                  {editingLessonId ? 'Edit Lecture' : 'Create Lecture'}
                </h3>
                <form onSubmit={handleSaveLesson} className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lecture Title</label>
                    <input
                      type="text"
                      required
                      value={lessonTitle}
                      onChange={(e) => setLessonTitle(e.target.value)}
                      placeholder="e.g. 1.1 Intro to Hazards"
                      className="w-full px-4 py-2 rounded-xl border border-slate-100 focus:outline-none focus:border-primary-600 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lecture Type</label>
                    <select
                      value={lessonType}
                      onChange={(e) => setLessonType(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-slate-100 bg-white focus:outline-none focus:border-primary-600 text-xs"
                    >
                      <option value="VIDEO">Video Embed</option>
                      <option value="PDF">PDF Manual Link</option>
                      <option value="TEXT">Written Article</option>
                    </select>
                  </div>

                  {lessonType === 'VIDEO' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Video URL</label>
                      <input
                        type="url"
                        value={lessonVideoUrl}
                        onChange={(e) => setLessonVideoUrl(e.target.value)}
                        placeholder="Youtube / Vimeo embed link"
                        className="w-full px-4 py-2 rounded-xl border border-slate-100 focus:outline-none focus:border-primary-600 text-xs"
                      />
                    </div>
                  )}

                  {lessonType === 'PDF' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">PDF File URL</label>
                      <input
                        type="text"
                        value={lessonContent}
                        onChange={(e) => setLessonContent(e.target.value)}
                        placeholder="Direct link to hosted document"
                        className="w-full px-4 py-2 rounded-xl border border-slate-100 focus:outline-none focus:border-primary-600 text-xs"
                      />
                    </div>
                  )}

                  {lessonType === 'TEXT' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lecture Content</label>
                      <textarea
                        value={lessonContent}
                        onChange={(e) => setLessonContent(e.target.value)}
                        rows={6}
                        placeholder="Write standard article content here..."
                        className="w-full px-4 py-2 rounded-xl border border-slate-100 focus:outline-none focus:border-primary-600 text-xs resize-none"
                      ></textarea>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Duration (mins)</label>
                      <input
                        type="number"
                        min="0"
                        value={lessonDuration}
                        onChange={(e) => setLessonDuration(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-slate-100 focus:outline-none focus:border-primary-600 text-xs"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Preview Lesson</span>
                      <input
                        type="checkbox"
                        checked={lessonIsFree}
                        onChange={(e) => setLessonIsFree(e.target.checked)}
                        className="h-4 w-4 text-primary-600 rounded border-gray-300 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="text" size="sm" onClick={() => setShowLessonForm(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" size="sm">
                      Save Lecture
                    </Button>
                  </div>
                </form>
              </Card>
            )}
          </div>
        </div>
      )}

      {isEditMode && activeTab === 'ZOOM' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-fade-in-up">
          {/* Create Live Session Form (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <Card hover={false} className="bg-white border border-slate-100 p-6 rounded-2xl space-y-6">
              <h3 className="text-base font-bold text-slate-800 pb-2 border-b border-slate-50 flex items-center gap-2">
                <IoVideocamOutline size={18} className="text-primary-700" /> Start a Live Class
              </h3>
              
              <form onSubmit={handleStartLiveClass} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-505 uppercase tracking-wider block">Class Topic</label>
                  <input
                    type="text"
                    required
                    placeholder={`e.g. ${title} - Lecture Session`}
                    value={zoomTopic}
                    onChange={(e) => setZoomTopic(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-100 focus:outline-none focus:border-primary-600 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-505 uppercase tracking-wider block">Class Agenda (Optional)</label>
                  <textarea
                    rows={4}
                    placeholder="Provide details on the topics or modules to be discussed today..."
                    value={zoomAgenda}
                    onChange={(e) => setZoomAgenda(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-100 focus:outline-none focus:border-primary-600 text-sm resize-none"
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-505 uppercase tracking-wider block">Scheduled Start Time (Optional)</label>
                    <input
                      type="datetime-local"
                      value={zoomStartTime}
                      onChange={(e) => setZoomStartTime(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-100 focus:outline-none focus:border-primary-600 text-sm"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">Leave blank to start immediately.</p>
                    <p className="text-[10px] text-amber-600 mt-1">Instructor requests require admin approval before the class can start.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-505 uppercase tracking-wider block">Duration (Minutes)</label>
                    <input
                      type="number"
                      required
                      min="15"
                      max="300"
                      value={zoomDuration}
                      onChange={(e) => setZoomDuration(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-100 focus:outline-none focus:border-primary-600 text-sm"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button type="submit" variant="primary" size="md" className="w-full justify-center" disabled={startingClass}>
                    {startingClass 
                      ? 'Processing...' 
                      : zoomStartTime 
                      ? 'Schedule Live Class' 
                      : 'Start Live Class Now'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Active / Ended Session List (1 col) */}
          <Card hover={false} className="bg-white border border-slate-100 p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-primary-900 pb-2 border-b border-slate-50 flex items-center gap-1.5">
              <IoVideocamOutline size={18} /> Class Session History
            </h3>
            
            {loadingMeetings ? (
              <div className="text-center py-6 text-slate-400 text-xs animate-pulse">Loading sessions...</div>
            ) : meetings.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">No class sessions started yet.</div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                {meetings.map((meeting) => (
                  <div key={meeting.id} className="p-3.5 border border-slate-100 rounded-xl space-y-2.5 bg-slate-50/30 text-xs hover:border-primary-100 transition-colors">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 line-clamp-1">{meeting.topic}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {meeting.meetingId ? `ID: ${meeting.meetingId}` : 'Pending admin approval'}
                        </p>
                        {meeting.rejectedNote && (
                          <p className="text-[10px] text-red-500 mt-0.5">Rejected: {meeting.rejectedNote}</p>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider border shrink-0 ${
                        meeting.status === 'LIVE'
                          ? 'bg-red-50 text-red-700 border-red-100 animate-pulse font-extrabold'
                          : meeting.status === 'PENDING_APPROVAL'
                          ? 'bg-amber-50 text-amber-700 border-amber-100'
                          : meeting.status === 'REJECTED'
                          ? 'bg-red-50 text-red-600 border-red-100'
                          : 'bg-slate-50 text-slate-400 border-slate-150'
                      }`}>
                        {meeting.status === 'PENDING_APPROVAL' ? 'Awaiting Approval' : meeting.status}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-500 leading-tight space-y-0.5">
                      <p>Start: {new Date(meeting.startTime).toLocaleString()}</p>
                      <p>Duration: {meeting.duration} Mins</p>
                    </div>

                    {meeting.status === 'PENDING_APPROVAL' && (
                      <p className="text-[10px] text-amber-600 pt-1">Waiting for admin to approve this class request.</p>
                    )}

                    {meeting.status === 'LIVE' && meeting.meetingId && (
                      <div className="flex gap-2 pt-1">
                        <Link to={`/zoom-classroom/${meeting.meetingId}?courseId=${courseId}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full text-[10px] py-1 cursor-pointer">Enter Classroom</Button>
                        </Link>
                        <Button variant="secondary" size="sm" className="flex-1 text-[10px] py-1 text-red-600 hover:text-red-700 cursor-pointer" onClick={() => handleEndLiveClass(meeting.id)}>End</Button>
                      </div>
                    )}

                    {meeting.status === 'SCHEDULED' && meeting.meetingId && (
                      <div className="flex gap-2 pt-1">
                        <Link to={`/zoom-classroom/${meeting.meetingId}?courseId=${courseId}`} className="flex-1">
                          <Button variant="primary" size="sm" className="w-full text-[10px] py-1 cursor-pointer">Start Class</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Tab 4: RESOURCES */}
      {isEditMode && activeTab === 'RESOURCES' && (
        <div className="space-y-6 animate-fade-in-up">
          <Card hover={false} className="bg-white border border-slate-100 p-6 rounded-2xl space-y-6">
            <div className="flex justify-between items-center pb-2 border-b border-slate-50">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <IoCloudUploadOutline size={18} className="text-primary-700" /> Course Materials
              </h3>
              <div>
                <input
                  type="file"
                  id="course-files-upload"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploadingFiles}
                />
                <label
                  htmlFor="course-files-upload"
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    uploadingFiles
                      ? 'bg-slate-100 text-slate-400'
                      : 'bg-primary-600 hover:bg-primary-700 text-white'
                  }`}
                >
                  <IoCloudUploadOutline size={14} />
                  {uploadingFiles ? 'Uploading...' : 'Upload Files'}
                </label>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Upload any course-related files (PDFs, slides, documents, spreadsheets, zip files, etc.). Enrolled students will be able to download these.
            </p>

            {resources.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <IoCloudUploadOutline size={40} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium">No files uploaded yet.</p>
                <p className="text-xs mt-1">Click "Upload Files" above to add course materials.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {resources.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex items-center justify-between p-3.5 border border-slate-100 rounded-xl bg-slate-50/30 hover:border-primary-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-primary-50 rounded-lg shrink-0">
                        <IoDocumentOutline size={16} className="text-primary-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{resource.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {resource.fileType} · {resource.fileSize ? `${(resource.fileSize / 1024).toFixed(1)} KB` : '—'} · {new Date(resource.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={getImageUrl(resource.fileUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-bold text-primary-600 hover:text-primary-700 px-2 py-1 rounded-lg hover:bg-primary-50 transition-all"
                      >
                        Download
                      </a>
                      <button
                        onClick={() => handleDeleteResource(resource.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-all"
                      >
                        <IoTrashOutline size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>

  );
};

export default CourseForm;
