import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../constants';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import { 
  IoCheckmarkCircleSharp, 
  IoChevronDownOutline, 
  IoBookOutline, 
  IoTimeOutline, 
  IoGlobeOutline,
  IoRibbonOutline,
  IoChevronUpOutline,
  IoPlayCircleOutline,
  IoDocumentTextOutline
} from 'react-icons/io5';

const CourseDetailPage = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrollSubmitting, setEnrollSubmitting] = useState(false);
  
  // Accordion state for modules
  const [openModuleIndex, setOpenModuleIndex] = useState(0);

  useEffect(() => {
    const fetchCourseDetail = async () => {
      try {
        const { data } = await api.get(`/courses/${slug}`);
        setCourse(data.data.course);
        setIsEnrolled(data.data.isEnrolled);
      } catch (err) {
        console.error('Failed to fetch course details:', err);
        toast.error('Failed to load course details. It may be draft or private.');
      } finally {
        setLoading(false);
      }
    };
    fetchCourseDetail();
  }, [slug]);

  const handleEnroll = async () => {
    if (!user) {
      toast.error('Please sign in to enroll in courses.');
      navigate(ROUTES.LOGIN, { state: { from: { pathname: `/courses/${slug}` } } });
      return;
    }

    setEnrollSubmitting(true);
    try {
      // Direct enrollment simulation (Phase 2 core action)
      // For now, call a placeholder server route or simulate successful database entry
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsEnrolled(true);
      toast.success('Successfully enrolled! Welcome to the course.');
      navigate(ROUTES.STUDENT_DASHBOARD);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Enrollment failed.');
    } finally {
      setEnrollSubmitting(false);
    }
  };

  const toggleModule = (index) => {
    setOpenModuleIndex(openModuleIndex === index ? null : index);
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-slate-50/20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50/20 font-sans px-4">
        <div className="text-center space-y-4 max-w-sm">
          <h2 className="text-xl font-heading font-bold text-slate-800">Course Not Found</h2>
          <p className="text-sm text-slate-500">The requested course might have been unpublished or removed.</p>
          <Link to={ROUTES.COURSES}>
            <Button variant="primary" size="sm">Back to Catalog</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 sm:py-16 bg-slate-50/30 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Banner Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Details */}
          <div className="lg:col-span-8 space-y-6">
            <div className="space-y-4">
              <Badge variant="primary">{course.category?.name}</Badge>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-extrabold text-slate-900 leading-tight">
                {course.title}
              </h1>
              <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
                {course.shortDescription || course.description}
              </p>
            </div>

            {/* Quick Meta */}
            <div className="flex flex-wrap gap-5 text-xs font-semibold text-slate-500 border-y border-slate-100 py-4">
              <span className="flex items-center gap-1.5">
                <IoBookOutline size={16} />
                <span>{course.totalLessons} Lessons</span>
              </span>
              <span className="flex items-center gap-1.5">
                <IoTimeOutline size={16} />
                <span>{Math.round(course.duration / 60) || 15} Hours</span>
              </span>
              <span className="flex items-center gap-1.5">
                <IoGlobeOutline size={16} />
                <span>{course.language}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <IoRibbonOutline size={16} />
                <span>{course.certificate ? 'Verifiable Certificate' : 'No Certificate'}</span>
              </span>
            </div>

            {/* What you will learn */}
            {course.learningOutcomes?.length > 0 && (
              <Card hover={false} className="border border-slate-100 p-6 bg-white space-y-4">
                <h3 className="text-base font-heading font-bold text-slate-800">Learning Outcomes</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {course.learningOutcomes.map((outcome, idx) => (
                    <div key={idx} className="flex gap-2.5 items-start">
                      <IoCheckmarkCircleSharp className="text-primary-500 mt-0.5 flex-shrink-0" size={16} />
                      <span className="text-xs sm:text-sm text-slate-500">{outcome}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Curriculum Modules */}
            <div className="space-y-4">
              <h3 className="text-lg font-heading font-bold text-slate-800">Curriculum Syllabus</h3>
              {course.modules?.length === 0 ? (
                <p className="text-sm text-slate-450 text-slate-500 pl-2">Syllabus is being updated by the instructor.</p>
              ) : (
                <div className="space-y-3">
                  {course.modules?.map((mod, index) => {
                    const isOpen = openModuleIndex === index;
                    return (
                      <Card key={mod.id} hover={false} className="p-0 border border-slate-100 overflow-hidden bg-white">
                        <button
                          onClick={() => toggleModule(index)}
                          className="w-full flex items-center justify-between px-5 py-4 text-left font-semibold text-slate-800 hover:bg-slate-50/20 transition-all outline-none cursor-pointer"
                        >
                          <div className="space-y-0.5">
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Module {mod.order}</span>
                            <h4 className="text-sm sm:text-base font-heading font-semibold leading-tight">{mod.title}</h4>
                          </div>
                          {isOpen ? <IoChevronUpOutline size={18} className="text-slate-400" /> : <IoChevronDownOutline size={18} className="text-slate-400" />}
                        </button>

                        {isOpen && (
                          <div className="border-t border-slate-50 bg-slate-50/10 p-3 space-y-2">
                            {mod.lessons?.length === 0 ? (
                              <p className="text-xs text-slate-400 p-2 font-medium">No lessons published in this module.</p>
                            ) : (
                              mod.lessons?.map((lesson) => (
                                <div 
                                  key={lesson.id} 
                                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition-colors text-xs sm:text-sm text-slate-650"
                                >
                                  <div className="flex items-center gap-2.5">
                                    {lesson.type === 'VIDEO' ? (
                                      <IoPlayCircleOutline size={18} className="text-slate-400" />
                                    ) : (
                                      <IoDocumentTextOutline size={18} className="text-slate-400" />
                                    )}
                                    <span className="font-medium text-slate-600">{lesson.title}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {lesson.duration && (
                                      <span className="text-xs text-slate-400">{Math.round(lesson.duration / 60)}m</span>
                                    )}
                                    {lesson.isFree && (
                                      <Badge variant="success" className="text-[9px] px-1.5 py-0">Preview</Badge>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Prerequisites */}
            {course.prerequisites?.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-base font-heading font-bold text-slate-800">Prerequisites</h3>
                <ul className="list-disc pl-5 text-xs sm:text-sm text-slate-500 space-y-2">
                  {course.prerequisites.map((pre, idx) => (
                    <li key={idx}>{pre}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Instructor Card */}
            <div className="space-y-4">
              <h3 className="text-lg font-heading font-bold text-slate-800">Your Instructor</h3>
              <Card hover={false} className="border border-slate-100 p-6 bg-white flex flex-col sm:flex-row gap-5 items-start">
                <div className="h-16 w-16 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center font-heading font-extrabold text-2xl uppercase flex-shrink-0">
                  {course.instructor?.name?.charAt(0)}
                </div>
                <div className="space-y-2">
                  <h4 className="font-heading font-bold text-slate-800 text-base">{course.instructor?.name}</h4>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{course.instructor?.bio || 'Expert industry mentor.'}</p>
                </div>
              </Card>
            </div>

          </div>

          {/* Right Enrollment CTA widget */}
          <div className="lg:col-span-4 lg:sticky lg:top-24">
            <Card hover={false} className="border border-slate-100 bg-white p-6 soft-shadow space-y-6">
              
              {/* Image Preview */}
              <div className="aspect-video w-full rounded-xl bg-slate-100 overflow-hidden relative border border-slate-50">
                {course.thumbnail ? (
                  <img 
                    src={course.thumbnail.startsWith('/') ? `http://localhost:5000${course.thumbnail}` : course.thumbnail} 
                    alt={course.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-500 text-white font-heading font-bold text-lg">
                    LMS
                  </div>
                )}
              </div>

              {/* Price Details */}
              <div className="space-y-1 text-center">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Course Pricing</p>
                <p className="text-3xl font-heading font-extrabold text-slate-800">
                  {course.isFree ? 'Free Access' : `$${course.price}`}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {isEnrolled ? (
                  <Link to={ROUTES.STUDENT_DASHBOARD} className="block w-full">
                    <Button variant="accent" className="w-full">
                      Already Enrolled — Go to Portal
                    </Button>
                  </Link>
                ) : (
                  <Button 
                    variant="primary" 
                    className="w-full"
                    onClick={handleEnroll}
                    isLoading={enrollSubmitting}
                  >
                    Enroll in Course
                  </Button>
                )}
              </div>

              <div className="space-y-3.5 text-xs text-slate-400 font-medium">
                <div className="flex items-center justify-between">
                  <span>Full Lifetime Access</span>
                  <span className="text-slate-650 text-slate-700">Yes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Resource Downloads</span>
                  <span className="text-slate-650 text-slate-700">Yes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Verifiable Certificate</span>
                  <span className="text-slate-650 text-slate-700">{course.certificate ? 'Included' : 'None'}</span>
                </div>
              </div>

            </Card>
          </div>

        </div>

      </div>
    </div>
  );
};

export default CourseDetailPage;
