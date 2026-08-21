import api from './api';

export const enrollmentService = {
  // Enroll in a course
  enroll: (courseId) => api.post(`/enrollments/${courseId}`),

  // Get all my enrolled courses
  getMyEnrollments: () => api.get('/enrollments/my'),

  // Get full access to a course (modules, lessons, zoom links)
  getCourseAccess: (courseId) => api.get(`/enrollments/${courseId}`),

  // Mark a lesson as completed
  completeLesson: (courseId, lessonId, watchedSeconds = 0) =>
    api.post(`/enrollments/${courseId}/lessons/${lessonId}/complete`, { watchedSeconds }),
};

export const moduleService = {
  // Get modules for a course (instructor)
  getByCourse: (courseId) => api.get(`/modules/course/${courseId}`),

  // Create a module
  create: (courseId, data) => api.post(`/modules/course/${courseId}`, data),

  // Update a module
  update: (id, data) => api.put(`/modules/${id}`, data),

  // Delete a module
  delete: (id) => api.delete(`/modules/${id}`),

  // Reorder modules
  reorder: (courseId, orderedIds) =>
    api.patch(`/modules/course/${courseId}/reorder`, { orderedIds }),
};

export const lessonService = {
  // Get lessons for a module (instructor)
  getByModule: (moduleId) => api.get(`/lessons/module/${moduleId}`),

  // Create a lesson
  create: (moduleId, data) => api.post(`/lessons/module/${moduleId}`, data),

  // Update a lesson
  update: (id, data) => api.put(`/lessons/${id}`, data),

  // Delete a lesson
  delete: (id) => api.delete(`/lessons/${id}`),
};

