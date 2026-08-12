-- AlterTable: add rollNumber to enrollments (nullable, unique)
ALTER TABLE "enrollments" ADD COLUMN "rollNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_rollNumber_key" ON "enrollments"("rollNumber");
CREATE INDEX "enrollments_rollNumber_idx" ON "enrollments"("rollNumber");
