-- Minimal Database Index Optimization
-- Only essential indexes for confirmed schema columns

-- ====================
-- CODE QUALITY INDEXES
-- ====================

CREATE INDEX IF NOT EXISTS "idx_code_quality_project_status"
ON "code_quality_reports" ("projectId", "status", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_code_quality_score_analysis"
ON "code_quality_reports" ("status", "overallScore");

-- ====================
-- INNOVATION INDEXES
-- ====================

CREATE INDEX IF NOT EXISTS "idx_innovation_project_status"
ON "innovation_reports" ("projectId", "status", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_innovation_score_analysis"
ON "innovation_reports" ("status", "score");

-- ====================
-- COHERENCE INDEXES
-- ====================

CREATE INDEX IF NOT EXISTS "idx_coherence_project_status"
ON "coherence_reports" ("projectId", "status", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_coherence_score_analysis"
ON "coherence_reports" ("status", "score");

-- ====================
-- HEDERA INDEXES
-- ====================

CREATE INDEX IF NOT EXISTS "idx_hedera_project_status"
ON "hedera_analysis_reports" ("projectId", "status", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_hedera_confidence_analysis"
ON "hedera_analysis_reports" ("status", "confidence");

-- ====================
-- PROJECT INDEXES
-- ====================

CREATE INDEX IF NOT EXISTS "idx_projects_hackathon_list"
ON "projects" ("hackathonId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_projects_track_filter"
ON "projects" ("trackId", "status");

CREATE INDEX IF NOT EXISTS "idx_projects_github_url"
ON "projects" ("githubUrl");

-- ====================
-- HACKATHON INDEXES
-- ====================

CREATE INDEX IF NOT EXISTS "idx_hackathons_creator_list"
ON "hackathons" ("createdById", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_hackathons_date_range"
ON "hackathons" ("startDate", "endDate");

-- ====================
-- TRACK INDEXES
-- ====================

CREATE INDEX IF NOT EXISTS "idx_tracks_hackathon_order"
ON "tracks" ("hackathonId", "order");

-- ====================
-- ELIGIBILITY INDEXES
-- ====================

CREATE INDEX IF NOT EXISTS "idx_eligibility_project_status"
ON "eligibility_reports" ("projectId", "status");

CREATE INDEX IF NOT EXISTS "idx_eligibility_result"
ON "eligibility_reports" ("eligible", "overallScore");

-- ====================
-- EVALUATION INDEXES
-- ====================

CREATE INDEX IF NOT EXISTS "idx_evaluations_score_ranking"
ON "evaluations" ("overallScore" DESC, "status");

-- ====================
-- NOTIFICATION INDEXES
-- ====================

CREATE INDEX IF NOT EXISTS "idx_notifications_user_status"
ON "notifications" ("userId", "read", "createdAt" DESC);

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