export const instructorService = {
  // Get instructor's own courses
  getMyCourses: () => api.get('/courses/instructor/my-courses'),

  // Get enrolled students for a course
  getCourseStudents: (courseId) => api.get(`/enrollments/${courseId}/students`),

  // Create course
  createCourse: (formData) =>
    api.post('/courses', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

  // Update course (submits for approval if instructor)
  updateCourse: (courseId, formData) =>
    api.put(`/courses/${courseId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

  // Submit a new course for admin approval
  submitForApproval: (courseId) => api.patch(`/courses/${courseId}/submit-approval`),

  // Delete (archive) course
  deleteCourse: (courseId) => api.delete(`/courses/${courseId}`),

  // Get categories
  getCategories: () => api.get('/categories'),
};

export const resourceService = {
  // Upload files for a course
  upload: (courseId, formData) =>
    api.post(`/resources/course/${courseId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Get all resources for a course
  getByCourse: (courseId) => api.get(`/resources/course/${courseId}`),

  // Delete a resource
  delete: (id) => api.delete(`/resources/${id}`),
};

export const zoomService = {
  // Get meetings for a course
  getByCourse: (courseId) => api.get(`/zoom/course/${courseId}`),
  // Create a live class (instructor/admin)
  create: (courseId, data) => api.post(`/zoom/course/${courseId}`, data),
  // End a live class (instructor/admin)
  endClass: (meetingId) => api.delete(`/zoom/${meetingId}`),
  // Get SDK signature for in-browser classroom (role: 0=attendee, 1=host)
  getSignature: (meetingId, role = 0) => api.post(`/zoom/${meetingId}/signature`, { role }),
  // Attendance tracking
  joinAttendance: (meetingId) => api.post(`/zoom/${meetingId}/attendance/join`),
  leaveAttendance: (meetingId) => api.post(`/zoom/${meetingId}/attendance/leave`),
  // Get calendar meetings
  getCalendar: () => api.get('/zoom/calendar'),
  // Admin class approval
  getPendingApprovals: () => api.get('/zoom/admin/pending'),
  approveMeeting: (id) => api.patch(`/zoom/${id}/approve`),
  rejectMeeting: (id, reason) => api.patch(`/zoom/${id}/reject`, { reason }),
};

export const adminService = {
  // Platform stats
  getStats: () => api.get('/admin/stats'),

  // Users
  getUsers: (params) => api.get('/admin/users', { params }),
  toggleUserActive: (userId) => api.patch(`/admin/users/${userId}/toggle-active`),
  changeUserRole: (userId, role) => api.patch(`/admin/users/${userId}/role`, { role }),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),

  // Instructor approvals & management
  getPendingInstructors: () => api.get('/admin/instructors/pending'),
  createInstructor: (data) => api.post('/admin/instructors', data),
  approveInstructor: (id) => api.patch(`/admin/instructors/${id}/approve`),
  rejectInstructor: (id, reason) => api.patch(`/admin/instructors/${id}/reject`, { reason }),
  assignCourse: (instructorId, courseId) => api.patch(`/admin/instructors/${instructorId}/assign-course`, { courseId }),
  getInstructors: () => api.get('/admin/instructors'),

  // Attendance
  getCourseAttendance: (courseId) => api.get(`/admin/attendance/${courseId}`),

  // Courses
  getAllCourses: (params) => api.get('/admin/courses', { params }),
  getPendingCourses: () => api.get('/courses/admin/pending'),
  approveCourse: (courseId) => api.patch(`/courses/${courseId}/approve`),
  rejectCourse: (courseId, reason) => api.patch(`/courses/${courseId}/reject`, { reason }),
  togglePublish: (courseId) => api.patch(`/courses/${courseId}/publish`),

  // Enrollments
  getRecentEnrollments: () => api.get('/admin/enrollments'),

  // Courses - reassign / unassign instructor
  reassignCourseInstructor: (courseId, instructorId) => api.patch(`/admin/courses/${courseId}/reassign-instructor`, { instructorId }),
  unassignCourse: (courseId) => api.patch(`/admin/courses/${courseId}/unassign-instructor`),

  // Platform Announcements
  createAnnouncement: (data) => api.post('/admin/announcements', data),
  getAnnouncements: () => api.get('/admin/announcements'),
  deleteAnnouncement: (id) => api.delete(`/admin/announcements/${id}`),
  getActiveAnnouncements: () => api.get('/admin/announcements/active/banner'),
};

export const reviewService = {
  create: (data) => api.post('/reviews', data),
  getByCourse: (courseId) => api.get(`/reviews/course/${courseId}`),
  getByInstructor: (instructorId) => api.get(`/reviews/instructor/${instructorId}`),
  delete: (id) => api.delete(`/reviews/${id}`),
};

export const paymentService = {
  // Public
  getMethods: () => api.get('/payments/methods'),
  // Student
  submitRequest: (formData) => api.post('/payments/request', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMyRequests: () => api.get('/payments/my-requests'),
  // Admin
  adminGetMethods: () => api.get('/payments/admin/methods'),
  adminCreateMethod: (data) => api.post('/payments/admin/methods', data),
  adminUpdateMethod: (id, data) => api.put(`/payments/admin/methods/${id}`, data),
  adminDeleteMethod: (id) => api.delete(`/payments/admin/methods/${id}`),
  adminGetRequests: (params) => api.get('/payments/admin/requests', { params }),
  adminApproveRequest: (id) => api.patch(`/payments/admin/requests/${id}/approve`),
  adminRejectRequest: (id, reason) => api.patch(`/payments/admin/requests/${id}/reject`, { reason }),
  adminGetRevenue: () => api.get('/payments/admin/revenue'),
};

export const certificateService = {
  getCertificate: (courseId) => api.get(`/certificates/${courseId}`),
  getMyCertificates: () => api.get('/certificates/my'),
  verifyCertificate: (code) => api.get(`/certificates/verify/${code}`),
};

export const quizService = {
  // Instructor quiz management
  upsertQuiz: (courseId, data) => api.post(`/quiz/course/${courseId}`, data),
  getQuiz: (courseId) => api.get(`/quiz/course/${courseId}`),
  updateQuiz: (quizId, data) => api.put(`/quiz/${quizId}`, data),
  deleteQuiz: (quizId) => api.delete(`/quiz/${quizId}`),
  togglePublish: (quizId) => api.patch(`/quiz/${quizId}/publish`),
  importQuestions: (quizId, text, replace = true) => api.post(`/quiz/${quizId}/import`, { text, replace }),
  previewImport: (quizId, text) => api.post(`/quiz/${quizId}/preview-import`, { text }),
  getQuestions: (quizId) => api.get(`/quiz/${quizId}/questions`),
  deleteQuestion: (questionId) => api.delete(`/quiz/question/${questionId}`),
  getStats: (courseId) => api.get(`/quiz/course/${courseId}/stats`),
  adminGetAll: () => api.get('/quiz/admin/all'),

  // Student quiz flow
  checkEligibility: (courseId) => api.get(`/quiz/course/${courseId}/eligibility`),
  startQuiz: (courseId) => api.post(`/quiz/course/${courseId}/start`),
  submitAnswer: (attemptId, data) => api.post(`/quiz/attempt/${attemptId}/answer`, data),
  submitQuiz: (attemptId, data) => api.post(`/quiz/attempt/${attemptId}/submit`, data),
  getAttempts: (courseId) => api.get(`/quiz/course/${courseId}/attempts`),
  evaluateStatus: (courseId, userId = null) =>
    api.get(`/quiz/course/${courseId}/evaluate`, { params: userId ? { userId } : {} }),
};

export const assignmentService = {
  // ── Instructor ──────────────────────────────────────────────────────────────

  // Create a new assignment for a course (with optional file)
  createAssignment: (courseId, formData) =>
    api.post(`/assignments/course/${courseId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Get all assignments for a course (instructor view — with submission counts)
  getCourseAssignments: (courseId) => api.get(`/assignments/course/${courseId}`),

  // Delete an assignment
  deleteAssignment: (assignmentId) => api.delete(`/assignments/${assignmentId}`),

  // Get all student submissions for an assignment
  getSubmissions: (assignmentId) => api.get(`/assignments/${assignmentId}/submissions`),

  // Review / grade a submission
  reviewSubmission: (submissionId, data) =>
    api.patch(`/assignments/submissions/${submissionId}/review`, data),

  // ── Student ─────────────────────────────────────────────────────────────────

  // Get all assignments for a course with own submission status
  getStudentAssignments: (courseId) =>
    api.get(`/assignments/course/${courseId}/student`),

  // Submit completed assignment file
  submitAssignment: (assignmentId, formData) =>
    api.post(`/assignments/${assignmentId}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const announcementService = {
  // Instructor fetches all announcements for their course
  getCourseAnnouncements: (courseId) => api.get(`/courses/${courseId}/announcements`),

  // Instructor posts a new announcement
  createAnnouncement: (courseId, data) => api.post(`/courses/${courseId}/announcements`, data),

  // Instructor deletes an announcement
  deleteAnnouncement: (courseId, announcementId) =>
    api.delete(`/courses/${courseId}/announcements/${announcementId}`),
};

