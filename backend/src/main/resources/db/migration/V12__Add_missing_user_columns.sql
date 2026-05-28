-- Add missing columns to users table
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS bio               TEXT,
    ADD COLUMN IF NOT EXISTS github_url        VARCHAR(255),
    ADD COLUMN IF NOT EXISTS phone             VARCHAR(50),
    ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(100);
