import { getImageUrl } from '../../constants/index';
import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { IoSearchOutline, IoFilterOutline } from 'react-icons/io5';

const CoursesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedLevel, setSelectedLevel] = useState(searchParams.get('level') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [totalPages, setTotalPages] = useState(1);

  // Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get('/categories');
        setCategories(data.data.categories);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch Courses when filters change
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const params = {
          page,
          limit: 9,
          search,
          category: selectedCategory,
          level: selectedLevel,
        };
        const { data } = await api.get('/courses', { params });
        setCourses(data.data.courses);
        setTotalPages(data.data.pagination.totalPages);
      } catch (err) {
        console.error('Failed to fetch courses:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [page, search, selectedCategory, selectedLevel]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (search) newParams.set('search', search);
    else newParams.delete('search');
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleCategorySelect = (categorySlug) => {
    setPage(1);
    setSelectedCategory(categorySlug);
    const newParams = new URLSearchParams(searchParams);
    if (categorySlug) newParams.set('category', categorySlug);
    else newParams.delete('category');
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleLevelSelect = (level) => {
    setPage(1);
    setSelectedLevel(level);
    const newParams = new URLSearchParams(searchParams);
    if (level) newParams.set('level', level);
    else newParams.delete('level');
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', String(newPage));
    setSearchParams(newParams);
  };

  return (
    <div className="py-12 sm:py-16 bg-slate-50/30 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header Intro */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-slate-900 leading-none">
            Browse All Curriculum Courses
          </h1>
          <p className="text-sm text-slate-500 max-w-lg mx-auto">
            Choose from beginner to advanced programming tracks. Master design patterns, framework layers, and databases.
          </p>
        </div>

        {/* Search & Basic Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <IoSearchOutline size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search courses by keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-xl transition-all duration-200 outline-none text-slate-800 text-sm"
              />
            </div>
            <Button type="submit" variant="primary" size="sm" className="shrink-0 px-5">
              Search
            </Button>
          </form>

          {/* Level filters */}
          <div className="flex gap-2 overflow-x-auto pb-0.5 sm:pb-0 shrink-0">
            {[['', 'All'], ['BEGINNER', 'Beginner'], ['INTERMEDIATE', 'Intermediate'], ['ADVANCED', 'Advanced']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => handleLevelSelect(val)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap uppercase tracking-wide transition-all cursor-pointer border ${
                  selectedLevel === val
                    ? 'bg-primary-700 text-white border-primary-700 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-primary-400 hover:text-primary-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Categories sidebar */}
          <div className="lg:col-span-3 space-y-4">
            <Card hover={false} className="border border-slate-100 p-5 bg-white space-y-4">
              <h3 className="text-sm font-heading font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <IoFilterOutline size={16} />
                <span>Categories</span>
              </h3>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleCategorySelect('')}
                  className={`w-full text-left px-3.5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer
                    ${!selectedCategory 
                      ? 'bg-primary-50 text-primary-700' 
                      : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.slug)}
                    className={`w-full text-left px-3.5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer flex justify-between items-center
                      ${selectedCategory === cat.slug 
                        ? 'bg-primary-50 text-primary-700 font-semibold' 
                        : 'text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <span>{cat.name}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full">
                      {cat._count?.courses || 0}
                    </span>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column: Courses catalog grid */}
          <div className="lg:col-span-9 space-y-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 bg-white border border-slate-100 rounded-2xl p-8 soft-shadow">
                <Spinner size="lg" />
                <p className="text-sm text-slate-400 mt-4 animate-pulse">Loading catalog items...</p>
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl p-8 soft-shadow">
                <p className="text-slate-450 text-sm font-semibold text-slate-500">No courses match your selected filter criteria.</p>
              </div>
            ) : (
              <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {courses.map((course) => (
                    <Card key={course.id} hover={true} className="flex flex-col overflow-hidden p-0 rounded-2xl bg-white border border-slate-100 group h-full">
                      {/* Image Thumbnail */}
                      <div className="aspect-video w-full bg-slate-100 relative overflow-hidden shrink-0">
                        {course.thumbnail ? (
                          <img
                            src={getImageUrl(course.thumbnail)}
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-500 text-white font-heading font-bold text-lg">
                            LMS
                          </div>
                        )}
                        <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-white/90 backdrop-blur text-slate-800 border border-white/50">
                          {course.level}
                        </span>
                      </div>

                      {/* Content details */}
                      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-primary-600 uppercase tracking-wider">
                            {course.category?.name}
                          </span>
                          <h3 className="font-heading font-bold text-slate-800 text-sm sm:text-base hover:text-primary-600 transition-colors line-clamp-2 leading-snug">
                            <Link to={`/courses/${course.slug}`}>{course.title}</Link>
                          </h3>
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {course.shortDescription || course.description}
                          </p>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 items-center text-[10px] font-bold text-slate-400 pt-1">
                            <span>⏱️ {course.durationInMonths || 2} Months</span>
                            <span>•</span>
                            <span>📖 {course.totalLessons} Lessons</span>
                          </div>
                        </div>

                        {/* Bottom Metadata bar */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="h-6 w-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-heading font-bold text-[10px] uppercase shrink-0">
                              {course.instructor?.name?.charAt(0)}
                            </div>
                            <span className="text-[11px] text-slate-500 font-semibold truncate">{course.instructor?.name}</span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-bold text-slate-800">
                              {course.isFree ? 'Free' : `PKR ${Number(course.price).toLocaleString()}`}
                            </span>
                            <Link to={`/courses/${course.slug}`} className="text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors whitespace-nowrap">
                              View →
                            </Link>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-6">
                    <Button
                      variant="secondary"
                      size="sm"
                      isDisabled={page === 1}
                      onClick={() => handlePageChange(page - 1)}
                    >
                      Previous
                    </Button>
                    <span className="text-xs font-semibold text-slate-550 text-slate-500 px-4">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      isDisabled={page === totalPages}
                      onClick={() => handlePageChange(page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default CoursesPage;
