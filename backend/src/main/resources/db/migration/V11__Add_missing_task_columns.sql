-- Add missing columns to tasks table
ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS estimated_hours   INTEGER,
    ADD COLUMN IF NOT EXISTS recurrence_rule   VARCHAR(50) DEFAULT 'NONE',
    ADD COLUMN IF NOT EXISTS recurrence_end_date TIMESTAMP;
