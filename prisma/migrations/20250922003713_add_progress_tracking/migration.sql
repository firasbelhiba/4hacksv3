-- AlterTable
ALTER TABLE "public"."code_quality_reports" ADD COLUMN     "currentStage" TEXT,
ADD COLUMN     "estimatedTimeRemaining" INTEGER,
ADD COLUMN     "processedFiles" INTEGER,
ADD COLUMN     "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "stageProgress" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "totalFiles" INTEGER;
