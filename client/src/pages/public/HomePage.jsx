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
                Join Swift Institute of Safety & Technology attend live Zoom interactive classes, access downloadable course materials, track your progress, and earn internationally recognized certificates.
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
              className="lg:col-span-6 mt-12 lg:mt-0 relative flex justify-center px-4 sm:px-0"
            >
              <div className="relative w-full max-w-xl lg:max-w-2xl">
                
                {/* Background Ambient Glow */}
                <div className="absolute -inset-2 bg-gradient-to-r from-primary-600/20 to-accent-500/20 rounded-3xl blur-2xl opacity-70 pointer-events-none"></div>

                {/* Glass Container Frame */}
                <div className="relative rounded-3xl p-2.5 sm:p-3 bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-2xl shadow-slate-900/10">
                  <div className="rounded-2xl overflow-hidden aspect-[16/10] bg-slate-900 relative group">
                    <img
                      src="/hero-illustration.jpg"
                      alt="Student studying online with Swift Institute"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    {/* Subtle Gradient Shadow Overlay at bottom */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />
                  </div>
                </div>

                {/* Floating UI Element - Top Left */}
                <div 
                  className="absolute -top-4 -left-2 sm:-left-6 p-3 sm:p-3.5 bg-white/95 backdrop-blur-md border border-slate-100 rounded-2xl shadow-xl space-y-1 z-20"
                  style={{ animation: 'float1 6s ease-in-out infinite' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Live Zoom Classes</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 m-0">Safety & Tech Management</p>
                </div>

                {/* Floating UI Element - Bottom Right */}
                <div 
                  className="absolute -bottom-4 -right-2 sm:-right-6 p-2.5 sm:p-3.5 bg-white/95 backdrop-blur-md border border-slate-100 rounded-2xl shadow-xl flex items-center gap-3 z-20"
                  style={{ animation: 'float2 7s ease-in-out infinite' }}
                >
                  <div className="p-2 sm:p-2.5 rounded-xl bg-primary-700 text-white shadow-sm shrink-0">
                    <IoRibbonOutline size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-slate-800 m-0">Verifiable Certificate</p>
                    <p className="text-[10px] text-slate-400 font-semibold m-0">Internationally Accredited</p>
                  </div>
                </div>

                {/* Floating UI Element - Top Right */}
                <div 
                  className="absolute -top-5 right-4 sm:right-8 px-3.5 py-1.5 bg-slate-900/90 backdrop-blur-md text-amber-400 rounded-full text-xs font-bold shadow-lg border border-slate-700/50 flex items-center gap-2 z-20"
                  style={{ animation: 'float1 8s ease-in-out infinite reverse' }}
                >
                  <span>🎓</span>
                  <span className="text-white font-semibold">48 Certified Experts</span>
                </div>

              </div>

                <style>{`
                  @keyframes float1 {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-8px); }
                  }
                  @keyframes float2 {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(8px); }
                  }
                  @keyframes subtleFloat {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.02); }
                  }
                `}</style>
            </motion.div>

          </div>
        </div>
      </section>



      {/* 3. Core Features Section */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="inline-block text-xs font-bold uppercase tracking-wider text-primary-700 bg-primary-50 px-3 py-1 rounded-full mb-3">Core Pillars</span>
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-slate-900">Why Train With Swift?</h2>
          <p className="text-slate-500 max-w-lg mx-auto text-sm sm:text-base">Everything you need to successfully gain professional safety & technology certifications.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10">

            {/* Card 1 */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary-800 via-primary-900 to-slate-900 p-8 text-left shadow-xl shadow-primary-900/20 group hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute top-4 right-4 text-accent-400/20 text-6xl select-none pointer-events-none">★</div>
              <div className="mb-5 h-11 w-11 rounded-2xl bg-primary-700/60 text-accent-400 flex items-center justify-center shadow-inner border border-primary-700/40">
                <IoVideocamOutline size={22} />
              </div>
              <h3 className="text-base font-heading font-bold text-accent-400 mb-2">Live Zoom Classes</h3>
              <p className="text-xs sm:text-sm text-primary-200/80 leading-relaxed">Join virtual classrooms directly from the student dashboard. Interact, ask questions, and attend workshops live.</p>
            </div>

            {/* Card 2 */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary-800 via-primary-900 to-slate-900 p-8 text-left shadow-xl shadow-primary-900/20 group hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute top-4 right-4 text-accent-400/20 text-6xl select-none pointer-events-none">★</div>
              <div className="mb-5 h-11 w-11 rounded-2xl bg-primary-700/60 text-accent-400 flex items-center justify-center shadow-inner border border-primary-700/40">
                <IoBookOutline size={22} />
              </div>
              <h3 className="text-base font-heading font-bold text-accent-400 mb-2">Premium Materials</h3>
              <p className="text-xs sm:text-sm text-primary-200/80 leading-relaxed">Download curriculum PDFs, Exercises, and Slides Curated by Instructors. Access them offline, anytime.</p>
            </div>

            {/* Card 3 */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary-800 via-primary-900 to-slate-900 p-8 text-left shadow-xl shadow-primary-900/20 group hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute top-4 right-4 text-accent-400/20 text-6xl select-none pointer-events-none">★</div>
              <div className="mb-5 h-11 w-11 rounded-2xl bg-primary-700/60 text-accent-400 flex items-center justify-center shadow-inner border border-primary-700/40">
                <IoRibbonOutline size={22} />
              </div>
              <h3 className="text-base font-heading font-bold text-accent-400 mb-2">Certified Milestone</h3>
              <p className="text-xs sm:text-sm text-primary-200/80 leading-relaxed">Gain a Verified, Secure Certificate of Completion to Showcase on LinkedIn or your Portfolio Resume.</p>
            </div>

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
                <Link key={course.id} to={`/courses/${course.slug}`} className="block h-full group">
                  <Card hover={true} className="flex flex-col h-full overflow-hidden p-0 rounded-2xl bg-white border border-slate-100">
                    {/* Thumbnail */}
                    <div className="aspect-video w-full bg-slate-100 relative overflow-hidden">
                      {course.thumbnail || course.slug ? (
                        <img 
                          src={getImageUrl(course.thumbnail, course.slug)} 
                          alt={course.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-700 to-accent-500 text-white font-heading font-bold text-lg">
                          Swift
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
                        <h3 className="font-heading font-bold text-slate-800 text-base sm:text-lg group-hover:text-primary-600 transition-colors line-clamp-1">
                          {course.title}
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
                            {course.isFree ? 'Free' : `PKR ${Number(course.price).toLocaleString()}`}
                          </span>
                          <span className="text-xs font-bold text-primary-600 group-hover:text-primary-700 transition-colors">
                            View Details →
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
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
