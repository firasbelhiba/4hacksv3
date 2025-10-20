-- Manual migration: Remove evaluation_criteria table
-- This migration drops the evaluation_criteria table as it's not used by the AI agents

-- Drop the table (CASCADE will remove the foreign key constraint from hackathons)
DROP TABLE IF EXISTS "evaluation_criteria" CASCADE;
