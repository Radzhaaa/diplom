-- meetings
CREATE TABLE meetings (
    id               BIGSERIAL PRIMARY KEY,
    title            VARCHAR(255) NOT NULL,
    description      VARCHAR(1000),
    project_id       BIGINT REFERENCES projects(id),
    organizer_id     BIGINT NOT NULL REFERENCES users(id),
    date_time        TIMESTAMP NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 60,
    jitsi_link       VARCHAR(500),
    status           VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
    created_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_meeting_project   ON meetings (project_id);
CREATE INDEX idx_meeting_organizer ON meetings (organizer_id);
CREATE INDEX idx_meeting_datetime  ON meetings (date_time);

-- meeting_participants (ManyToMany join table)
CREATE TABLE meeting_participants (
    meeting_id BIGINT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    user_id    BIGINT NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    PRIMARY KEY (meeting_id, user_id)
);

-- personal_tasks
CREATE TABLE personal_tasks (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT NOT NULL REFERENCES users(id),
    title        VARCHAR(255) NOT NULL,
    description  TEXT,
    priority     VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    status       VARCHAR(20) NOT NULL DEFAULT 'NEW',
    deadline     TIMESTAMP,
    completed_at TIMESTAMP,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_personal_task_user   ON personal_tasks (user_id);
CREATE INDEX idx_personal_task_status ON personal_tasks (status);

-- notes
CREATE TABLE notes (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL REFERENCES users(id),
    title      VARCHAR(255) NOT NULL,
    content    TEXT,
    color      VARCHAR(50) NOT NULL DEFAULT '#6366f1',
    pinned     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);

CREATE INDEX idx_note_user ON notes (user_id);

-- user_availability
CREATE TABLE user_availability (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id),
    date        DATE NOT NULL,
    hour_of_day INT NOT NULL,
    CONSTRAINT uq_avail_user_date_hour UNIQUE (user_id, date, hour_of_day)
);

CREATE INDEX idx_avail_user_date ON user_availability (user_id, date);

-- password_reset_tokens (if entity exists)
