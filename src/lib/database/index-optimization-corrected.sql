-- Corrected Database Index Optimization
-- Targeting 75% performance improvement for common query patterns
-- Based on actual schema structure

-- ====================
-- CODE QUALITY INDEXES
-- ====================

-- Dashboard queries: Get latest reports by project
CREATE INDEX IF NOT EXISTS "idx_code_quality_dashboard"
ON "code_quality_reports" ("projectId", "status", "createdAt" DESC);

-- Analytics queries: Score distribution analysis
CREATE INDEX IF NOT EXISTS "idx_code_quality_analytics"
ON "code_quality_reports" ("status", "overallScore", "createdAt");

-- Performance monitoring: Processing time analysis
CREATE INDEX IF NOT EXISTS "idx_code_quality_performance"
ON "code_quality_reports" ("status", "analysisTimeMs", "createdAt");

-- Progress tracking: Current stage and progress
CREATE INDEX IF NOT EXISTS "idx_code_quality_progress"
ON "code_quality_reports" ("projectId", "status", "progress", "updatedAt");

-- Repository analysis: Same repo across projects
CREATE INDEX IF NOT EXISTS "idx_code_quality_repository"
ON "code_quality_reports" ("repositoryUrl", "status", "createdAt");

-- ====================
-- INNOVATION INDEXES
-- ====================

-- Dashboard: Latest innovation reports
CREATE INDEX IF NOT EXISTS "idx_innovation_dashboard"
ON "innovation_reports" ("projectId", "status", "createdAt" DESC);

-- Score analysis: Innovation metrics
CREATE INDEX IF NOT EXISTS "idx_innovation_scores"
ON "innovation_reports" ("status", "score", "noveltyScore", "creativityScore");

-- Patent analysis: Patent potential tracking
CREATE INDEX IF NOT EXISTS "idx_innovation_patents"
ON "innovation_reports" ("patentPotential", "patentabilityScore", "createdAt");

-- Archive management: Archived reports
CREATE INDEX IF NOT EXISTS "idx_innovation_archive"
ON "innovation_reports" ("isArchived", "status", "updatedAt");

-- Processing time: Performance analysis
CREATE INDEX IF NOT EXISTS "idx_innovation_processing"
ON "innovation_reports" ("status", "processingTime", "createdAt");

-- ====================
-- COHERENCE INDEXES
-- ====================

-- Dashboard: Coherence report status
CREATE INDEX IF NOT EXISTS "idx_coherence_dashboard"
ON "coherence_reports" ("projectId", "status", "createdAt" DESC);

-- Track alignment analysis
CREATE INDEX IF NOT EXISTS "idx_coherence_track"
ON "coherence_reports" ("status", "trackAlignment", "score");

-- README analysis: Quality tracking
CREATE INDEX IF NOT EXISTS "idx_coherence_readme"
ON "coherence_reports" ("readmeExists", "readmeQuality", "status");

-- Progress monitoring: Analysis stages
CREATE INDEX IF NOT EXISTS "idx_coherence_progress"
ON "coherence_reports" ("projectId", "status", "progress", "currentStage");

-- Performance tracking: Analysis duration
CREATE INDEX IF NOT EXISTS "idx_coherence_performance"
ON "coherence_reports" ("status", "analysisTimeMs", "createdAt");

-- ====================
-- HEDERA INDEXES
-- ====================

-- Dashboard: Hedera analysis status
CREATE INDEX IF NOT EXISTS "idx_hedera_dashboard"
ON "hedera_analysis_reports" ("projectId", "status", "createdAt" DESC);

-- Technology categorization
CREATE INDEX IF NOT EXISTS "idx_hedera_technology"
ON "hedera_analysis_reports" ("technologyCategory", "confidence", "status");

-- Usage scoring: Hedera implementation quality
CREATE INDEX IF NOT EXISTS "idx_hedera_usage"
ON "hedera_analysis_reports" ("status", "hederaUsageScore", "confidence");

-- Repository analysis: Same repo patterns
CREATE INDEX IF NOT EXISTS "idx_hedera_repository"
ON "hedera_analysis_reports" ("repositoryUrl", "technologyCategory", "createdAt");

-- Progress tracking: Analysis stages
CREATE INDEX IF NOT EXISTS "idx_hedera_progress"
ON "hedera_analysis_reports" ("projectId", "status", "progress", "currentStage");

-- Complexity analysis: Implementation depth
CREATE INDEX IF NOT EXISTS "idx_hedera_complexity"
ON "hedera_analysis_reports" ("complexityLevel", "status", "confidence");

-- ====================
-- PROJECT INDEXES
-- ====================

-- Hackathon project listings (most common query)
CREATE INDEX IF NOT EXISTS "idx_projects_hackathon"
ON "projects" ("hackathonId", "createdAt" DESC);

-- Project ownership and access control
CREATE INDEX IF NOT EXISTS "idx_projects_track"
ON "projects" ("hackathonId", "trackId", "status");

-- Repository URL lookups (for duplicate detection)
CREATE INDEX IF NOT EXISTS "idx_projects_repository"
ON "projects" ("githubUrl", "hackathonId");

