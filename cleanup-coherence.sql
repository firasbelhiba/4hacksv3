-- Clean up stuck coherence reports
-- First, let's see what stuck reports exist
SELECT
    id,
    "projectId",
    status,
    progress,
    "currentStage",
    "createdAt",
    "updatedAt",
    (NOW() - "createdAt") as age
FROM coherence_reports
WHERE status IN ('PENDING', 'IN_PROGRESS')
AND "createdAt" < NOW() - INTERVAL '2 minutes'
ORDER BY "createdAt" DESC;

-- Update stuck reports to FAILED status
UPDATE coherence_reports
SET
    status = 'FAILED',
    progress = 0,
    "currentStage" = 'cleanup',
    "errorMessage" = 'Analysis was stuck and cleaned up automatically',
    "analysisCompletedAt" = NOW(),
    "updatedAt" = NOW()
WHERE status IN ('PENDING', 'IN_PROGRESS')
AND "createdAt" < NOW() - INTERVAL '2 minutes';

-- Confirm the cleanup
SELECT
    COUNT(*) as total_reports,
    SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed_reports,
    SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress_reports,
    SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_reports
FROM coherence_reports;