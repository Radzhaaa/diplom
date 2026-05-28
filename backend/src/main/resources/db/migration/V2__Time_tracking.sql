-- Таблица для учёта времени на задачах
CREATE TABLE time_entries (
    id              BIGSERIAL PRIMARY KEY,
    task_id         BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time      TIMESTAMP NOT NULL,
    end_time        TIMESTAMP,
    duration_minutes INTEGER,
    note            VARCHAR(500),
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_time_entries_task   ON time_entries(task_id);
CREATE INDEX idx_time_entries_user   ON time_entries(user_id);
CREATE INDEX idx_time_entries_active ON time_entries(user_id, task_id) WHERE end_time IS NULL;
