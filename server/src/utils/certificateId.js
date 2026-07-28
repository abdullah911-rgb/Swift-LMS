const prisma = require('../config/db');

/**
 * Generate unique Certificate ID in pattern: SST-YYYY-00012345
 */
async function generateCertificateId() {
  const year = new Date().getFullYear();
  const prefix = `SST-${year}-`;

  const last = await prisma.certificate.findFirst({
    where: { certificateId: { startsWith: prefix } },
    orderBy: { certificateId: 'desc' },
    select: { certificateId: true },
  });

  let next = 1;
  if (last?.certificateId) {
    const parts = last.certificateId.split('-');
    const num = parseInt(parts[parts.length - 1], 10);
    if (!Number.isNaN(num)) next = num + 1;
  }

  return `${prefix}${String(next).padStart(8, '0')}`;
}

/**
 * Issue a certificate for a student+course if eligible.
 * Returns existing certificate if already issued.
 */
async function issueCertificate(studentId, courseId) {
  const existing = await prisma.certificate.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
  });
  if (existing) {
    if (!existing.certificateId) {
      const certificateId = await generateCertificateId();
      return prisma.certificate.update({
        where: { id: existing.id },
        data: { certificateId },
      });
    }
    return existing;
  }

  const certificateId = await generateCertificateId();
  return prisma.certificate.create({
    data: { studentId, courseId, certificateId },
  });
}

module.exports = { generateCertificateId, issueCertificate };
