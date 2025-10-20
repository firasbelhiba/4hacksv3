-- Migration: Remove integrationQuality and networkUsage fields
-- Date: 2025-01-27
-- These fields were removed from the Hedera analysis system

-- Remove columns from hedera_analysis_reports table
ALTER TABLE hedera_analysis_reports
DROP COLUMN IF EXISTS "integrationQuality",
DROP COLUMN IF EXISTS "networkUsage";

-- Drop the NetworkUsageType enum since it's no longer used
DROP TYPE IF EXISTS "NetworkUsageType";