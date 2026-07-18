import { getImageUrl } from '../../constants/index';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import api from '../../services/api';
import { motion } from 'framer-motion';
import { 
  IoBookOutline, 
  IoPeopleOutline, 
  IoRibbonOutline, 
  IoVideocamOutline,
  IoArrowForwardOutline,
  IoCheckmarkCircleSharp,
  IoCloseOutline,
} from 'react-icons/io5';

const HomePage = () => {
  const [stats, setStats] = useState({
    totalCourses: 12,
    totalStudents: 1240,
    totalInstructors: 48,
    totalEnrollments: 3840
  });

  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adDismissed, setAdDismissed] = useState(false);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const statsRes = await api.get('/courses/stats');
        if (statsRes.data?.data?.stats) {
          setStats(statsRes.data.data.stats);
        }

        const coursesRes = await api.get('/courses/featured');
        if (coursesRes.data?.data?.courses) {
          setFeaturedCourses(coursesRes.data.data.courses);
        }
      } catch (err) {
        console.error('Error fetching home page data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  return (
    <div className="overflow-x-hidden font-sans">
      
      {/* 1. Hero Section */}
      <section className="relative bg-gradient-to-b from-primary-50 via-white to-slate-50/30 pt-16 pb-20 sm:pt-20 sm:pb-28 lg:pt-24 lg:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
            
            {/* Left Content */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-6 space-y-6 text-center lg:text-left"
            >
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-accent-100/60 text-accent-700 border border-accent-200">
                🛡️ Pakistan's Premier Safety & Technology Institute
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-extrabold tracking-tight text-slate-900 leading-none">
                Learn <span className="bg-gradient-to-r from-primary-700 to-accent-500 bg-clip-text text-transparent">Safety & Technology</span> from Certified Experts
              </h1>
              <p className="text-base sm:text-lg text-slate-500 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Join Swift Institute of Safety & Technology — attend live Zoom interactive classes, access downloadable course materials, track your progress, and earn internationally recognized certificates.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link to={ROUTES.COURSES}>
                  <Button variant="primary" size="lg" className="w-full sm:w-auto flex items-center gap-2 group">
                    <span>Explore Courses</span>
                    <IoArrowForwardOutline className="group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to={ROUTES.ABOUT}>
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                    Learn More
                  </Button>
                </Link>
              </div>



            </motion.div>

            {/* Right Hero Image Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-6 mt-12 lg:mt-0 relative flex justify-center"
            >
              <div className="relative w-full max-w-md lg:max-w-lg aspect-square sm:aspect-video lg:aspect-square bg-gradient-to-tr from-primary-500/10 to-primary-300/5 rounded-3xl p-6 border border-slate-100 shadow-2xl flex items-center justify-center overflow-hidden">
                {/* Floating UI Elements */}
                <div className="absolute top-10 left-10 p-4 bg-white/80 backdrop-blur border border-slate-100 rounded-2xl soft-shadow space-y-2 animate-bounce" style={{ animationDuration: '6s' }}>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Live Zoom Session</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800">Full-Stack Web Dev</p>
                </div>

                <div className="absolute bottom-10 right-10 p-4 bg-white/85 backdrop-blur border border-slate-100 rounded-2xl soft-shadow flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary-100 text-primary-700">
                    <IoRibbonOutline size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Certificate Issued</p>
                    <p className="text-[10px] text-slate-400 font-semibold">Verified on Blockchain</p>
                  </div>
                </div>

                {/* Main Illustration placeholder (elegant graphic block) */}
                {!adDismissed && (
                  <div className="w-4/5 h-4/5 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-500 shadow-lg text-white flex flex-col justify-end p-8 relative">
                    <button
                      type="button"
                      onClick={() => setAdDismissed(true)}
                      className="absolute top-3 right-3 z-20 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                      aria-label="Dismiss"
                    >
                      <IoCloseOutline size={20} />
                    </button>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent)]"></div>
                    <h3 className="text-2xl font-heading font-extrabold tracking-tight relative z-10">Expand Your Learning Envelope</h3>
                    <p className="text-sm text-primary-100 mt-2 relative z-10 font-light">Interactive platform with live mentoring, downloadable slides, and automated quiz modules.</p>
                  </div>
                )}
              </div>
            </motion.div>

          </div>
        </div>
      </section>



      {/* 3. Core Features Section */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-primary-700 bg-primary-50 px-3 py-1 rounded-full">Core Pillars</span>
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-slate-900">Why Train With SWIFT?</h2>
          <p className="text-slate-500 max-w-lg mx-auto text-sm sm:text-base">Everything you need to successfully gain professional safety & technology certifications.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
            
            <Card hover={true} className="text-center space-y-4 p-8">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-blue-50 text-primary-600 flex items-center justify-center shadow-inner">
                <IoVideocamOutline size={24} />
              </div>
              <h3 className="text-lg font-heading font-bold text-slate-800">Live Zoom Classes</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">Join virtual classrooms directly from the student dashboard. Interact, ask questions, and attend workshops live.</p>
            </Card>

            <Card hover={true} className="text-center space-y-4 p-8">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-blue-50 text-primary-600 flex items-center justify-center shadow-inner">
                <IoBookOutline size={24} />
              </div>
              <h3 className="text-lg font-heading font-bold text-slate-800">Premium Materials</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">Download curriculum PDFs, exercises, and slides curated by instructors. Access them offline, anytime.</p>
            </Card>

            <Card hover={true} className="text-center space-y-4 p-8">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-blue-50 text-primary-600 flex items-center justify-center shadow-inner">
                <IoRibbonOutline size={24} />
              </div>
              <h3 className="text-lg font-heading font-bold text-slate-800">Certified Milestone</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">Gain a verified, secure certificate of completion to showcase on LinkedIn or your portfolio resume.</p>
            </Card>

          </div>
        </div>
      </section>

      {/* 4. Featured Courses Section */}
      <section className="py-20 sm:py-28 bg-slate-50/50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-12">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-3 py-1 rounded-full">Top Catalogues</span>
              <h2 className="text-3xl font-heading font-bold text-slate-900">Explore Our Featured Courses</h2>
            </div>
            <Link to={ROUTES.COURSES}>
              <Button variant="secondary" size="md" className="flex items-center gap-1.5 group">
                <span>View All Courses</span>
                <IoArrowForwardOutline className="group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
            </div>
          ) : featuredCourses.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl p-8 shadow-sm">
              <p className="text-slate-400">No courses published yet. Log in as Administrator or Instructor to seed the database.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredCourses.map((course) => (
                <Card key={course.id} hover={true} className="flex flex-col h-full overflow-hidden p-0 rounded-2xl bg-white border border-slate-100 group">
                  {/* Thumbnail */}
                  <div className="aspect-video w-full bg-slate-100 relative overflow-hidden">
                    {course.thumbnail ? (
                      <img 
                        src={getImageUrl(course.thumbnail)} 
                        alt={course.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-700 to-accent-500 text-white font-heading font-bold text-lg">
                        SWIFT
                      </div>
                    )}
                    <span className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-white/90 backdrop-blur text-slate-800 border border-white/50">
                      {course.level}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-primary-600 uppercase tracking-wider">
                        {course.category?.name}
                      </span>
                      <h3 className="font-heading font-bold text-slate-800 text-base sm:text-lg hover:text-primary-600 transition-colors line-clamp-1">
                        <Link to={`/courses/${course.slug}`}>{course.title}</Link>
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-400 line-clamp-2 leading-relaxed">
                        {course.shortDescription || course.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-heading font-bold text-xs uppercase">
                          {course.instructor?.name?.charAt(0)}
                        </div>
                        <span className="text-xs text-slate-500 font-semibold">{course.instructor?.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-800">
                          {course.isFree ? 'Free' : `$${course.price}`}
                        </span>
                        <Link to={`/courses/${course.slug}`} className="text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors">
                          View Details →
                        </Link>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

        </div>
      </section>

      {/* 5. Professional CTA Section */}
      <section className="py-20 bg-primary-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_10%,rgba(201,162,39,0.15),transparent)]"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <span className="inline-block px-3 py-1 rounded-full bg-accent-500/20 text-accent-300 text-xs font-bold uppercase tracking-widest mb-2">Join Swift Institute Today</span>
          <h2 className="text-3xl sm:text-4xl font-heading font-bold">Start Your Safety & Technology Journey</h2>
          <p className="text-primary-200 max-w-lg mx-auto text-sm sm:text-base leading-relaxed">
            Enroll now in internationally recognized safety and technology programs. Build expertise that makes workplaces safer and careers stronger.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Link to={ROUTES.REGISTER}>
              <Button variant="primary" size="lg">Sign Up Now</Button>
            </Link>
            <Link to={ROUTES.CONTACT}>
              <Button variant="outline" size="lg" className="border-slate-700 text-white hover:bg-slate-800">
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;
