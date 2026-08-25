-- AlterTable: track original submit time and resubmission count
ALTER TABLE "assignment_submissions" ADD COLUMN IF NOT EXISTS "firstSubmittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "assignment_submissions" ADD COLUMN IF NOT EXISTS "resubmissionCount" INTEGER NOT NULL DEFAULT 0;

-- Backfill firstSubmittedAt from the actual submittedAt for existing rows
UPDATE "assignment_submissions" SET "firstSubmittedAt" = "submittedAt";