-- Track-based filtering
CREATE INDEX IF NOT EXISTS "idx_projects_track_filter"
ON "projects" ("trackId", "status", "createdAt" DESC);

-- Project status queries
CREATE INDEX IF NOT EXISTS "idx_projects_status"
ON "projects" ("status", "submittedAt", "createdAt");

-- ====================
-- HACKATHON INDEXES
-- ====================

-- User hackathon access
CREATE INDEX IF NOT EXISTS "idx_hackathons_creator"
ON "hackathons" ("createdById", "createdAt" DESC);

-- Active hackathons
CREATE INDEX IF NOT EXISTS "idx_hackathons_active"
ON "hackathons" ("isActive", "endDate", "startDate");

-- Hackathon slugs (URL lookups)
CREATE INDEX IF NOT EXISTS "idx_hackathons_slug"
ON "hackathons" ("slug", "isActive");

-- ====================
-- TRACK INDEXES
-- ====================

-- Hackathon tracks
CREATE INDEX IF NOT EXISTS "idx_tracks_hackathon"
ON "tracks" ("hackathonId", "order", "name");

-- ====================
-- ELIGIBILITY INDEXES
-- ====================

-- Project eligibility status
CREATE INDEX IF NOT EXISTS "idx_eligibility_project"
ON "eligibility_reports" ("projectId", "status", "eligible");

-- Eligibility analytics
CREATE INDEX IF NOT EXISTS "idx_eligibility_analytics"
ON "eligibility_reports" ("eligible", "overallScore", "createdAt");

-- Repository eligibility
CREATE INDEX IF NOT EXISTS "idx_eligibility_repository"
ON "eligibility_reports" ("repositoryUrl", "status", "eligible");

-- ====================
-- NOTIFICATION INDEXES
-- ====================

-- User notifications (most frequent query)
CREATE INDEX IF NOT EXISTS "idx_notifications_user"
ON "notifications" ("userId", "isRead", "createdAt" DESC);

-- Notification cleanup
CREATE INDEX IF NOT EXISTS "idx_notifications_cleanup"
ON "notifications" ("createdAt", "isRead");

-- ====================
-- ACTIVITY LOG INDEXES
-- ====================

-- User activity tracking
CREATE INDEX IF NOT EXISTS "idx_activity_user"
ON "activity_logs" ("userId", "createdAt" DESC);

-- Project activity
CREATE INDEX IF NOT EXISTS "idx_activity_project"
ON "activity_logs" ("projectId", "action", "createdAt" DESC);

-- System activity monitoring
CREATE INDEX IF NOT EXISTS "idx_activity_system"
ON "activity_logs" ("action", "createdAt" DESC);

-- ====================
-- EVALUATION INDEXES
-- ====================

-- Overall score ranking
CREATE INDEX IF NOT EXISTS "idx_evaluations_score"
ON "evaluations" ("overallScore" DESC, "status", "completedAt");

-- Evaluation status tracking
CREATE INDEX IF NOT EXISTS "idx_evaluations_status"
ON "evaluations" ("status", "startedAt", "evaluationTime");

-- ====================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- ====================

-- Project analysis dashboard (most expensive query)
CREATE INDEX IF NOT EXISTS "idx_project_analysis_dashboard"
ON "projects" ("hackathonId", "status", "createdAt" DESC, "githubUrl");

-- Cross-layer analysis correlation
CREATE INDEX IF NOT EXISTS "idx_analysis_correlation"
ON "code_quality_reports" ("projectId", "status", "overallScore", "createdAt");

-- Multi-table joins for analytics
CREATE INDEX IF NOT EXISTS "idx_hackathon_projects_analytics"
ON "projects" ("hackathonId", "trackId", "status", "submittedAt");

-- ====================
-- PERFORMANCE MONITORING INDEXES
-- ====================

-- Analysis time tracking across all layers
CREATE INDEX IF NOT EXISTS "idx_code_quality_timing"
ON "code_quality_reports" ("createdAt", "analysisTimeMs", "status");

CREATE INDEX IF NOT EXISTS "idx_innovation_timing"
ON "innovation_reports" ("createdAt", "processingTime", "status");

CREATE INDEX IF NOT EXISTS "idx_coherence_timing"
ON "coherence_reports" ("createdAt", "analysisTimeMs", "status");

-- Error analysis across all layers
CREATE INDEX IF NOT EXISTS "idx_code_quality_errors"
ON "code_quality_reports" ("status", "errorMessage", "createdAt")
WHERE "status" = 'FAILED';

CREATE INDEX IF NOT EXISTS "idx_innovation_errors"
ON "innovation_reports" ("status", "createdAt")
WHERE "status" = 'FAILED';

CREATE INDEX IF NOT EXISTS "idx_coherence_errors"
ON "coherence_reports" ("status", "errorMessage", "createdAt")
WHERE "status" = 'FAILED';

CREATE INDEX IF NOT EXISTS "idx_hedera_errors"
ON "hedera_analysis_reports" ("status", "errorMessage", "createdAt")
WHERE "status" = 'FAILED';

-- ====================
-- ANALYZE TABLES
-- ====================

-- Update table statistics for optimal query planning
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