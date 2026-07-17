import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import { ROUTES, ROLES } from './constants';

// Layouts
import PublicLayout from './components/layouts/PublicLayout';
import StudentLayout from './components/layouts/StudentLayout';
import InstructorLayout from './components/layouts/InstructorLayout';
import AdminLayout from './components/layouts/AdminLayout';

// Protected Route Guard
import ProtectedRoute from './components/common/ProtectedRoute';
import AuthPortalGuard from './components/common/AuthPortalGuard';
import ErrorBoundary from './components/common/ErrorBoundary';

// Public Pages
import HomePage from './pages/public/HomePage';
import CoursesPage from './pages/public/CoursesPage';
import CourseDetailPage from './pages/public/CourseDetailPage';
import AboutPage from './pages/public/AboutPage';
import FAQPage from './pages/public/FAQPage';
import ContactPage from './pages/public/ContactPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage';
import ResetPasswordPage from './pages/public/ResetPasswordPage';
import NotFoundPage from './pages/public/NotFoundPage';

// Portal Dashboards
import StudentDashboard from './pages/student/StudentDashboard';
import MyCourses from './pages/student/MyCourses';
import StudentCourseView from './pages/student/StudentCourseView';
import StudentProfile from './pages/student/StudentProfile';
import StudentCalendar from './pages/student/StudentCalendar';

import InstructorDashboard from './pages/instructor/InstructorDashboard';
import InstructorCourses from './pages/instructor/InstructorCourses';
import CourseForm from './pages/instructor/CourseForm';
import InstructorStudents from './pages/instructor/InstructorStudents';
import InstructorProfile from './pages/instructor/InstructorProfile';
import InstructorCalendar from './pages/instructor/InstructorCalendar';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminApprovals from './pages/admin/AdminApprovals';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCourses from './pages/admin/AdminCourses';
import AdminEnrollments from './pages/admin/AdminEnrollments';
import AdminInstructors from './pages/admin/AdminInstructors';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminPayments from './pages/admin/AdminPayments';
import AdminRevenue from './pages/admin/AdminRevenue';

// Student extras
import MyCertificates from './pages/student/MyCertificates';
import PaymentPage from './pages/student/PaymentPage';
import StudentPayments from './pages/student/StudentPayments';

// Zoom Classroom
import ZoomClassroom from './pages/ZoomClassroom';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthPortalGuard />
        {/* React Toast Alerts */}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#ffffff',
              color: '#1e293b',
              border: '1px solid #f1f5f9',
              borderRadius: '12px',
              fontFamily: 'system-ui, sans-serif',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 4px 30px rgba(0,0,0,0.03)'
            }
          }}
        />

        <ErrorBoundary>
        <Routes>
          {/* Public Website Layout */}
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<HomePage />} />
            <Route path={ROUTES.COURSES} element={<CoursesPage />} />
            <Route path={ROUTES.COURSE_DETAIL} element={<CourseDetailPage />} />
            <Route path={ROUTES.ABOUT} element={<AboutPage />} />
            <Route path={ROUTES.FAQ} element={<FAQPage />} />
            <Route path={ROUTES.CONTACT} element={<ContactPage />} />
            
            {/* Auth Routes */}
            <Route path={ROUTES.LOGIN} element={<LoginPage />} />
            <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
            <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
            <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
            
            {/* 404 handler */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* Student Dashboard Layout */}
          <Route 
            path="/student" 
            element={
              <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to={ROUTES.STUDENT_DASHBOARD} replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="my-courses" element={<MyCourses />} />
            <Route path="course/:courseId" element={<StudentCourseView />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="calendar" element={<StudentCalendar />} />
            <Route path="certificates" element={<MyCertificates />} />
            <Route path="payments" element={<StudentPayments />} />
            <Route path="pay/:courseId" element={<PaymentPage />} />
          </Route>

          {/* Instructor Dashboard Layout */}
          <Route 
            path="/instructor" 
            element={
              <ProtectedRoute allowedRoles={[ROLES.INSTRUCTOR]}>
                <InstructorLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to={ROUTES.INSTRUCTOR_DASHBOARD} replace />} />
            <Route path="dashboard" element={<InstructorDashboard />} />
            <Route path="courses" element={<InstructorCourses />} />
            <Route path="courses/new" element={<CourseForm />} />
            <Route path="courses/:courseId/edit" element={<CourseForm />} />
            <Route path="students" element={<InstructorStudents />} />
            <Route path="profile" element={<InstructorProfile />} />
            <Route path="calendar" element={<InstructorCalendar />} />
          </Route>

          {/* Admin Dashboard Layout */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to={ROUTES.ADMIN_DASHBOARD} replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="approvals" element={<AdminApprovals />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="enrollments" element={<AdminEnrollments />} />
            <Route path="instructors" element={<AdminInstructors />} />
            <Route path="announcements" element={<AdminAnnouncements />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="revenue" element={<AdminRevenue />} />
          </Route>

          {/* Zoom In-Browser Classroom — accessible to all authenticated roles */}
          <Route
            path="/zoom-classroom/:meetingId"
            element={
              <ProtectedRoute allowedRoles={[ROLES.STUDENT, ROLES.INSTRUCTOR, ROLES.ADMIN]}>
                <ZoomClassroom />
              </ProtectedRoute>
            }
          />

        </Routes>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
