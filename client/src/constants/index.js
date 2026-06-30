export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
  
  // Portals placeholders/routes
  STUDENT_DASHBOARD: '/student/dashboard',
  INSTRUCTOR_DASHBOARD: '/instructor/dashboard',
  ADMIN_DASHBOARD: '/admin/dashboard',
};

export const ROLES = {
  STUDENT: 'STUDENT',
  INSTRUCTOR: 'INSTRUCTOR',
  ADMIN: 'ADMIN',
};
