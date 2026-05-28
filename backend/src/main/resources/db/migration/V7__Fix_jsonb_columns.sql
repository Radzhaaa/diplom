-- Fix remaining JSONB columns that were created as text by Hibernate ddl-auto
ALTER TABLE ai_messages
    ALTER COLUMN metadata TYPE JSONB USING metadata::JSONB;

ALTER TABLE organizations
    ALTER COLUMN settings TYPE JSONB USING settings::JSONB;
