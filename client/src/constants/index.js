export const API_URL = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

const SLUG_THUMBNAIL_MAP = {
  'osha-safety-training': '/uploads/osha-safety-training.jfif',
  'fire-safety-first-aid-training': '/uploads/fire-safety-first-aid-training.jfif',
  'iosh-safety-training': '/uploads/iosh-safety-training.jfif',
  'nebosh-international-safety-course': '/uploads/nebosh.jfif',
  'hse-officer-training': '/uploads/hse-officer-training.jfif',
  'risk-assessment-permit-to-work-training': '/uploads/risk-assessment-permit-to-work-training.jfif',
  'confined-space-safety-work-at-height-training': '/uploads/confined-space-safety-work-at-height.jfif',
  'finance-accounting-professional-course': '/uploads/finance-accounting-professional.jfif',
  'business-management-training': '/uploads/business-management-training.jfif',
  'graphic-design-media-course': '/uploads/graphic-design-media.jfif',
  'digital-marketing-professional-course': '/uploads/digital-marketing-professional.jfif',
  'css-interview-training-weekend-program': '/uploads/css-interview-training.jfif',
  'basic-computer-ms-office-course': '/uploads/basic-computer-ms-office.jfif',
  'english-speaking-course': '/uploads/english-speaking-course.jfif',
  'website-design-course': '/uploads/website-design-course.jfif',
};

export const getImageUrl = (path, slug) => {
  let targetPath = path;

  // If path is missing, empty, or points to iosh fallback for OSHA, resolve via slug
  if (!targetPath || (slug === 'osha-safety-training' && targetPath.includes('iosh-safety-training'))) {
    if (slug && SLUG_THUMBNAIL_MAP[slug]) {
      targetPath = SLUG_THUMBNAIL_MAP[slug];
    }
  }

  if (!targetPath) return '';
  if (targetPath.startsWith('http://') || targetPath.startsWith('https://')) return targetPath;
  
  const base = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api', '') 
    : (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : '') : '');
  
  return `${base}${targetPath}`;
};

export const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  COURSES: '/courses',
  COURSE_DETAIL: '/courses/:slug',
  FAQ: '/faq',
  CONTACT: '/contact',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  FINANCE_SOFTWARE: '/finance-software',
  VERIFY_CERTIFICATE: '/verify-certificate',

  
  // Student Portal
  STUDENT_DASHBOARD: '/student/dashboard',
  STUDENT_MY_COURSES: '/student/my-courses',
  STUDENT_COURSE_VIEW: '/student/course/:courseId',
  STUDENT_PROFILE: '/student/profile',
  STUDENT_CALENDAR: '/student/calendar',

  // Instructor Portal
  INSTRUCTOR_DASHBOARD: '/instructor/dashboard',
  INSTRUCTOR_COURSES: '/instructor/courses',
  INSTRUCTOR_COURSE_NEW: '/instructor/courses/new',
  INSTRUCTOR_COURSE_EDIT: '/instructor/courses/:courseId/edit',
  INSTRUCTOR_STUDENTS: '/instructor/students',
  INSTRUCTOR_PROFILE: '/instructor/profile',
  INSTRUCTOR_CALENDAR: '/instructor/calendar',

  // Admin Portal
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_COURSES: '/admin/courses',
  ADMIN_USERS: '/admin/users',
  ADMIN_APPROVALS: '/admin/approvals',
  ADMIN_ENROLLMENTS: '/admin/enrollments',
  ADMIN_INSTRUCTORS: '/admin/instructors',
  ADMIN_ANNOUNCEMENTS: '/admin/announcements',
  ADMIN_ATTENDANCE: '/admin/attendance',
};

export const ROLES = {
  STUDENT: 'STUDENT',
  INSTRUCTOR: 'INSTRUCTOR',
  ADMIN: 'ADMIN',
};
