-- Migration: Add Hedera presence detection and complexity fields
-- Date: 2025-01-27

-- Add HederaComplexityLevel enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'HederaComplexityLevel') THEN
        CREATE TYPE "HederaComplexityLevel" AS ENUM ('SIMPLE', 'MODERATE', 'ADVANCED');
    END IF;
END $$;

-- Add new fields to hedera_analysis_reports table
ALTER TABLE hedera_analysis_reports
ADD COLUMN IF NOT EXISTS "hederaPresenceDetected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "complexityLevel" "HederaComplexityLevel",
ADD COLUMN IF NOT EXISTS "presenceEvidence" JSONB NOT NULL DEFAULT '[]';

-- Update any existing records to have the new defaults
UPDATE hedera_analysis_reports
SET
  "hederaPresenceDetected" = CASE
    WHEN "technologyCategory" = 'HEDERA' THEN true
    ELSE false
  END,
  "complexityLevel" = CASE
    WHEN "technologyCategory" = 'HEDERA' AND "confidence" >= 70 THEN 'ADVANCED'::"HederaComplexityLevel"
    WHEN "technologyCategory" = 'HEDERA' AND "confidence" >= 40 THEN 'MODERATE'::"HederaComplexityLevel"
    WHEN "technologyCategory" = 'HEDERA' THEN 'SIMPLE'::"HederaComplexityLevel"
    ELSE NULL
  END,
  "presenceEvidence" = '[]'::jsonb;