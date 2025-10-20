-- Manual migration to add eligibility_reports table
-- This preserves existing data and only adds the new table

CREATE TABLE IF NOT EXISTS "eligibility_reports" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "repositoryUrl" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "eligible" BOOLEAN NOT NULL DEFAULT false,
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reason" TEXT,
    "evidence" JSONB NOT NULL DEFAULT '{}',
    "criteria" JSONB NOT NULL DEFAULT '{}',
    "repositoryStatus" TEXT,
    "accessibilityCheck" JSONB NOT NULL DEFAULT '{}',
    "processingTime" INTEGER,
    "agentModel" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eligibility_reports_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "eligibility_reports_projectId_idx" ON "eligibility_reports"("projectId");
CREATE INDEX IF NOT EXISTS "eligibility_reports_status_idx" ON "eligibility_reports"("status");
CREATE INDEX IF NOT EXISTS "eligibility_reports_eligible_idx" ON "eligibility_reports"("eligible");

-- Add foreign key constraint
ALTER TABLE "eligibility_reports"
ADD CONSTRAINT "eligibility_reports_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;