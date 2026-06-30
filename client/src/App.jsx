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

// Portal Dashboards (Placeholders)
import StudentDashboard from './pages/student/StudentDashboard';
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
          </Route>

          {/* Instructor Dashboard Layout */}
          <Route 
            path="/instructor" 
            element={
              <ProtectedRoute allowedRoles={[ROLES.INSTRUCTOR, ROLES.ADMIN]}>
                <InstructorLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to={ROUTES.INSTRUCTOR_DASHBOARD} replace />} />
            <Route path="dashboard" element={<InstructorDashboard />} />
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
          </Route>

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
