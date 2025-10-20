-- Core Database Index Optimization
-- Only essential indexes that match the exact schema
-- Targeting 75% performance improvement for common query patterns

-- ====================
-- CODE QUALITY INDEXES
-- ====================

CREATE INDEX IF NOT EXISTS "idx_code_quality_dashboard"
ON "code_quality_reports" ("projectId", "status", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_code_quality_analytics"
ON "code_quality_reports" ("status", "overallScore", "createdAt");

CREATE INDEX IF NOT EXISTS "idx_code_quality_repository"
ON "code_quality_reports" ("repositoryUrl", "status", "createdAt");

-- ====================
-- INNOVATION INDEXES
-- ====================

CREATE INDEX IF NOT EXISTS "idx_innovation_dashboard"
ON "innovation_reports" ("projectId", "status", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_innovation_scores"
ON "innovation_reports" ("status", "score", "noveltyScore", "creativityScore");

CREATE INDEX IF NOT EXISTS "idx_innovation_patents"
ON "innovation_reports" ("patentPotential", "patentabilityScore", "createdAt");

-- ====================
-- COHERENCE INDEXES
-- ====================

CREATE INDEX IF NOT EXISTS "idx_coherence_dashboard"
ON "coherence_reports" ("projectId", "status", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_coherence_track"
ON "coherence_reports" ("status", "trackAlignment", "score");

CREATE INDEX IF NOT EXISTS "idx_coherence_readme"
ON "coherence_reports" ("readmeExists", "readmeQuality", "status");

-- ====================
-- HEDERA INDEXES
-- ====================

CREATE INDEX IF NOT EXISTS "idx_hedera_dashboard"
ON "hedera_analysis_reports" ("projectId", "status", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_hedera_technology"
ON "hedera_analysis_reports" ("technologyCategory", "confidence", "status");

CREATE INDEX IF NOT EXISTS "idx_hedera_usage"
ON "hedera_analysis_reports" ("status", "hederaUsageScore", "confidence");

-- ====================
-- PROJECT INDEXES
-- ====================

CREATE INDEX IF NOT EXISTS "idx_projects_hackathon"
ON "projects" ("hackathonId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_projects_track"
ON "projects" ("hackathonId", "trackId", "status");

CREATE INDEX IF NOT EXISTS "idx_projects_repository"
ON "projects" ("githubUrl", "hackathonId");

-- ====================
-- HACKATHON INDEXES
-- ====================

CREATE INDEX IF NOT EXISTS "idx_hackathons_creator"
ON "hackathons" ("createdById", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_hackathons_dates"
ON "hackathons" ("endDate", "startDate", "createdAt");

-- ====================
-- TRACK INDEXES
-- ====================

CREATE INDEX IF NOT EXISTS "idx_tracks_hackathon"
ON "tracks" ("hackathonId", "order", "name");

-- ====================
-- ELIGIBILITY INDEXES
-- ====================

CREATE INDEX IF NOT EXISTS "idx_eligibility_project"
ON "eligibility_reports" ("projectId", "status", "eligible");

CREATE INDEX IF NOT EXISTS "idx_eligibility_analytics"
ON "eligibility_reports" ("eligible", "overallScore", "createdAt");

-- ====================
-- NOTIFICATION INDEXES
-- ====================

CREATE INDEX IF NOT EXISTS "idx_notifications_user"
ON "notifications" ("userId", "read", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_notifications_cleanup"
ON "notifications" ("createdAt", "read");

-- ====================
-- ACTIVITY LOG INDEXES
-- ====================

CREATE INDEX IF NOT EXISTS "idx_activity_user"
ON "activity_logs" ("userId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_activity_project"
ON "activity_logs" ("projectId", "action", "createdAt" DESC);

-- ====================
-- EVALUATION INDEXES
-- ====================

CREATE INDEX IF NOT EXISTS "idx_evaluations_score"
ON "evaluations" ("overallScore" DESC, "status", "completedAt");

-- ====================
-- COMPOSITE INDEXES FOR DASHBOARD
-- ====================

CREATE INDEX IF NOT EXISTS "idx_project_analysis_dashboard"
ON "projects" ("hackathonId", "status", "createdAt" DESC, "githubUrl");

-- ====================
-- ANALYZE TABLES
-- ====================

ANALYZE "projects";
ANALYZE "code_quality_reports";
ANALYZE "innovation_reports";
ANALYZE "coherence_reports";
ANALYZE "hedera_analysis_reports";
ANALYZE "hackathons";
ANALYZE "tracks";
ANALYZE "eligibility_reports";
ANALYZE "evaluations";
ANALYZE "notifications";
ANALYZE "activity_logs";