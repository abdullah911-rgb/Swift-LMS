const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { issueCertificate } = require('../utils/certificateId');

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

    // Require full course completion for certificate issuance
    if (enrollment.progress < 100 && enrollment.status !== 'COMPLETED') {
      return sendError(
        res,
        `You need to complete the course to get a certificate. Current progress: ${Math.round(enrollment.progress)}%`,
        400,
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
      await issueCertificate(studentId, courseId);
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
};

module.exports = certificateController;
