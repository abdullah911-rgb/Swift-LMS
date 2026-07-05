-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "pendingApproval" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pendingEdits" JSONB;

-- AlterTable
ALTER TABLE "resources" ADD COLUMN     "courseId" TEXT,
ALTER COLUMN "lessonId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "resources_courseId_idx" ON "resources"("courseId");

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
