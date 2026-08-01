const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { computeFinalScore, issueCertificateWithMarks } = require('../utils/evaluationUtils');


const certificateController = {

  // ── GET /api/certificates/:courseId — issue or fetch a student certificate ─
  getCertificate: asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const studentId = req.user.id;

    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
      include: { course: { include: { instructor: { select: { name: true } } } } },
    });

    if (!enrollment) return sendError(res, 'You are not enrolled in this course.', 403);
    if (enrollment.status === 'DROPPED') {
      return sendError(res, 'Your enrollment is deactivated. Contact admin to reactivate before receiving a certificate.', 403);
    }
    if (!enrollment.course.certificate) {
      return sendError(res, 'This course does not offer a certificate.', 400);
    }

    // Call full eligibility / evaluation logic
    const evaluation = await computeFinalScore(studentId, courseId);
    if (!evaluation.eligible) {
      return sendError(
        res,
        evaluation.reason || 'You are not eligible for a certificate.',
        403,
        { breakdown: evaluation.breakdown }
      );
    }

    let certificate = await prisma.certificate.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
      include: {
        student: { select: { name: true, email: true, fatherName: true } },
        course: { include: { instructor: { select: { name: true } } } },
      },
    });

    if (!certificate) {
      await issueCertificateWithMarks(studentId, courseId, evaluation.breakdown);
      certificate = await prisma.certificate.findUnique({
        where: { studentId_courseId: { studentId, courseId } },
        include: {
          student: { select: { name: true, email: true, fatherName: true } },
          course: { include: { instructor: { select: { name: true } } } },
        },
      });
    }

    sendSuccess(res, 'Certificate ready.', {
      certificate: {
        id: certificate.id,
        certificateId: certificate.certificateId,
        verificationCode: certificate.verificationCode,
        issuedAt: certificate.issuedAt,
        studentName: certificate.student.name,
        studentEmail: certificate.student.email,
        fatherName: certificate.student.fatherName,
        courseTitle: certificate.course.title,
        instructorName: certificate.course.instructor?.name || 'N/A',
        courseLevel: certificate.course.level,
        attendanceMarks: certificate.attendanceMarks,
        assignmentMarks: certificate.assignmentMarks,
        mcqMarks: certificate.mcqMarks,
        finalMarks: certificate.finalMarks,
      },
    });
  }),

  // ── GET /api/certificates/my — get all my certificates ────────────────────
  getMyCertificates: asyncHandler(async (req, res) => {
    const certificates = await prisma.certificate.findMany({
      where: { studentId: req.user.id },
      include: {
        student: { select: { name: true, fatherName: true } },
        course: { select: { title: true, thumbnail: true, level: true, instructor: { select: { name: true } } } },
      },
      orderBy: { issuedAt: 'desc' },
    });
    sendSuccess(res, 'Certificates retrieved.', { certificates });
  }),

  // ── GET /api/certificates/verify/:code — public verification ─────────────
  verifyCertificate: asyncHandler(async (req, res) => {
    const { code } = req.params;
    
    // Search by verificationCode (UUID)
    let certificate = await prisma.certificate.findUnique({
      where: { verificationCode: code },
      include: {
        student: { select: { name: true, fatherName: true, cnic: true } },
        course: { select: { title: true, level: true, instructor: { select: { name: true } } } },
      },
    });

    // Fallback: search by certificateId (SST-YYYY-NNNNNNNN)
    if (!certificate) {
      certificate = await prisma.certificate.findUnique({
        where: { certificateId: code },
        include: {
          student: { select: { name: true, fatherName: true, cnic: true } },
          course: { select: { title: true, level: true, instructor: { select: { name: true } } } },
        },
      });
    }

    if (!certificate) {
      return sendError(res, 'Certificate not found or verification ID is invalid.', 404);
    }


    sendSuccess(res, 'Certificate verified successfully.', {
      certificate: {
        certificateId: certificate.certificateId,
        verificationCode: certificate.verificationCode,
        issuedAt: certificate.issuedAt,
        studentName: certificate.student.name,
        fatherName: certificate.student.fatherName,
        cnic: certificate.student.cnic,
        courseTitle: certificate.course.title,
        courseLevel: certificate.course.level,
        instructorName: certificate.course.instructor?.name || 'N/A',
        attendanceMarks: certificate.attendanceMarks,
        assignmentMarks: certificate.assignmentMarks,
        mcqMarks: certificate.mcqMarks,
        finalMarks: certificate.finalMarks,
      },
    });
  }),

};

module.exports = certificateController;
