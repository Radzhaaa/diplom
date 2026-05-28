-- Fix activity_logs.metadata column type from text to jsonb
ALTER TABLE activity_logs
    ALTER COLUMN metadata TYPE JSONB USING metadata::JSONB;
