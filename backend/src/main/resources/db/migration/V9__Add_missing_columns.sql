-- Add missing columns to projects table
ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS invite_token            VARCHAR(255) UNIQUE,
    ADD COLUMN IF NOT EXISTS invite_token_expires_at TIMESTAMP;
